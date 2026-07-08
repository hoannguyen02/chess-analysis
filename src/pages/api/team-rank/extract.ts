import * as cheerio from 'cheerio';
import type { NextApiRequest, NextApiResponse } from 'next';

type SortMode = 'score' | 'rank';

type RawPlayer = {
  individualRank: number | null;
  name: string;
  teamName: string;
  individualScore: number;
};

type TeamMember = {
  name: string;
  individualRank: number | null;
  individualScore: number;
};

type TeamRow = {
  teamRank: number;
  teamName: string;
  teamScore: number;
  totalRank: number;
  members: TeamMember[];
  totalMembers: number;
};

type ApiResponse = {
  sourceUrl: string;
  sourceTitle: string;
  teamSize: number;
  sortMode: SortMode;
  teams: TeamRow[];
  extractedPlayers: number;
  parserNote: string;
};

type HeaderMap = {
  rankIndex: number;
  nameIndex: number;
  teamIndex: number;
  scoreIndex: number;
};

type SupportedLocale = 'vi' | 'en';

type ErrorKey =
  | 'methodNotAllowed'
  | 'missingUrl'
  | 'invalidUrl'
  | 'invalidProtocol'
  | 'unsupportedHost'
  | 'fetchSourceFailed'
  | 'tableNotFound'
  | 'notEnoughPlayers'
  | 'unexpectedError';

const errorMessages: Record<SupportedLocale, Record<ErrorKey, string>> = {
  en: {
    methodNotAllowed: 'Method not allowed',
    missingUrl: 'Please provide a chess-results URL.',
    invalidUrl: 'Invalid URL format.',
    invalidProtocol: 'URL must use http or https.',
    unsupportedHost: 'Only chess-results.com URLs are supported.',
    fetchSourceFailed: 'Cannot fetch source page, status {status}.',
    tableNotFound:
      'Could not detect player/team table on this page. Try a ranking page with team or club columns.',
    notEnoughPlayers:
      'No team has enough players (minimum {teamSize}) to calculate team standings.',
    unexpectedError: 'Unexpected error while extracting chess result data.',
  },
  vi: {
    methodNotAllowed: 'Phương thức không được hỗ trợ',
    missingUrl: 'Vui lòng nhập URL Chess-Results.',
    invalidUrl: 'Định dạng URL không hợp lệ.',
    invalidProtocol: 'URL phải sử dụng http hoặc https.',
    unsupportedHost: 'Chỉ hỗ trợ URL từ chess-results.com.',
    fetchSourceFailed: 'Không thể tải trang nguồn, mã lỗi {status}.',
    tableNotFound:
      'Không tìm thấy bảng dữ liệu kỳ thủ/đội trên trang này. Hãy thử trang xếp hạng có cột đội hoặc câu lạc bộ.',
    notEnoughPlayers: 'Không có đội nào đủ {teamSize} kỳ thủ để tính đồng đội.',
    unexpectedError:
      'Có lỗi không mong đợi khi trích xuất dữ liệu Chess-Results.',
  },
};

const resolveLocale = (req: NextApiRequest): SupportedLocale => {
  const bodyLocale = String(req.body?.locale || '').toLowerCase();
  if (bodyLocale === 'vi') return 'vi';
  if (bodyLocale === 'en') return 'en';

  const acceptLanguage = req.headers['accept-language'] || '';
  return acceptLanguage.toLowerCase().includes('vi') ? 'vi' : 'en';
};

const getErrorMessage = (
  locale: SupportedLocale,
  key: ErrorKey,
  params?: Record<string, string | number>
) => {
  let message = errorMessages[locale][key];
  if (!params) return message;

  Object.entries(params).forEach(([paramKey, value]) => {
    message = message.replace(`{${paramKey}}`, String(value));
  });
  return message;
};

const isChessResultsHost = (host: string): boolean =>
  /(^|\.)chess-results\.com$/i.test(host);

const normalizeCell = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();

const parseNumeric = (value: string): number | null => {
  const cleaned = value.replace(/\s+/g, '').replace(',', '.');
  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};

