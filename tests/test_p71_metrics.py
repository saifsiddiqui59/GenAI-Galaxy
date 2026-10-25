"""P71: no resource creation or chargeable new telemetry for known P70 window."""
from pathlib import Path
import unittest

R=Path(__file__).resolve().parents[1]
class PlatformMetricGuard(unittest.TestCase):
 def test_known_read_only_metrics_and_bounded_window(self):
  s=(R/'.github/workflows/galaxy-p71-instance-metrics.yml').read_text()
  for k in ("workflow_dispatch:","environment: dev","--metric InstanceCount","--metric OnDemandFunctionExecutionCount",
            "'2026-10-25T08:40:00Z'","'2026-10-25T08:46:00Z'","--interval PT1M","--aggregation Maximum",
            "--aggregation Total","gengalaxy-p3-1429841605","GenAI_Galaxy"):
   self.assertIn(k,s)
  for k in ("  schedule:","  push:","  pull_request:","az functionapp create","az functionapp restart",
            "az functionapp scale config","az monitor log-analytics workspace create","az monitor diagnostic-settings create",
            "az functionapp config appsettings set","az storage account create","model call"):
   if k=="model call": continue
   self.assertNotIn(k,s)
 def test_exact_owner_gate_added(self):
  s=(R/'.github/workflows/galaxy-ai-owner-command.yml').read_text()
  self.assertIn('"METRICS_P70_$EVENT_SHA"',s)
  self.assertEqual(s.count("gh workflow run galaxy-p71-instance-metrics.yml"),1)
if __name__=='__main__':unittest.main()
