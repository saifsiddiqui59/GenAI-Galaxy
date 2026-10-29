-- P82: Lock all metered AI usage while preserving existing FREE/PLUS/PRO catalog.
-- SAFE on shared Supabase: changes only Galaxy-owned quota RPC.
-- Paused for every plan, including PRO, until separately reviewed live release.
-- Existing approved-user and global quota protections are preserved.
begin;
create or replace function public.genai_study_reserve_evaluation()
returns boolean language plpgsql security definer set search_path=''
as $fn$
declare
  v_user uuid := auth.uid();
  v_day date := (pg_catalog.now() at time zone 'UTC')::date;
  v_subscription jsonb;
  v_cap integer;
  v_user_count integer;
  v_global_count integer;
  v_paid_features_released boolean := false; -- launch gate: DO NOT auto-enable
begin
  if v_user is null
    or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
    or not public.galaxy_access_allowed()
  then return false; end if;

  -- Fail closed BEFORE quota writes and before ANY Azure model call.
  -- No browser request, subscription row or user preference can enable this.
  if not v_paid_features_released then return false; end if;

  perform pg_catalog.pg_advisory_xact_lock(2026102301);
  v_subscription := public.genai_study_my_subscription();
  if (v_subscription->>'plan_code') is distinct from 'PRO'
    or (v_subscription->>'allowed')::boolean is distinct from true
    or (v_subscription->>'status') not in ('ACTIVE','TRIALING')
  then return false; end if;
  v_cap := (v_subscription->>'daily_eval_limit')::integer;
  if v_cap is null or v_cap < 1 or v_cap > 20 then return false; end if;

  select calls into v_user_count from public.genai_study_eval_user_daily
    where user_id=v_user and usage_day=v_day;
  select calls into v_global_count from public.genai_study_eval_global_daily
    where usage_day=v_day;
  if coalesce(v_user_count,0)>=v_cap or coalesce(v_global_count,0)>=50
  then return false; end if;

  insert into public.genai_study_eval_user_daily(user_id,usage_day,calls)
    values(v_user,v_day,1)
    on conflict(user_id,usage_day) do update
      set calls=public.genai_study_eval_user_daily.calls+1;
  insert into public.genai_study_eval_global_daily(usage_day,calls)
    values(v_day,1)
    on conflict(usage_day) do update
      set calls=public.genai_study_eval_global_daily.calls+1;
  return true;
end;
$fn$;
revoke all on function public.genai_study_reserve_evaluation() from public,anon;
grant execute on function public.genai_study_reserve_evaluation() to authenticated;
commit;
