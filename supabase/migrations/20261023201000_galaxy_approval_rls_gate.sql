-- Galaxy-only staged approval enforcement; OFF by default. Never modify global Auth.
begin;
create or replace function public.galaxy_access_allowed()
returns boolean language plpgsql stable security definer set search_path=''
as $$
declare enforced boolean;
begin
 if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
 then return false; end if;
 select enforce_approval into enforced from galaxy_private.approval_settings where singleton=true;
 if coalesce(enforced,false)=false then return true; end if;
 return exists(select 1 from galaxy_private.platform_admins a where a.user_id=auth.uid() and a.active)
   or exists(select 1 from galaxy_private.signup_approvals q where q.user_id=auth.uid() and q.status='APPROVED');
end $$;
revoke all on function public.galaxy_access_allowed() from public,anon;
grant execute on function public.galaxy_access_allowed() to authenticated;

-- Preserve the exact existing Galaxy ownership checks and add an AND approval gate.
alter policy genai_study_progress_select_own on public.genai_study_progress to authenticated
 using (auth.uid()=user_id and (select public.galaxy_access_allowed()));
alter policy genai_study_progress_insert_own on public.genai_study_progress to authenticated
 with check(auth.uid()=user_id and (select public.galaxy_access_allowed()));
alter policy genai_study_progress_update_own on public.genai_study_progress to authenticated
 using(auth.uid()=user_id and (select public.galaxy_access_allowed()))
 with check(auth.uid()=user_id and (select public.galaxy_access_allowed()));
alter policy genai_study_progress_delete_own on public.genai_study_progress to authenticated
 using(auth.uid()=user_id and (select public.galaxy_access_allowed()));
alter policy genai_attempts_select_own on public.genai_study_attempts to authenticated
 using(auth.uid()=user_id and (select public.galaxy_access_allowed()));
alter policy genai_attempts_insert_own on public.genai_study_attempts to authenticated
 with check(auth.uid()=user_id and (select public.galaxy_access_allowed()));
alter policy genai_attempts_delete_own on public.genai_study_attempts to authenticated
 using(auth.uid()=user_id and (select public.galaxy_access_allowed()));
alter policy genai_documents_select_own on public.genai_study_documents to authenticated
 using(auth.uid()=user_id and (select public.galaxy_access_allowed()));
alter policy genai_documents_insert_own on public.genai_study_documents to authenticated
 with check(auth.uid()=user_id and (file_path is null or file_path like auth.uid()::text||'/%') and (select public.galaxy_access_allowed()));
alter policy genai_documents_update_own on public.genai_study_documents to authenticated
 using(auth.uid()=user_id and (select public.galaxy_access_allowed()))
 with check(auth.uid()=user_id and (file_path is null or file_path like auth.uid()::text||'/%') and (select public.galaxy_access_allowed()));
alter policy genai_documents_delete_own on public.genai_study_documents to authenticated
 using(auth.uid()=user_id and (select public.galaxy_access_allowed()));
-- Only the Galaxy study bucket's three policies are changed; other buckets untouched.
alter policy genai_docs_objects_select on storage.objects to authenticated
 using(bucket_id='genai-study-docs' and (storage.foldername(name))[1]=auth.uid()::text and (select public.galaxy_access_allowed()));
alter policy genai_docs_objects_insert on storage.objects to authenticated
 with check(bucket_id='genai-study-docs' and (storage.foldername(name))[1]=auth.uid()::text and (select public.galaxy_access_allowed()));
alter policy genai_docs_objects_delete on storage.objects to authenticated
 using(bucket_id='genai-study-docs' and (storage.foldername(name))[1]=auth.uid()::text and (select public.galaxy_access_allowed()));

-- Reuse existing atomic FREE/PLUS/PRO reservation: approval checked BEFORE quota is consumed.
CREATE OR REPLACE FUNCTION public.genai_study_reserve_evaluation()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $func$
DECLARE
  v_user uuid := auth.uid();
  v_day date := (pg_catalog.now() AT TIME ZONE 'UTC')::date;
  v_subscription jsonb;
  v_cap integer;
  v_user_count integer;
  v_global_count integer;
BEGIN
  IF v_user IS NULL OR COALESCE((auth.jwt()->>'is_anonymous')::boolean,false)
    OR NOT public.galaxy_access_allowed() THEN
    RETURN false;
  END IF;
  -- Atomic lock protects both subscription lookup and quota consumption.
  PERFORM pg_catalog.pg_advisory_xact_lock(2026102301);
  v_subscription := public.genai_study_my_subscription();
  IF (v_subscription ->>'allowed')::boolean IS DISTINCT FROM true THEN
    RETURN false;
  END IF;
  v_cap := (v_subscription ->>'daily_eval_limit')::integer;
  IF v_cap IS NULL OR v_cap < 1 OR v_cap > 20 THEN
    RETURN false;
  END IF;
  SELECT calls INTO v_user_count FROM public.genai_study_eval_user_daily
    WHERE user_id=v_user AND usage_day=v_day;
  SELECT calls INTO v_global_count FROM public.genai_study_eval_global_daily
    WHERE usage_day=v_day;
  IF COALESCE(v_user_count,0)>=v_cap OR COALESCE(v_global_count,0)>=50 THEN
    RETURN false;
  END IF;
  INSERT INTO public.genai_study_eval_user_daily (user_id, usage_day, calls)
    VALUES (v_user,v_day,1)
    ON CONFLICT (user_id,usage_day) DO UPDATE
    SET calls=public.genai_study_eval_user_daily.calls+1;
  INSERT INTO public.genai_study_eval_global_daily (usage_day,calls)
    VALUES (v_day,1)
    ON CONFLICT (usage_day) DO UPDATE
    SET calls=public.genai_study_eval_global_daily.calls+1;
  RETURN true;
END;
$func$;
REVOKE ALL ON FUNCTION public.genai_study_reserve_evaluation() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.genai_study_reserve_evaluation() TO authenticated;
commit;
