"""Topic-level review bundles with atomic updates and record checksums.

Use one writer per bundle at a time, as with MateProofStore. Hash a record's
standalone JSON representation so unrelated bundle updates do not invalidate
an editorial approval. This representation preserves legacy review-file hashes.
"""
import hashlib
import json
from pathlib import Path


def review_sha256(record):
    text = json.dumps(record, ensure_ascii=False, indent=2) + '\n'
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


class ReviewStore:
    def __init__(self, path):
        self.path = Path(path)
        self.records = (json.loads(self.path.read_text(encoding='utf-8'))['records']
                        if self.path.exists() else {})

    def __contains__(self, key):
        return str(key) in self.records

    def __getitem__(self, key):
        return self.records[str(key)]

    def put(self, key, record):
        self.records[str(key)] = record
        self.save()

    def save(self):
        temporary = self.path.with_suffix('.tmp')
        data = {'records': dict(sorted(self.records.items()))}
        temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n',
                             encoding='utf-8')
        temporary.replace(self.path)


def _review_location(reference):
    """Resolve explicit bundle#key and preserved individual review references."""
    text = str(reference)
    if '#' in text:
        filename, key = text.rsplit('#', 1)
        if not filename or not key or '#' in filename:
            raise ValueError('Expected review bundle#key')
        return Path(filename), key
    path = Path(reference)
    if not path.name.endswith('-review.json'):
        raise ValueError('Expected review bundle#key or historical *-review.json')
    return path.with_name('reviews.json'), path.stem


def read_review_reference(reference):
    path, key = _review_location(reference)
    return ReviewStore(path)[key]


def write_review_reference(reference, record):
    path, key = _review_location(reference)
    ReviewStore(path).put(key, record)
