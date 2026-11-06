import { beginnerTacticCandidates } from './beginner-tactic-candidates';

// Preserve the earlier protected Fork query while using the shared extractor.
export const forkBeginnerCandidates = () => beginnerTacticCandidates('/fork');
export type { BeginnerTacticCandidate as ForkBeginnerCandidate } from './beginner-tactic-candidates';
