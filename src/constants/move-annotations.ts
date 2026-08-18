import { MoveAnnotation, MoveQuality } from '@/types/move-annotation';

export const DEFAULT_MOVE_ANNOTATIONS: MoveAnnotation[] = [
  // Example:
  // { ply: 11, quality: 'brilliant', note: 'Queen sacrifice starts the attack' },
  // { ply: 24, quality: 'blunder', note: 'Misses back-rank mate' },
];

export const MOVE_QUALITY_OPTIONS: MoveQuality[] = [
  'brilliant',
  'great',
  'best',
  'inaccuracy',
  'mistake',
  'blunder',
];

export const MOVE_QUALITY_STYLES: Record<
  MoveQuality,
  {
    badge: string;
    accent: string;
    square: string;
  }
> = {
  brilliant: {
    badge: 'bg-cyan-500/15 text-cyan-300 ring-cyan-400/30',
    accent: 'text-cyan-300',
    square: 'bg-cyan-400/85 text-white',
  },
  great: {
    badge: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
    accent: 'text-emerald-300',
    square: 'bg-emerald-400/85 text-white',
  },
  best: {
    badge: 'bg-green-500/15 text-green-300 ring-green-400/30',
    accent: 'text-green-300',
    square: 'bg-green-400/85 text-white',
  },
  inaccuracy: {
    badge: 'bg-yellow-500/15 text-yellow-300 ring-yellow-400/30',
    accent: 'text-yellow-300',
    square: 'bg-yellow-400/90 text-slate-900',
  },
  mistake: {
    badge: 'bg-orange-500/15 text-orange-300 ring-orange-400/30',
    accent: 'text-orange-300',
    square: 'bg-orange-500/90 text-white',
  },
  blunder: {
    badge: 'bg-red-500/15 text-red-300 ring-red-400/30',
    accent: 'text-red-300',
    square: 'bg-red-500/90 text-white',
  },
};

export const MOVE_QUALITY_SYMBOLS: Record<MoveQuality, string> = {
  brilliant: '!!',
  great: '!',
  best: '=',
  inaccuracy: '?!',
  mistake: '?',
  blunder: '??',
};
