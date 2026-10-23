-- REVIEW-ONLY SQL. Apply only to existing Galaxy-owned objects after explicit
-- hosted Supabase migration approval. Never modify clinic/voice tables.
-- Low-cost evaluator guardrail: authenticated user 5/day; all users 50/day.
-- Each reserve is a single transaction, including both counters.
CREATE TABLE IF NOT EXISTS public.genai_study_eval_user_daily (
  user_id uuid NOT NULL,
  usage_day date NOT NULL,
  calls integer NOT NULL DEFAULT 0 CHECK (calls BETWEEN 0 AND 5),
  PRIMARY KEY (user_id, usage_day)
);
CREATE TABLE IF NOT EXISTS public.genai_study_eval_global_daily (
  usage_day date PRIMARY KEY,
  calls integer NOT NULL DEFAULT 0 CHECK (calls BETWEEN 0 AND 50)
);
ALTER TABLE public.genai_study_eval_user_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genai_study_eval_global_daily ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.genai_study_eval_user_daily FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.genai_study_eval_global_daily FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.genai_study_reserve_evaluation()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user uuid;
  v_day date := (pg_catalog.now() AT TIME ZONE 'UTC')::date;
  v_count_user integer;
  v_count_global integer;
BEGIN
  -- Credentials originate from PostgREST's verified Supabase user JWT.
  -- No caller-provided identity, limit, date, counter or account is trusted.
  v_user := auth.uid();
  IF v_user IS NULL OR
     pg_catalog.coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) THEN
    RETURN false;
  END IF;

  -- Serialize every reservation, across all Function instances/regions.
  -- The lock is transaction-scoped; no always-on Redis is needed.
  PERFORM pg_catalog.pg_advisory_xact_lock(2026102301);

  SELECT calls INTO v_count_user
    FROM public.genai_study_eval_user_daily
   WHERE user_id = v_user AND usage_day = v_day;
  SELECT calls INTO v_count_global
    FROM public.genai_study_eval_global_daily
   WHERE usage_day = v_day;

  IF pg_catalog.coalesce(v_count_user, 0) >= 5
     OR pg_catalog.coalesce(v_count_global, 0) >= 50 THEN
    RETURN false;
  END IF;

  INSERT INTO public.genai_study_eval_user_daily (user_id, usage_day, calls)
  VALUES (v_user, v_day, 1)
  ON CONFLICT (user_id, usage_day)
  DO UPDATE SET calls = public.genai_study_eval_user_daily.calls + 1;

  INSERT INTO public.genai_study_eval_global_daily (usage_day, calls)
  VALUES (v_day, 1)
  ON CONFLICT (usage_day)
  DO UPDATE SET calls = public.genai_study_eval_global_daily.calls + 1;

  RETURN true;
END;
$function$;

-- Restrict exposed SECURITY DEFINER RPC to signed-in users. The function
-- checks auth.uid() and never returns private records or privileged access.
REVOKE ALL ON FUNCTION public.genai_study_reserve_evaluation() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.genai_study_reserve_evaluation() FROM anon;
GRANT EXECUTE ON FUNCTION public.genai_study_reserve_evaluation() TO authenticated;
