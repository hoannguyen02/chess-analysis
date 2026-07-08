export type BoardResultInput = {
  scoreA: number;
  scoreB: number;
};

export type TeamMatchResultInput = {
  round: number;
  teamA: string;
  teamB: string;
  boards: BoardResultInput[];
};

export type TeamStanding = {
  rank: number;
  team: string;
  played: number;
  matchPoints: number;
  boardPoints: number;
  wins: number;
  draws: number;
  losses: number;
};

type TeamStandingAccumulator = Omit<TeamStanding, 'rank'>;

type HeadToHead = {
  matchPointDiff: number;
  boardPointDiff: number;
};

const EPSILON = 1e-9;

const sanitizeScore = (value: number): number => {
  if (Number.isNaN(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
};

const compareNumberDesc = (a: number, b: number): number => {
  if (Math.abs(a - b) <= EPSILON) {
    return 0;
  }
  return a > b ? -1 : 1;
};

const getHeadToHead = (
  leftTeam: string,
  rightTeam: string,
  matches: TeamMatchResultInput[]
): HeadToHead => {
  let leftMatchPoints = 0;
  let rightMatchPoints = 0;
  let leftBoardPoints = 0;
  let rightBoardPoints = 0;

  matches.forEach((match) => {
    const isDirectMatch =
      (match.teamA === leftTeam && match.teamB === rightTeam) ||
      (match.teamA === rightTeam && match.teamB === leftTeam);

    if (!isDirectMatch) {
      return;
    }

    const scoreA = match.boards.reduce(
      (sum, board) => sum + sanitizeScore(board.scoreA),
      0
    );
    const scoreB = match.boards.reduce(
      (sum, board) => sum + sanitizeScore(board.scoreB),
      0
    );

    const leftScore = match.teamA === leftTeam ? scoreA : scoreB;
    const rightScore = match.teamA === leftTeam ? scoreB : scoreA;

    leftBoardPoints += leftScore;
    rightBoardPoints += rightScore;

    if (leftScore > rightScore + EPSILON) {
      leftMatchPoints += 2;
      return;
    }

    if (rightScore > leftScore + EPSILON) {
      rightMatchPoints += 2;
      return;
    }

    leftMatchPoints += 1;
    rightMatchPoints += 1;
  });

  return {
    matchPointDiff: leftMatchPoints - rightMatchPoints,
    boardPointDiff: leftBoardPoints - rightBoardPoints,
  };
};

const sortStandings = (
  standings: TeamStandingAccumulator[],
  consideredMatches: TeamMatchResultInput[]
): TeamStandingAccumulator[] => {
  return [...standings].sort((left, right) => {
    const byMatchPoints = compareNumberDesc(
      left.matchPoints,
      right.matchPoints
    );
    if (byMatchPoints !== 0) {
      return byMatchPoints;
    }

    const byBoardPoints = compareNumberDesc(
      left.boardPoints,
      right.boardPoints
    );
    if (byBoardPoints !== 0) {
      return byBoardPoints;
    }

    const headToHead = getHeadToHead(left.team, right.team, consideredMatches);
    const byHeadToHeadMatchPoints = compareNumberDesc(
      headToHead.matchPointDiff,
      0
    );
    if (byHeadToHeadMatchPoints !== 0) {
      return byHeadToHeadMatchPoints;
    }

    const byHeadToHeadBoardPoints = compareNumberDesc(
      headToHead.boardPointDiff,
      0
    );
    if (byHeadToHeadBoardPoints !== 0) {
      return byHeadToHeadBoardPoints;
    }

    const byWins = compareNumberDesc(left.wins, right.wins);
    if (byWins !== 0) {
      return byWins;
    }

    return left.team.localeCompare(right.team);
  });
};

export const getMaxRound = (matches: TeamMatchResultInput[]): number => {
  if (matches.length === 0) {
    return 0;
  }

  return matches.reduce(
    (maxRound, match) => Math.max(maxRound, match.round),
    0
  );
};

export const buildTeamStandings = (
  allMatches: TeamMatchResultInput[],
  upToRound: number
): TeamStanding[] => {
  const teamNames = new Set<string>();
  allMatches.forEach((match) => {
    teamNames.add(match.teamA);
    teamNames.add(match.teamB);
  });

  const map = new Map<string, TeamStandingAccumulator>();
  teamNames.forEach((team) => {
    map.set(team, {
      team,
      played: 0,
      matchPoints: 0,
      boardPoints: 0,
      wins: 0,
      draws: 0,
      losses: 0,
    });
  });

  const consideredMatches = allMatches.filter(
    (match) => match.round <= upToRound
  );

  consideredMatches.forEach((match) => {
    const statA = map.get(match.teamA);
    const statB = map.get(match.teamB);

    if (!statA || !statB) {
      return;
    }

    const scoreA = match.boards.reduce(
      (sum, board) => sum + sanitizeScore(board.scoreA),
      0
    );
    const scoreB = match.boards.reduce(
      (sum, board) => sum + sanitizeScore(board.scoreB),
      0
    );

    statA.played += 1;
    statB.played += 1;
    statA.boardPoints += scoreA;
    statB.boardPoints += scoreB;

    if (scoreA > scoreB + EPSILON) {
      statA.matchPoints += 2;
      statA.wins += 1;
      statB.losses += 1;
      return;
    }

    if (scoreB > scoreA + EPSILON) {
      statB.matchPoints += 2;
      statB.wins += 1;
      statA.losses += 1;
      return;
    }

    statA.matchPoints += 1;
    statB.matchPoints += 1;
    statA.draws += 1;
    statB.draws += 1;
  });

  const sorted = sortStandings(Array.from(map.values()), consideredMatches);
  return sorted.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
};

export const parseTeamMatchResults = (
  rawInput: string
): { data: TeamMatchResultInput[]; error: string | null } => {
  try {
    const parsed = JSON.parse(rawInput);
    if (!Array.isArray(parsed)) {
      return {
        data: [],
        error: 'input-must-be-array',
      };
    }

    const normalized = parsed.map((item) => {
      const boards = Array.isArray(item?.boards) ? item.boards : [];
      return {
        round: Number(item?.round),
        teamA: String(item?.teamA ?? '').trim(),
        teamB: String(item?.teamB ?? '').trim(),
        boards: boards.map((board: { scoreA?: number; scoreB?: number }) => ({
          scoreA: Number(board?.scoreA),
          scoreB: Number(board?.scoreB),
        })),
      } as TeamMatchResultInput;
    });

    const hasInvalidEntry = normalized.some((match) => {
      return (
        !Number.isFinite(match.round) ||
        match.round <= 0 ||
        !match.teamA ||
        !match.teamB ||
        match.teamA === match.teamB ||
        !Array.isArray(match.boards) ||
        match.boards.length === 0 ||
        match.boards.some(
          (board) =>
            !Number.isFinite(board.scoreA) ||
            !Number.isFinite(board.scoreB) ||
            board.scoreA < 0 ||
            board.scoreA > 1 ||
            board.scoreB < 0 ||
            board.scoreB > 1
        )
      );
    });

    if (hasInvalidEntry) {
      return {
        data: [],
        error: 'invalid-schema',
      };
    }

    return {
      data: normalized,
      error: null,
    };
  } catch {
    return {
      data: [],
      error: 'invalid-json',
    };
  }
};
