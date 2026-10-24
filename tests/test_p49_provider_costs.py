"""P49: no-network provider switching, token telemetry, pricing provenance tests.

These tests use synthetic model fixtures, NOT paid benchmark evidence.
"""
import json
import os
import pathlib
import sys
import unittest
from datetime import date
from unittest.mock import Mock, patch

ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'api'))
from model_provider import chat_json, configured_provider, ProviderUnavailable
from model_costs import estimate_model_cost
from eval_observability import usage_counters, new_trace_id, record_evaluation

DAY=date(2026,10,24)
RATES={
    'GALAXY_PRICE_SOURCE':'azure-official-verified',
    'GALAXY_PRICE_ASOF':'2026-10-24',
    'GALAXY_INPUT_INR_PER_1M':'50',
    'GALAXY_OUTPUT_INR_PER_1M':'200',
    'GALAXY_CACHED_INR_PER_1M':'10',
}
SETTINGS={
    'GALAXY_MODEL_PROVIDER':'azure-openai',
    'AZURE_OPENAI_ENDPOINT':'https://private-southindia.openai.azure.com',
    'AZURE_OPENAI_DEPLOYMENT':'gpt-4.1-mini',
    'AZURE_OPENAI_API_KEY':'private-test-key-DO-NOT-COMMIT-REAL',
}
USAGE={'input_tokens':1000,'output_tokens':500,'total_tokens':1500}

class CostEstimatorTests(unittest.TestCase):
    def test_correct_full_cost_from_actual_usage(self):
        result=estimate_model_cost(USAGE,RATES,today=DAY)
        self.assertEqual(result['model_cost_estimate_inr'],'0.15000000')
        self.assertEqual(result['kind'],'configured_token_rate_estimate_not_azure_bill')
        self.assertEqual(result['currency'],'INR')

    def test_cache_usage_is_eligible_for_separate_price(self):
        usage=dict(USAGE,cached_input_tokens=250)
        result=estimate_model_cost(usage,RATES,today=DAY)
        self.assertEqual(result['model_cost_estimate_inr'],'0.14000000')

    def test_omitted_prices_or_provenance_not_silently_zero(self):
        for field in RATES:
            with self.subTest(field=field):
                rates=dict(RATES)
                rates.pop(field)
                # Cached rate not required when there are no cached tokens.
                if field!='GALAXY_CACHED_INR_PER_1M':
                    self.assertIsNone(estimate_model_cost(USAGE,rates,today=DAY))
        self.assertIsNotNone(estimate_model_cost(USAGE,dict(RATES, GALAXY_CACHED_INR_PER_1M=''),
                                               today=DAY))

    def test_invalid_or_stale_pricebook_returns_unknown(self):
        for field,value in (
            ('GALAXY_PRICE_SOURCE','guess'),
            ('GALAXY_PRICE_ASOF','2026-01-01'),
            ('GALAXY_PRICE_ASOF','2027-01-01'),
            ('GALAXY_PRICE_ASOF','2026-99-99'),
            ('GALAXY_INPUT_INR_PER_1M','-10'),
            ('GALAXY_INPUT_INR_PER_1M','NaN'),
            ('GALAXY_INPUT_INR_PER_1M','inf'),
            ('GALAXY_OUTPUT_INR_PER_1M','1e99'),
            ('GALAXY_OUTPUT_INR_PER_1M','10000000'),
        ):
            with self.subTest(field=field,value=value):
                rates=dict(RATES, **{field:value})
                self.assertIsNone(estimate_model_cost(USAGE,rates,today=DAY))

    def test_bad_provider_usage_returns_unknown(self):
        for usage in (
            {},dict(USAGE,input_tokens=True),dict(USAGE,output_tokens=-1),
            dict(USAGE,total_tokens=1501),dict(USAGE,cached_input_tokens=2000),
            dict(USAGE,cached_input_tokens=True)):
            with self.subTest(usage=str(usage)):
                self.assertIsNone(estimate_model_cost(usage,RATES,today=DAY))

    def test_os_environ_mapping_accepted_and_does_not_require_network(self):
        with patch.dict(os.environ,RATES):
            self.assertEqual(estimate_model_cost(USAGE,os.environ,today=DAY)
                             ['model_cost_estimate_inr'],'0.15000000')


