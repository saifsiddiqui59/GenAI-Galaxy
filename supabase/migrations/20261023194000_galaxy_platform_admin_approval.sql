-- Galaxy-only private owner control. REVIEW before applying to shared Supabase.
-- No changes to RetailGrowthAI, WineShopPOS, clinic, payment providers or existing data.
begin;
create schema if not exists galaxy_private;
revoke all on schema galaxy_private from public,anon,authenticated;
create table if not exists galaxy_private.platform_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 active boolean not null default true,
 granted_at timestamptz not null default now()
);
revoke all on galaxy_private.platform_admins from public,anon,authenticated;
-- Deliberately no hardcoded email or self-service admin bootstrap.
create or replace function galaxy_private.require_admin()
returns void language plpgsql security definer set search_path = ''
as $$
begin
 if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
    or not exists(select 1 from galaxy_private.platform_admins a where a.user_id=auth.uid() and a.active)
 then raise exception 'PLATFORM_ADMIN_REQUIRED' using errcode='42501'; end if;
end $$;
revoke all on function galaxy_private.require_admin() from public,anon,authenticated;
create table if not exists galaxy_private.signup_approvals (
 user_id uuid primary key references auth.users(id) on delete cascade,
 status text not null default 'PENDING' check(status in('PENDING','APPROVED','REJECTED')),
 requested_at timestamptz not null default now(),
 decided_at timestamptz,
 decided_by uuid references auth.users(id),
 reason text
);
revoke all on galaxy_private.signup_approvals from public,anon,authenticated;
-- Do not touch global auth.users: this Supabase project is shared with other apps.
-- Only users explicitly entering Galaxy may request access; no global signup trigger.
create or replace function public.galaxy_request_access()
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_status text;
begin
 if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
 then raise exception 'LOGIN_REQUIRED' using errcode='42501'; end if;
 insert into galaxy_private.signup_approvals(user_id) values(auth.uid())
 on conflict(user_id) do nothing;
 select status into v_status from galaxy_private.signup_approvals where user_id=auth.uid();
 return jsonb_build_object('status',v_status);
end $$;
revoke all on function public.galaxy_request_access() from public,anon;
grant execute on function public.galaxy_request_access() to authenticated;
-- Gate deliberately starts OFF; promotion to enforced admission requires tested release.
create table if not exists galaxy_private.approval_settings (
 singleton boolean primary key default true check(singleton),
 enforce_approval boolean not null default false
);
insert into galaxy_private.approval_settings(singleton,enforce_approval) values(true,false)
on conflict(singleton) do nothing;
revoke all on galaxy_private.approval_settings from public,anon,authenticated;

create table if not exists galaxy_private.platform_events (
 id bigint generated always as identity primary key,
 actor_id uuid not null references auth.users(id),
 target_id uuid not null references auth.users(id),
 action text not null check(action in('APPROVE','REJECT','ASSIGN_PLAN')),
 reason text not null check(length(reason) between 10 and 300),
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
revoke all on galaxy_private.platform_events from public,anon,authenticated;
create or replace function public.galaxy_account_approval()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_status text; v_gate boolean;
begin
 if auth.uid() is null then raise exception 'LOGIN_REQUIRED' using errcode='42501'; end if;
 select status into v_status from galaxy_private.signup_approvals where user_id=auth.uid();
 select enforce_approval into v_gate from galaxy_private.approval_settings where singleton=true;
 return jsonb_build_object('status',coalesce(v_status,'PENDING'),'approval_required',coalesce(v_gate,false));
end $$;
revoke all on function public.galaxy_account_approval() from public,anon;
grant execute on function public.galaxy_account_approval() to authenticated;

create or replace function public.galaxy_platform_summary()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v jsonb;
begin
 perform galaxy_private.require_admin();
 select jsonb_build_object(
 'accounts',(select count(*) from galaxy_private.signup_approvals),
 'pending',(select count(*) from galaxy_private.signup_approvals where status='PENDING'),
 'active_subscriptions',(select count(*) from public.genai_study_user_subscriptions where status in('ACTIVE','TRIALING')),
 'suspended',(select count(*) from public.genai_study_user_subscriptions where status='SUSPENDED')
 ) into v;
 return v;
end $$;
revoke all on function public.galaxy_platform_summary() from public,anon;
grant execute on function public.galaxy_platform_summary() to authenticated;
create or replace function public.galaxy_platform_pending(p_limit integer default 30)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v jsonb;
begin
 perform galaxy_private.require_admin();
 if p_limit not between 1 and 50 then raise exception 'INVALID_LIMIT'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('user_id',x.user_id,'email',x.email,'requested_at',x.requested_at) order by x.requested_at),'[]'::jsonb) into v
 from (
  select a.user_id,u.email,a.requested_at
  from galaxy_private.signup_approvals a join auth.users u on u.id=a.user_id
  where a.status='PENDING' order by a.requested_at limit p_limit
 ) x;
 return v;
