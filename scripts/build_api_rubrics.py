import json
from pathlib import Path
R=Path(__file__).resolve().parents[1]
chapters=json.loads((R/'data/curriculum.json').read_text())
lessons=json.loads((R/'data/lessons.json').read_text())
rubrics={}
for ch in chapters:
 for g in ch['groups']:
  for item in g['items']:
   if item['title'] not in lessons:
    continue
   l=lessons[item['title']]
   rubrics[' / '.join((ch['title'],g['title'],item['title']))]={
    'topic':item['title'],'question':item['question'],'reference_answer':l['answer'],
    'technical_context':l['technical'],'common_mistakes':l['mistakes'],
    'expected_concepts':l['keywords'],'project_context':l['project'],
   }
(R/'api/rubrics.json').write_text(json.dumps(rubrics,ensure_ascii=False,indent=2)+'\n')
print('Prepared server-owned interview rubrics:',len(rubrics))