const isValidPlayerRow = (
  name: string,
  teamName: string,
  rank: number | null,
  score: number
): boolean => {
  if (!name || !teamName) return false;
  if (rank === null || rank < 1 || rank > 500) return false;
  if (score < 0 || score > 20) return false;
  if (name.length > 80 || teamName.length > 40) return false;

  const text = `${name} ${teamName}`.toLowerCase();
  const badWords = [
    'federation',
    'organizer',
    'chief arbiter',
    'time control',
    'tournament',
    'location',
    'rating calculation',
    'pairing program',
    'last update',
    'parameters',
  ];

  return !badWords.some((word) => text.includes(word));
};

const buildHeaderMap = (headers: string[]): HeaderMap | null => {
  const normalized = headers.map((header) => header.toLowerCase());

  const findIndex = (patterns: RegExp[]): number =>
    normalized.findIndex((header) =>
      patterns.some((pattern) => pattern.test(header))
    );

  const rankIndex = findIndex([/^rk\.?$/, /^rank$/, /^#$/, /stt/, /place/]);
  const nameIndex = findIndex([/name/, /player/, /ten/]);
  const teamIndex = findIndex([/team/, /club/, /city/, /clb/, /doi/, /fed/]);
  const scoreIndex = findIndex([/pts/, /point/, /score/, /diem/]);

  if (rankIndex < 0 || nameIndex < 0 || teamIndex < 0 || scoreIndex < 0) {
    return null;
  }

  return { rankIndex, nameIndex, teamIndex, scoreIndex };
};

const extractRowsFromBestTable = ($: cheerio.CheerioAPI): RawPlayer[] => {
  let bestRows: RawPlayer[] = [];

  $('table').each((_, table) => {
    const allRows = $(table).find('tr').toArray();
    if (allRows.length < 3) return;

    const firstHeaderRowIndex = allRows.findIndex((row) => {
      const cells = $(row)
        .find('th,td')
        .toArray()
        .map((cell) => normalizeCell($(cell).text()));

      return buildHeaderMap(cells) !== null;
    });

    if (firstHeaderRowIndex < 0) return;

    const headers = $(allRows[firstHeaderRowIndex])
      .find('th,td')
      .toArray()
      .map((cell) => normalizeCell($(cell).text()));

    const headerMap = buildHeaderMap(headers);
    if (!headerMap) return;

    const candidateRows: RawPlayer[] = [];

    allRows.slice(firstHeaderRowIndex + 1).forEach((row) => {
      const cells = $(row)
        .find('td')
        .toArray()
        .map((cell) => normalizeCell($(cell).text()));

      if (
        cells.length <=
        Math.max(
          headerMap.rankIndex,
          headerMap.nameIndex,
          headerMap.teamIndex,
          headerMap.scoreIndex
        )
      ) {
        return;
      }

      const name = cells[headerMap.nameIndex] || '';
      const teamName = cells[headerMap.teamIndex] || '';
      const rank = parseNumeric(cells[headerMap.rankIndex] || '');
      const individualScore = parseNumeric(cells[headerMap.scoreIndex] || '');

      if (
        individualScore === null ||
        !isValidPlayerRow(name, teamName, rank, individualScore)
      ) {
        return;
      }

      candidateRows.push({
        individualRank: rank,
        name,
        teamName,
        individualScore,
      });
    });

    if (candidateRows.length > bestRows.length) {
      bestRows = candidateRows;
    }
  });

  return bestRows;
};

const rankTeams = (
  players: RawPlayer[],
  teamSize: number,
  sortMode: SortMode
): TeamRow[] => {
  const byTeam = new Map<string, RawPlayer[]>();

  players.forEach((player) => {
    const existing = byTeam.get(player.teamName) || [];
    existing.push(player);
    byTeam.set(player.teamName, existing);
  });

  const teams: TeamRow[] = Array.from(byTeam.entries())
    .filter(([, rows]) => rows.length >= teamSize)
    .map(([teamName, rows]) => {
      const sortedMembers = [...rows].sort((left, right) => {
        if (sortMode === 'score') {
          if (left.individualScore !== right.individualScore) {
            return right.individualScore - left.individualScore;
          }
        }

        if (left.individualRank !== null && right.individualRank !== null) {
          return left.individualRank - right.individualRank;
        }
        if (left.individualRank !== null) return -1;
        if (right.individualRank !== null) return 1;
        if (left.individualScore !== right.individualScore) {
          return right.individualScore - left.individualScore;
        }
        return left.name.localeCompare(right.name);
      });

      const countedMembers = sortedMembers.slice(0, teamSize);
      const teamScore = countedMembers.reduce(
        (sum, member) => sum + member.individualScore,
        0
      );
      const totalRank = countedMembers.reduce(
        (sum, member) => sum + (member.individualRank ?? 9999),
        0
      );

      return {
        teamRank: 0,
        teamName,
        teamScore,
        totalRank,
        members: countedMembers.map((member) => ({
          name: member.name,
          individualRank: member.individualRank,
          individualScore: member.individualScore,
        })),
        totalMembers: rows.length,
      };
    });

  teams.sort((left, right) => {
    if (sortMode === 'score') {
      if (left.teamScore !== right.teamScore)
        return right.teamScore - left.teamScore;
      if (left.totalRank !== right.totalRank)
        return left.totalRank - right.totalRank;
      return left.teamName.localeCompare(right.teamName);
    }

    if (left.totalRank !== right.totalRank)
      return left.totalRank - right.totalRank;
    if (left.teamScore !== right.teamScore)
      return right.teamScore - left.teamScore;
    return left.teamName.localeCompare(right.teamName);
  });

  return teams.map((team, index) => ({ ...team, teamRank: index + 1 }));
};

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | { error: string }>
) => {
  const locale = resolveLocale(req);

  if (req.method !== 'POST') {
    res
      .status(405)
      .json({ error: getErrorMessage(locale, 'methodNotAllowed') });
    return;
  }

  const urlInput = String(req.body?.url || '').trim();
  const teamSizeInput = Number(req.body?.teamSize);
  const teamSize = [2, 3, 4].includes(teamSizeInput) ? teamSizeInput : 2;
  const sortMode: SortMode = req.body?.sortMode === 'score' ? 'score' : 'rank';

  if (!urlInput) {
    res.status(400).json({ error: getErrorMessage(locale, 'missingUrl') });
    return;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlInput);
  } catch {
    res.status(400).json({ error: getErrorMessage(locale, 'invalidUrl') });
    return;
  }

  if (!/^https?:$/.test(parsedUrl.protocol)) {
    res.status(400).json({ error: getErrorMessage(locale, 'invalidProtocol') });
    return;
  }

  if (!isChessResultsHost(parsedUrl.hostname)) {
    res.status(400).json({ error: getErrorMessage(locale, 'unsupportedHost') });
    return;
  }

  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.8',
      },
    });

    if (!response.ok) {
      res.status(400).json({
        error: getErrorMessage(locale, 'fetchSourceFailed', {
          status: response.status,
        }),
      });
      return;
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const players = extractRowsFromBestTable($);

    if (players.length === 0) {
      res.status(422).json({
        error: getErrorMessage(locale, 'tableNotFound'),
      });
      return;
    }

    const teams = rankTeams(players, teamSize, sortMode);

    if (teams.length === 0) {
      res.status(422).json({
        error: getErrorMessage(locale, 'notEnoughPlayers', { teamSize }),
      });
      return;
    }

    res.status(200).json({
      sourceUrl: parsedUrl.toString(),
      sourceTitle: (
        normalizeCell($('title').first().text()) || 'Chess Results Tournament'
      ).replace(/^Chess-Results Server Chess-results\.com\s*-\s*/i, ''),
      teamSize,
      sortMode,
      teams,
      extractedPlayers: players.length,
      parserNote:
        sortMode === 'score'
          ? 'Xếp hạng theo tổng điểm trước, nếu bằng điểm thì xét tổng hạng.'
          : 'Xếp hạng theo tổng hạng trước, nếu bằng tổng hạng thì xét tổng điểm.',
    });
  } catch {
    res.status(500).json({
      error: getErrorMessage(locale, 'unexpectedError'),
    });
  }
};

export default handler;