class ProviderAbstractionTests(unittest.TestCase):
    def test_azure_endpoint_configuration_is_pinned_and_secret_private(self):
        model=configured_provider(SETTINGS)
        self.assertIn('2024-10-21',model['url'])
        self.assertTrue(model['url'].startswith('https://private-southindia.openai.azure.com/'))
        self.assertNotIn(model['secret_key'],model['url'])

    def test_no_unapproved_provider_or_external_openai_host(self):
        cases=(
          dict(SETTINGS,GALAXY_MODEL_PROVIDER='openai-direct'),
          dict(SETTINGS,AZURE_OPENAI_ENDPOINT='https://api.openai.com'),
          dict(SETTINGS,AZURE_OPENAI_ENDPOINT='http://private-southindia.openai.azure.com'),
          dict(SETTINGS,AZURE_OPENAI_ENDPOINT='https://private-southindia.openai.azure.com@evil.net'),
          dict(SETTINGS,AZURE_OPENAI_ENDPOINT='https://private-southindia.openai.azure.com/?foo=bar'),
          dict(SETTINGS,AZURE_OPENAI_ENDPOINT='https://private-southindia.openai.azure.com#fragment'),
          dict(SETTINGS,AZURE_OPENAI_ENDPOINT='https://private-southindia.openai.azure.com:invalid'),
          dict(SETTINGS,AZURE_OPENAI_DEPLOYMENT='../../../bad'),
          dict(SETTINGS,AZURE_OPENAI_API_KEY=''),
        )
        for bad in cases:
            with self.subTest(settings=list(bad)),self.assertRaises(ProviderUnavailable):
                configured_provider(bad)

    def test_single_json_call_extracts_real_usage_not_mocked_quality(self):
        mocked_response={
            'choices':[{'message':{'content':json.dumps({'reply':'Retrieved passage is relevant'})}}],
            'usage':{'prompt_tokens':1000,'completion_tokens':500,'total_tokens':1500,
                     'prompt_tokens_details':{'cached_tokens':250}},
        }
        network=Mock(return_value=mocked_response)
        content,usage=chat_json(
            messages=[{'role':'system','content':'Server reference'},
                      {'role':'user','content':'Untrusted question'}],
            max_tokens=650,request_json=network,
            usage_counters=usage_counters,settings=SETTINGS)
        self.assertEqual(content['reply'],'Retrieved passage is relevant')
        self.assertEqual(usage['cached_input_tokens'],250)
        self.assertEqual(network.call_count,1)
        call=network.call_args
        self.assertIn('api-key',call.kwargs['extra_headers'])
        self.assertNotIn('private-test-key',str(content))
        self.assertEqual(call.kwargs['payload']['max_tokens'],650)

    def test_bad_model_output_fails_without_fabricated_results(self):
        for content in ('not-json','[]','null','{"reply":'):
            with self.subTest(content=content),self.assertRaises(ProviderUnavailable):
                chat_json(messages=[{'role':'system','content':'server'},
                                    {'role':'user','content':'question'}],
                          max_tokens=100,request_json=lambda *a,**k:{
                            'choices':[{'message':{'content':content}}]},
                          usage_counters=usage_counters,settings=SETTINGS)
        with self.assertRaises(ProviderUnavailable):
            chat_json(messages=[{'role':'user','content':'hijack'}],
                      max_tokens=100,request_json=Mock(),
                      usage_counters=usage_counters,settings=SETTINGS)


class PrivacyTelemetryTests(unittest.TestCase):
    def test_nested_cache_tokens_strictly_bounded(self):
        usage=usage_counters({'usage':{'prompt_tokens':1000,
            'completion_tokens':500,'total_tokens':1500,
            'prompt_tokens_details':{'cached_tokens':125}}})
        self.assertEqual(usage['cached_input_tokens'],125)
        bad=usage_counters({'usage':{'prompt_tokens':1000,
            'completion_tokens':500,'total_tokens':1500,
            'prompt_tokens_details':{'cached_tokens':9999}}})
        self.assertNotIn('cached_input_tokens',bad)

    def test_conflicting_provider_totals_are_unknown_not_displayed_as_measured(self):
        inconsistent = usage_counters({'usage': {
            'prompt_tokens': 120, 'completion_tokens': 30,
            'total_tokens': 999,
            'prompt_tokens_details': {'cached_tokens': 20}}})
        self.assertEqual(inconsistent, {})
        self.assertIsNone(estimate_model_cost(inconsistent, RATES, today=DAY))
        self.assertEqual(usage_counters({'usage': {
            'prompt_tokens': 120, 'completion_tokens': 30,
            'total_tokens': 150}})['total_tokens'], 150)

    def test_log_only_includes_estimate_not_tokens_or_user_content(self):
        sensitive='PRIVATE-CANDIDATE-NAME'
        amount=estimate_model_cost(USAGE,RATES,today=DAY)
        with self.assertLogs('galaxy.evaluation',level='INFO') as captured:
            event=record_evaluation(trace_id=new_trace_id(),status=200,
                stage='completed',started_at=0,quota_result='reserved',
                usage=dict(USAGE,secret=sensitive),cost_estimate=amount)
        self.assertEqual(event['estimated_model_cost_inr'],'0.15000000')
        self.assertNotIn(sensitive,str(event))
        self.assertNotIn('user_id',event)
        self.assertNotIn('candidate_answer',event)
        self.assertEqual(event['cost_basis'],'configured_token_rates_not_billed')
        self.assertNotIn(sensitive,captured.output[0])

if __name__=='__main__':
    unittest.main()
