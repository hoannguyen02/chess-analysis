"""Derive coverage inventory from the published London data (no engine needed)."""
import collections, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def write_coverage(course):
    lookup={g['id']:g for g in course['games']}
    result={
      'games':len(course['games']),
      'results':dict(collections.Counter(g['result'] for g in course['games'])),
      'lessons':len(course['lessons']),
      'exercises':sum(len(l['exercises']) for l in course['lessons']),
      'topics':[],
      'remainingTopics':['Dedicated Dutch/Stonewall move orders','Dedicated early ...c6 systems','Deeper forcing sidelines and additional annotated decision points']}
    for l in course['lessons']:
      ids={e['gameId'] for e in l['exercises']}
      result['topics'].append(dict(id=l['id'],track=l.get('track','classical'),level=l['level'],title=l['title'],games=len(ids),positionsBySide=dict(collections.Counter(e['side'] for e in l['exercises'])),results=dict(collections.Counter(lookup[id]['result'] for id in ids))))
    (ROOT/'scripts/fixtures/london/coverage.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    return result
if __name__=='__main__':
    result=write_coverage(json.loads((ROOT/'src/lib/server/london-course.json').read_text()))
    print({k:v for k,v in result.items() if k!='topics'})
