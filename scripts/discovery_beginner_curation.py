"""Publish the user's fixed 24-position selection, preserving stable source IDs."""
import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / 'scripts/fixtures/discovery'

def publish():
    manifest = json.loads((FIXTURES / 'beginner-curation.json').read_text())
    source = json.loads((FIXTURES / 'beginner-candidates.json').read_text())['entries']
    entries = {entry['review']['id']: entry for entry in source}
    decisions = {row['id']: row for row in manifest['decisions']}
    order = manifest['order']
    assert len(order) == len(set(order)) == manifest['requestedCount'] == 24
    assert set(entries) == set(decisions)
    assert set(order) == {key for key, row in decisions.items() if row['decision'] == 'keep'}
    exercises, reviews = [], []
    for number, identity in enumerate(order, 1):
        entry = copy.deepcopy(entries[identity])
        exercise, review = entry['exercise'], entry['review']
        decision = decisions[identity]
        assert exercise['fen'] == decision['fen']
        assert exercise['moves'] == decision['moves']
        exercise['title'] = exercise['title'].rsplit(' · ', 1)[0] + f' · {number}'
        if decision.get('solutionSuffix'):
            exercise['solution'] += ' ' + decision['solutionSuffix']
        review['curationReason'] = decision['reason']
        review['displayNumber'] = number
        exercises.append(exercise)
        reviews.append(review)
    (ROOT / 'src/lib/server/discovery-beginner-exercises.json').write_text(
        json.dumps(exercises, ensure_ascii=False, indent=2) + '\n')
    (FIXTURES / 'beginner-review.json').write_text(json.dumps({
        'method': 'Curated from all 42 reviewed candidates. See beginner-curation.json for all keep/remove decisions, and beginner-candidates.json for original legal/engine evidence. All legal roots and defensive replies are regression-tested; finite analysis is not a proof of uniqueness.',
        'reviews': reviews,
    }, ensure_ascii=False, indent=2) + '\n')
    print('Published exactly 24 curated Beginner discoveries; exclusions preserved.')

if __name__ == '__main__':
    publish()