end $$;
revoke all on function public.galaxy_platform_pending(integer) from public,anon;
grant execute on function public.galaxy_platform_pending(integer) to authenticated;
create or replace function public.galaxy_platform_review(p_user_id uuid,p_approve boolean,p_reason text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_status text;
begin
 perform galaxy_private.require_admin();
 if p_user_id is null or p_user_id=auth.uid() or p_approve is null or length(btrim(coalesce(p_reason,''))) not between 10 and 300
 then raise exception 'INVALID_REVIEW'; end if;
 v_status:=case when p_approve then 'APPROVED' else 'REJECTED' end;
 update galaxy_private.signup_approvals set status=v_status,decided_at=now(),decided_by=auth.uid(),reason=btrim(p_reason)
 where user_id=p_user_id and status='PENDING';
 if not found then raise exception 'NOT_PENDING'; end if;
 insert into galaxy_private.platform_events(actor_id,target_id,action,reason,details)
 values(auth.uid(),p_user_id,case when p_approve then 'APPROVE' else 'REJECT' end,btrim(p_reason),
 jsonb_build_object('status',v_status));
 return jsonb_build_object('user_id',p_user_id,'status',v_status);
end $$;
revoke all on function public.galaxy_platform_review(uuid,boolean,text) from public,anon;
grant execute on function public.galaxy_platform_review(uuid,boolean,text) to authenticated;
create or replace function public.galaxy_platform_assign_plan(p_user_id uuid,p_plan text,p_reason text,p_days integer default 30)
returns jsonb language plpgsql security definer set search_path=''
as $$
begin
 perform galaxy_private.require_admin();
 if p_user_id is null or p_plan not in('FREE','PLUS','PRO') or p_days not between 1 and 365
    or length(btrim(coalesce(p_reason,''))) not between 10 and 300
 then raise exception 'INVALID_PLAN_ASSIGNMENT'; end if;
 insert into public.genai_study_user_subscriptions(user_id,plan_code,status,period_ends_at,updated_at)
 values(p_user_id,p_plan,'ACTIVE',now()+make_interval(days=>p_days),now())
 on conflict(user_id) do update set plan_code=excluded.plan_code,status='ACTIVE',
  period_ends_at=excluded.period_ends_at,updated_at=now();
 insert into galaxy_private.platform_events(actor_id,target_id,action,reason,details)
 values(auth.uid(),p_user_id,'ASSIGN_PLAN',btrim(p_reason),
 jsonb_build_object('plan',p_plan,'days',p_days));
 return jsonb_build_object('user_id',p_user_id,'plan_code',p_plan,'status','ACTIVE');
end $$;
revoke all on function public.galaxy_platform_assign_plan(uuid,text,text,integer) from public,anon;
grant execute on function public.galaxy_platform_assign_plan(uuid,text,text,integer) to authenticated;
commit;
