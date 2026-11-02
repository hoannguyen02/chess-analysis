"""Atomic, topic-level storage of independently verifiable mate certificates."""
import json
from pathlib import Path

class MateProofStore:
    def __init__(self, directory):
        self.path = Path(directory) / 'mate-proofs.json'
        self.proofs = json.loads(self.path.read_text())['proofs'] if self.path.exists() else {}

    def __contains__(self, ident):
        return ident in self.proofs

    def __getitem__(self, ident):
        return self.proofs[ident]

    def reference(self, ident):
        return 'mate-proofs.json#' + ident

    def save(self):
        temporary = self.path.with_suffix('.tmp')
        temporary.write_text(json.dumps({'proofs': dict(sorted(self.proofs.items()))}, ensure_ascii=False, indent=2) + '\n')
        temporary.replace(self.path)

    def put(self, ident, proof):
        if proof.get('gameId', ident) != ident:
            raise ValueError('Certificate identifier mismatch')
        self.proofs[ident] = proof
        self.save()


def read_proof_reference(reference):
    """Read bundle#id references, including historical individual-file references."""
    text = str(reference)
    if '#' in text:
        path, ident = text.rsplit('#', 1)
        return MateProofStore(Path(path).parent)[ident]
    path = Path(reference)
    if path.parent.name == 'mate-proofs':
        return MateProofStore(path.parent.parent)[path.stem]
    return json.loads(path.read_text())
