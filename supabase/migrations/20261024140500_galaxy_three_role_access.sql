-- P42: Galaxy-scoped three-role authorization. No Auth, customer, or cross-app changes.
-- No user accounts are created and no owner is automatically promoted.
begin;

alter table galaxy_private.platform_admins
  add column if not exists admin_role text not null default 'SUPER_ADMIN';

alter table galaxy_private.platform_admins
  add constraint galaxy_platform_admin_role_check
  check (admin_role in ('SUPER_ADMIN', 'ADMIN'));

revoke all on galaxy_private.platform_admins from public, anon, authenticated;

create or replace function galaxy_private.require_super_admin()
returns void language plpgsql stable security definer set search_path=''
as $$
begin
 if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
 or not exists (
   select 1 from galaxy_private.platform_admins a
   where a.user_id=auth.uid() and a.active=true and a.admin_role='SUPER_ADMIN'
 )
 then raise exception 'GALAXY_SUPER_ADMIN_REQUIRED' using errcode='42501'; end if;
end $$;
revoke all on function galaxy_private.require_super_admin() from public,anon,authenticated;

create or replace function public.galaxy_my_platform_role()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_role text;
begin
 if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
 then raise exception 'LOGIN_REQUIRED' using errcode='42501'; end if;
 select a.admin_role into v_role from galaxy_private.platform_admins a
 where a.user_id=auth.uid() and a.active=true;
 return pg_catalog.jsonb_build_object('role',coalesce(v_role,'USER'));
end $$;
revoke all on function public.galaxy_my_platform_role() from public,anon;
grant execute on function public.galaxy_my_platform_role() to authenticated;

-- Legacy broad plan-assignment RPC is no longer used by the Galaxy web app.
-- Revoke it entirely from browser roles to close the P25 privilege-bypass path.
revoke all on function public.galaxy_platform_assign_plan(uuid,text,text,integer)
  from public,anon,authenticated;

-- P37 subscription changes require SUPER_ADMIN; all other read/review administrator
-- functions continue to use galaxy_private.require_admin() and permit ADMIN.
create or replace function public.galaxy_platform_manage_subscription(
 p_user_id uuid,p_plan text,p_status text,p_days integer,p_reason text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_old jsonb; v_new jsonb;
begin
  perform galaxy_private.require_super_admin();
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

commit;
