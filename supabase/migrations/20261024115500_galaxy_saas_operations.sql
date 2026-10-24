-- P37: Galaxy-only SaaS operations, modeled on RetailGrowthAI/WineShopPOS patterns.
-- Safe on shared Supabase: no global auth.users triggers, no other project data.
-- Admin RPCs authorize on EVERY request via private allowlist.
begin;

create or replace function public.galaxy_platform_summary()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v jsonb;
begin
  perform galaxy_private.require_admin();
  select pg_catalog.jsonb_build_object(
    'accounts', (select count(*) from galaxy_private.signup_approvals),
    'pending', (select count(*) from galaxy_private.signup_approvals where status='PENDING'),
    'approved', (select count(*) from galaxy_private.signup_approvals where status='APPROVED'),
    'rejected', (select count(*) from galaxy_private.signup_approvals where status='REJECTED'),
    'active_subscriptions', (select count(*) from public.genai_study_user_subscriptions s
                            where s.status in ('ACTIVE','TRIALING') and s.plan_code <> 'FREE'
                              and coalesce(case when s.status='TRIALING' then s.trial_ends_at else s.period_ends_at end, 'epoch'::timestamptz)>now()),
    'suspended', (select count(*) from public.genai_study_user_subscriptions where status='SUSPENDED'),
    'expired_or_past_due', (select count(*) from public.genai_study_user_subscriptions s
        where s.status in ('EXPIRED','PAST_DUE','CANCELLED')
           or (s.plan_code <> 'FREE' and s.status in ('ACTIVE','TRIALING')
               and coalesce(case when s.status='TRIALING' then s.trial_ends_at else s.period_ends_at end,'epoch'::timestamptz)<=now())),
    'expiring_in_7_days', (select count(*) from public.genai_study_user_subscriptions s
       where s.plan_code <> 'FREE' and s.status in ('ACTIVE','TRIALING')
         and case when s.status='TRIALING' then s.trial_ends_at else s.period_ends_at end
             between now() and now()+interval '7 days'),
    'learning_users', (select count(distinct user_id) from public.genai_study_progress),
    'practice_attempts_7d', (select count(*) from public.genai_study_attempts where created_at>=now()-interval '7 days'),
    'ai_evaluations_today', (select coalesce(sum(calls),0) from public.genai_study_eval_global_daily
         where usage_day=(now() at time zone 'UTC')::date),
    'ai_global_daily_cap', 50,
    'subscription_payment_revenue_inr', null,
    'azure_actual_spend_inr', null,
    'backend_error_rate', null,
    'payments_enabled', false
  ) into v;
  return v;
end $$;
revoke all on function public.galaxy_platform_summary() from public,anon;
grant execute on function public.galaxy_platform_summary() to authenticated;

-- Scoped union prevents exposing identities of users in unrelated apps on shared Auth.
create or replace function public.galaxy_platform_accounts(p_limit integer default 25,p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_rows jsonb; v_total bigint;
begin
  perform galaxy_private.require_admin();
  if p_limit is null or p_limit not between 1 and 50
    or p_offset is null or p_offset not between 0 and 100000
  then raise exception 'INVALID_PAGE' using errcode='22023'; end if;
  with known as (
    select user_id from galaxy_private.signup_approvals
    union select user_id from public.genai_study_user_subscriptions
    union select user_id from public.genai_study_progress
  )
  select count(*) into v_total from known;
  with known as (
    select user_id from galaxy_private.signup_approvals
    union select user_id from public.genai_study_user_subscriptions
    union select user_id from public.genai_study_progress
  ), page as (
    select k.user_id,u.email,u.created_at,u.last_sign_in_at,
      coalesce(a.status,'NOT_REQUESTED') approval,
      coalesce(s.plan_code,'FREE') plan_code,
      coalesce(s.status,'ACTIVE') subscription_status,
      case when s.status='TRIALING' then s.trial_ends_at else s.period_ends_at end expires_at,
      coalesce((select count(*) from public.genai_study_progress p where p.user_id=k.user_id),0) topics_started,
      coalesce((select sum(q.calls) from public.genai_study_eval_user_daily q where q.user_id=k.user_id
            and q.usage_day=(now() at time zone 'UTC')::date),0) evaluations_today
    from known k join auth.users u on u.id=k.user_id
    left join galaxy_private.signup_approvals a on a.user_id=k.user_id
    left join public.genai_study_user_subscriptions s on s.user_id=k.user_id
    order by u.created_at desc,k.user_id limit p_limit offset p_offset
  )
  select coalesce(jsonb_agg(jsonb_build_object('user_id',p.user_id,'email',p.email,
    'created_at',p.created_at,'last_sign_in_at',p.last_sign_in_at,'approval',p.approval,
    'plan_code',p.plan_code,'subscription_status',p.subscription_status,'expires_at',p.expires_at,
    'topics_started',p.topics_started,'evaluations_today',p.evaluations_today)
    order by p.created_at desc),'[]'::jsonb) into v_rows from page p;
  return jsonb_build_object('total',v_total,'offset',p_offset,'limit',p_limit,'accounts',v_rows);
end $$;
revoke all on function public.galaxy_platform_accounts(integer,integer) from public,anon;
grant execute on function public.galaxy_platform_accounts(integer,integer) to authenticated;

create or replace function public.galaxy_platform_audit(p_limit integer default 15)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v jsonb;
begin
  perform galaxy_private.require_admin();
  if p_limit not between 1 and 50 then raise exception 'INVALID_LIMIT'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('action',ev.action,'reason',ev.reason,
     'created_at',ev.created_at,'target_id',ev.target_id,
     'details',ev.details) order by ev.created_at desc),'[]'::jsonb)
  into v from (select * from galaxy_private.platform_events order by created_at desc limit p_limit) ev;
  return v;
