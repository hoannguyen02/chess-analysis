export type MoveQuality =
  | 'brilliant'
  | 'great'
  | 'best'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder';

export type MoveAnnotation = {
  ply: number;
  quality: MoveQuality;
  note?: string;
};
