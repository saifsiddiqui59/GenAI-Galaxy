"""P22 adaptive learning interface regression contracts; no model or network calls."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "app.js").read_text(encoding="utf-8")

class AdaptiveLearningUpgradeTests(unittest.TestCase):
    def test_primary_controls_exist_before_scoring(self):
        question = SOURCE.index('id="top-teach"')
        scoring = SOURCE.index('LOCAL CONCEPT CHECK · NOT A FACTUAL GRADE')
        self.assertLess(question, scoring)
        for button in ['id="top-skip"', 'id="top-hint"', 'id="adaptive-next-topic"',
                       'id="lesson-next"', 'id="lesson-teach"']:
            self.assertIn(button, SOURCE)

    def test_modes_and_mock_limits(self):
        for token in ["'learn','practice','mock'", "limit:5", "function finishMockSession()",
                      "function trackMockQuestion(", "Question ${Math.min(state.session.done+1,state.session.limit)}"]:
            self.assertIn(token.replace('\\$', '$'), SOURCE)

    def test_no_false_score_or_paid_auto_advance(self):
        self.assertIn("not a technical accuracy score", SOURCE)
        self.assertIn("Skipping schedules a review, not a mastery score.", SOURCE)
        self.assertIn("state.sessionReport", SOURCE)
        self.assertIn("state.studyMode==='learn'", SOURCE)
        self.assertNotIn("setInterval(()=>submitAnswer", SOURCE)

if __name__ == "__main__":
    unittest.main()
