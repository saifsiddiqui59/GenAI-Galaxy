"""Offline-only checks for the Galaxy Azure Cost Management report; no API calls."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from report_galaxy_azure_cost import interpret, make_summary


def sample():
    return {
        "properties": {
            "nextLink": None,
            "columns": [
                {"name": "totalCost"}, {"name": "ServiceName"},
                {"name": "UsageDate"}, {"name": "Currency"}
            ],
            "rows": [
                [12.5, "Azure OpenAI", 20261022, "INR"],
                [7.25, "Azure Functions", 20261023, "INR"],
                [1.75, "Azure OpenAI", 20261024, "INR"],
            ],
        }
    }


class GalaxyAzureCostTests(unittest.TestCase):
    def test_aggregate_all_rows_and_service_breakdown(self):
        totals, services, count = interpret(sample())
        self.assertEqual(count, 3)
        self.assertEqual(str(totals["INR"]), "21.50")
        self.assertEqual(str(services[("INR", "Azure OpenAI")]), "14.25")
        self.assertIn("21.5000", make_summary(totals, services, count))

    def test_check_mode_never_discloses_monetary_amounts(self):
        with tempfile.TemporaryDirectory() as d:
            source = Path(d) / "response.json"
            summary = Path(d) / "summary.md"
            source.write_text(json.dumps(sample()))
            p = subprocess.run(
                [sys.executable, str(ROOT / "scripts/report_galaxy_azure_cost.py"),
                 "--input", str(source), "--mode", "CHECK", "--summary", str(summary)],
                text=True, capture_output=True, check=True
            )
            self.assertIn("AUTHORIZED", p.stdout)
            self.assertNotIn("21.5", p.stdout + summary.read_text())
            self.assertNotIn("Azure OpenAI", p.stdout + summary.read_text())

    def test_refuse_incomplete_or_bad_data(self):
        data = sample()
        data["properties"]["nextLink"] = "https://example.org/next"
        with self.assertRaisesRegex(ValueError, "incomplete totals"):
            interpret(data)
        data = sample()
        data["properties"]["rows"][0][0] = "NaN"
        with self.assertRaisesRegex(ValueError, "Invalid Azure cost"):
            interpret(data)

    def test_empty_rows_are_not_claimed_as_zero_bill(self):
        data = sample()
        data["properties"]["rows"] = []
        totals, services, count = interpret(data)
        self.assertIn("does not confirm a zero bill", make_summary(totals, services, count))

    def test_workflow_is_manual_only_and_galaxy_scoped(self):
        body = (ROOT / ".github/workflows/galaxy-cost-management-readonly.yml").read_text()
        self.assertIn("workflow_dispatch:", body)
        self.assertIn("GenAI_Galaxy/providers/Microsoft.CostManagement/query", body)
        self.assertIn("REPORT_PUBLIC", body)
        self.assertIn("environment: dev", body)
        self.assertNotIn("schedule:", body)
        self.assertNotIn("\n  push:", body)
        self.assertNotIn("\n  pull_request:", body)


if __name__ == "__main__":
    unittest.main()
