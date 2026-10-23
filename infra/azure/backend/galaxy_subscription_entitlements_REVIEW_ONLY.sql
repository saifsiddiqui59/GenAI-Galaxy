-- Galaxy-only freemium subscription entitlement groundwork.
-- NO payment processing; only trusted backend/DB admin may activate paid plans.
-- Never references WineShopPOS, clinic, tenant or existing subscription tables.
-- Owner's current FREE 5/day entitlement stays unchanged.
CREATE TABLE IF NOT EXISTS public.genai_study_plan_catalog (
  code text PRIMARY KEY CHECK (code IN ('FREE','PLUS','PRO')),
  display_name text NOT NULL,
  daily_eval_limit integer NOT NULL CHECK (daily_eval_limit BETWEEN 1 AND 20),
  price_inr_monthly numeric(10,2),
  enabled boolean NOT NULL DEFAULT true,
  CHECK (price_inr_monthly IS NULL OR price_inr_monthly >= 0)
);
INSERT INTO public.genai_study_plan_catalog
  (code,display_name,daily_eval_limit,price_inr_monthly,enabled)
VALUES ('FREE','Free',5,NULL,true),
       ('PLUS','Plus',10,NULL,true),
       ('PRO','Pro',20,NULL,true)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.genai_study_user_subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code text NOT NULL REFERENCES public.genai_study_plan_catalog(code),
  status text NOT NULL CHECK (status IN ('ACTIVE','TRIALING','PAST_DUE','SUSPENDED','CANCELLED','EXPIRED')),
  trial_ends_at timestamptz,
  period_ends_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (plan_code <> 'FREE' OR status <> 'TRIALING')
);
ALTER TABLE public.genai_study_plan_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genai_study_user_subscriptions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.genai_study_plan_catalog FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.genai_study_user_subscriptions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.genai_study_plan_catalog TO anon, authenticated;
GRANT SELECT ON public.genai_study_user_subscriptions TO authenticated;

CREATE POLICY genai_study_plan_catalog_public_read
  ON public.genai_study_plan_catalog
  FOR SELECT TO anon, authenticated USING (enabled = true);
CREATE POLICY genai_study_subscription_owner_read
  ON public.genai_study_user_subscriptions
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- This carefully scoped definer reads only the authenticated caller's row.
-- Privileged subscription writes are NOT exposed via any client RPC.
CREATE OR REPLACE FUNCTION public.genai_study_my_subscription()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $func$
DECLARE
  v_user uuid := auth.uid();
  v_plan text;
  v_status text;
  v_trial timestamptz;
  v_period timestamptz;
  v_limit integer;
BEGIN
  IF v_user IS NULL OR COALESCE((auth.jwt()->>'is_anonymous')::boolean,false) THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000';
  END IF;
  SELECT s.plan_code,s.status,s.trial_ends_at,s.period_ends_at,p.daily_eval_limit
    INTO v_plan,v_status,v_trial,v_period,v_limit
    FROM public.genai_study_user_subscriptions s
    JOIN public.genai_study_plan_catalog p ON p.code=s.plan_code
   WHERE s.user_id=v_user AND p.enabled=true;

  IF v_status = 'SUSPENDED' THEN
    RETURN pg_catalog.jsonb_build_object('plan_code',COALESCE(v_plan,'FREE'),
             'status','SUSPENDED','allowed',false,'daily_eval_limit',0);
  END IF;

  IF NOT FOUND
    OR v_status NOT IN ('ACTIVE','TRIALING')
    OR (v_plan <> 'FREE' AND
         ((v_status='TRIALING' AND (v_trial IS NULL OR v_trial<=pg_catalog.now()))
          OR (v_status='ACTIVE' AND (v_period IS NULL OR v_period<=pg_catalog.now()))))
  THEN
    RETURN pg_catalog.jsonb_build_object('plan_code','FREE',
              'status','ACTIVE','allowed',true,'daily_eval_limit',5);
  END IF;
  RETURN pg_catalog.jsonb_build_object('plan_code',v_plan,'status',v_status,
     'allowed',true,'daily_eval_limit',v_limit,
     'expires_at',CASE WHEN v_status='TRIALING' THEN v_trial ELSE v_period END);
END;
$func$;
REVOKE ALL ON FUNCTION public.genai_study_my_subscription() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.genai_study_my_subscription() TO authenticated;

-- Existing quota safety remains: global 50 UTC-day evaluations; caps are
-- now based on trusted server-side plan. Never accept plan in an API payload.
ALTER TABLE public.genai_study_eval_user_daily
  DROP CONSTRAINT IF EXISTS genai_study_eval_user_daily_calls_check;
ALTER TABLE public.genai_study_eval_user_daily
  ADD CONSTRAINT genai_study_eval_user_daily_calls_check
  CHECK (calls BETWEEN 0 AND 20);

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
  IF v_user IS NULL OR COALESCE((auth.jwt()->>'is_anonymous')::boolean,false) THEN
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
