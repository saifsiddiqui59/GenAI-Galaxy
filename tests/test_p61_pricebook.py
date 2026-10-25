"""P61: public pricing evidence is exact regional/meter/currency, not invoice."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parent.parent

class PricebookDeploymentGuard(unittest.TestCase):
 def test_backend_only_verified_regional_meter(self):
  workflow=(ROOT/'.github/workflows/galaxy-p3-flex-deploy.yml').read_text()
  model=(ROOT/'api/model_costs.py').read_text()
  docs=(ROOT/'docs/ai/P61_VERIFIED_SOUTH_INDIA_INR.md').read_text()
  for key,value in {'GALAXY_PRICE_SOURCE':'azure-official-verified','GALAXY_PRICE_ASOF':'2026-10-25','GALAXY_INPUT_INR_PER_1M':'42.2','GALAXY_OUTPUT_INR_PER_1M':'168.9','GALAXY_CACHED_INR_PER_1M':'10.6'}.items():
   self.assertIn(key+'='+value,workflow)
   self.assertNotIn(key+'=',(ROOT/'runtime-config.js').read_text())
  self.assertIn('MAX_AGE_DAYS = 45',model)
  self.assertIn('model_cost_estimate_inr',model)
  self.assertIn('southindia',workflow)
  self.assertIn('alwaysReady',workflow)
  for sku in ('gpt 4.1 mini Inp regnl','gpt 4.1 mini Outp regnl','gpt 4.1 mini cached Inp regnl'):
   self.assertIn(sku,docs)
  self.assertIn('not the actual contract invoice',docs)

if __name__=='__main__':
 unittest.main()
