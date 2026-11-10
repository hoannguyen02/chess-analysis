import catalog from '../../../scripts/fixtures/tactics-index/tactics-map.json';
import type { TacticsCatalog } from '@/types/tactics-catalog';

// The research index and protected API share the same validated configuration.
// Run `python3 scripts/tactics-index.py validate-map` after editing it.
export const tacticsCatalog = catalog as TacticsCatalog;