end $$;
revoke all on function public.galaxy_platform_audit(integer) from public,anon;
grant execute on function public.galaxy_platform_audit(integer) to authenticated;

-- Operator can renew, downgrade, suspend or cancel with an auditable explanation.
-- No self-activation, no payment transaction, and only enrolled Galaxy users.
create or replace function public.galaxy_platform_manage_subscription(
 p_user_id uuid,p_plan text,p_status text,p_days integer,p_reason text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_old jsonb; v_new jsonb;
begin
  perform galaxy_private.require_admin();
  if p_user_id is null or p_user_id=auth.uid() or p_plan not in ('FREE','PLUS','PRO')
     or p_status not in ('ACTIVE','PAST_DUE','SUSPENDED','CANCELLED','EXPIRED')
     or (p_plan='FREE' and p_status <> 'ACTIVE') or p_days not between 1 and 365
     or length(btrim(coalesce(p_reason,''))) not between 10 and 300
  then raise exception 'INVALID_SUBSCRIPTION_ACTION' using errcode='22023'; end if;
  if not exists(select 1 from galaxy_private.signup_approvals a
                where a.user_id=p_user_id and a.status='APPROVED')
  then raise exception 'GALAXY_APPROVAL_REQUIRED' using errcode='42501'; end if;
  if not exists(select 1 from public.genai_study_plan_catalog
                where code=p_plan and enabled=true) then raise exception 'PLAN_UNAVAILABLE'; end if;
  select to_jsonb(s) into v_old from public.genai_study_user_subscriptions s
    where s.user_id=p_user_id for update;
  insert into public.genai_study_user_subscriptions(user_id,plan_code,status,trial_ends_at,period_ends_at,updated_at)
  values(p_user_id,p_plan,p_status,null,now()+make_interval(days=>p_days),now())
  on conflict(user_id) do update set plan_code=excluded.plan_code,status=excluded.status,
    trial_ends_at=null,period_ends_at=excluded.period_ends_at,updated_at=now();
  select to_jsonb(s) into v_new from public.genai_study_user_subscriptions s where s.user_id=p_user_id;
  insert into galaxy_private.platform_events(actor_id,target_id,action,reason,details)
  values(auth.uid(),p_user_id,'ASSIGN_PLAN',btrim(p_reason),
       jsonb_build_object('before',coalesce(v_old,'null'::jsonb),'after',v_new,'action','MANAGE_SUBSCRIPTION'));
  return jsonb_build_object('user_id',p_user_id,'plan_code',p_plan,'status',p_status,
      'expires_at',v_new->'period_ends_at');
end $$;
revoke all on function public.galaxy_platform_manage_subscription(uuid,text,text,integer,text) from public,anon;
grant execute on function public.galaxy_platform_manage_subscription(uuid,text,text,integer,text) to authenticated;

-- Own lifecycle details allow WSP-style in-app notices even when current effective
-- entitlement has fallen back to FREE after the previous paid plan expired.
create or replace function public.galaxy_my_plan_lifecycle()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_user uuid:=auth.uid(); v jsonb;
begin
 if v_user is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
 then raise exception 'LOGIN_REQUIRED' using errcode='42501'; end if;
 select jsonb_build_object('plan_code',s.plan_code,'status',s.status,
       'expires_at',case when s.status='TRIALING' then s.trial_ends_at else s.period_ends_at end,
       'updated_at',s.updated_at)
 into v from public.genai_study_user_subscriptions s where s.user_id=v_user;
 return coalesce(v,jsonb_build_object('plan_code','FREE','status','ACTIVE','expires_at',null));
end $$;
revoke all on function public.galaxy_my_plan_lifecycle() from public,anon;
grant execute on function public.galaxy_my_plan_lifecycle() to authenticated;
commit;
