import { manualTopicPath } from './manual-tactics';

// Dedicated practice routes and manual theme IDs in teaching order.
// Exercise difficulty and the research catalog's development priorities are separate.
const teachingSequence = [
  // Spot loose pieces and threats before calculating a combination.
  '/hanging-piece',
  'hangingPiece',
  'defensiveMove',
  // Recognize mate and learn how to take away escape squares.
  'mateIn1',
  '/two-rook-mate',
  '/queen-mate',
  '/back-rank-mate',
  // Direct threats, their defences and the first preparatory moves.
  '/fork',
  '/pin',
  'unpinning',
  '/skewer',
  '/removing-defender',
  '/discovered-attack',
  'doubleCheck',
  // Calculate the reply, then practise further mating techniques and patterns.
  'mateIn2',
  '/one-rook-mate',
  '/queen-rook-mate',
  '/rook-bishop-mate',
  '/arabian-mate',
  '/anastasia-mate',
  'smotheredMate',
  'mate',
  // Basic endgame and draw decisions.
  '/promotion',
  '/stalemate',
  '/insufficient-material',
  '/simplification',
  'pawnEndgame',
  'opposition',
  'pawnRace',
  '/passed-pawn-simplification',
  '/promotion-mate',
  '/underpromotion',
  '/perpetual-check',
  '/repetition-draw',
  '/draw',
  // Preparation, defensive resources and line play.
  'trappedPiece',
  'xRayAttack',
  'overloading',
  'deflection',
  'attraction',
  'clearance',
  'vacatingSquare',
  'openingLines',
  'blocking',
  'interference',
  'intermezzo',
  'intermezzoCheck',
  'intermezzoCapture',
  'counterattack',
  'countercheck',
  'desperado',
  'tacticalRetreat',
  'tacticalProphylaxis',
  'quietMove',
  'collinearMove',
  'doubleThreatCreation',
  // King attacks and further mating patterns.
  'attackingF2F7',
  'exposedKing',
  'kingsideAttack',
  'matingNet',
  'removingEscapeSquare',
  'mateIn3',
  'cornerMate',
  'operaMate',
  'blindSwineMate',
  'pillsburysMate',
  'morphysMate',
  'doubleBishopMate',
  'bodenMate',
  'dovetailMate',
  'epauletteMate',
  'hookMate',
  'triangleMate',
  'killBoxMate',
  'balestraMate',
  'swallowstailMate',
  'vukovicMate',
  'kingHunt',
  'queensideAttack',
  // Specialized endgames and tactical applications of special moves.
  'rookEndgame',
  'bishopEndgame',
  'knightEndgame',
  'queenEndgame',
  'queenRookEndgame',
  'zugzwang',
  '/fortress-draw',
  'stalemateTrap',
  'perpetualCheckTrap',
  'perpetualAttack',
  'promotionThreat',
  'pawnBreakthrough',
  'tacticalLiquidation',
  'enPassant',
  'castling',
  // Advanced combinations.
  'sacrifice',
  'exchangeSacrifice',
  'tacticalBreakthrough',
  'pawnShieldDestruction',
  'greekGift',
  'laskerDoubleBishopSacrifice',
  'rookLiftAttack',
  'windmill',
  'domination',
  'queenDomination',
  'exchangeSacrificeC3C6',
  'positionalSacrifice',
  'defensiveCombination',
  'fortressBreakthrough',
  'mateIn4',
  'mateIn5',
  'longForcingCombination',
];

const teachingRanks = new Map(
  teachingSequence.map((topic, rank) => [
    manualTopicPath({
      id: topic,
      dedicatedPage: topic.startsWith('/') ? topic : null,
    }),
    rank,
  ])
);

export function inPracticeTeachingOrder<T>(
  topics: readonly T[],
  scopeOf: (topic: T) => string
): T[] {
  const rank = (topic: T) =>
    teachingRanks.get(scopeOf(topic)) ?? teachingRanks.size;
  return [...topics].sort((a, b) => rank(a) - rank(b));
}
