"""Bundled promotion review records, with atomic incremental updates."""
import json
from pathlib import Path

class ReviewStore:
    def __init__(self, path):
        self.path = Path(path)
        self.records = json.loads(self.path.read_text())['records'] if self.path.exists() else {}

    def __contains__(self, key):
        return str(key) in self.records

    def __getitem__(self, key):
        return self.records[str(key)]

    def put(self, key, record):
        self.records[str(key)] = record
        temporary = self.path.with_suffix('.tmp')
        temporary.write_text(json.dumps({'records': self.records}, ensure_ascii=False, indent=2) + '\n')
        temporary.replace(self.path)
