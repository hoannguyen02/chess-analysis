import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

type SortMode = 'score' | 'rank';

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

type ExtractResponse = {
  sourceUrl: string;
  sourceTitle: string;
  teamSize: number;
  sortMode: SortMode;
  teams: TeamRow[];
  extractedPlayers: number;
  parserNote: string;
};

const SAMPLE_URL =
  'https://s2.chess-results.com/tnr1450937.aspx?lan=1&art=1&rd=4&fedb=LDO&fed=BNI&turdet=YES&group=U13&SNode=S0';

const formatScore = (score: number) => {
  if (score === 0.5) return '½';
  if (score % 1 === 0.5) return `${Math.floor(score)}½`;
  return String(score);
};

const TeamRankScreen = () => {
  const t = useTranslations('team-rank');

  const [url, setUrl] = useState(SAMPLE_URL);
  const [teamSize, setTeamSize] = useState(2);
  const [sortMode, setSortMode] = useState<SortMode>('rank');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ExtractResponse | null>(null);

  const sortOptions: Array<{ value: SortMode; label: string }> = [
    {
      value: 'rank',
      label: t('sortMode.rank'),
    },
    {
      value: 'score',
      label: t('sortMode.score'),
    },
  ];

  const getMedalLabel = (rank: number) => {
    if (rank === 1) return t('medals.gold');
    if (rank === 2) return t('medals.silver');
    if (rank === 3 || rank === 4) return t('medals.bronze');
    return String(rank);
  };

  const roundText = useMemo(() => {
    if (!data?.sourceUrl) return '';

    try {
      return new URL(data.sourceUrl).searchParams.get('rd') || '';
    } catch {
      return '';
    }
  }, [data]);

  const hasData = Boolean(data && data.teams.length > 0);

  const onExtract = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/team-rank/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, teamSize, sortMode }),
      });

      const json = (await response.json()) as ExtractResponse & {
        error?: string;
      };

      if (!response.ok || json.error) {
        setData(null);
        setError(json.error || t('errors.request-failed'));
        return;
      }

      setData(json);
    } catch {
      setData(null);
      setError(t('errors.network'));
    } finally {
      setIsLoading(false);
    }
  };

  const buildExportRows = () => {
    if (!data) return [];

    const rows: Array<Array<string | number>> = [
      [data.sourceTitle],
      [t('table.standingsAfterRound', { round: roundText })],
      [''],
      [t('table.teamStandings')],
      [
        t('table.rank'),
        t('table.playerName'),
        t('table.team'),
        t('table.individualRank'),
        t('table.totalRank'),
        t('table.individualScore'),
        t('table.totalScore'),
      ],
    ];

    data.teams.forEach((team) => {
      team.members.forEach((member, index) => {
        rows.push([
          index === 0 ? getMedalLabel(team.teamRank) : '',
          member.name,
          index === 0 ? team.teamName : '',
          member.individualRank ?? '',
          index === 0 ? team.totalRank : '',
          formatScore(member.individualScore),
          index === 0 ? formatScore(team.teamScore) : '',
        ]);
      });
    });

    return rows;
  };

  const exportXls = async () => {
    if (!data || data.teams.length === 0) return;

    const XLSX = await import('xlsx');
    const rows = buildExportRows();
    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } },
    ];

    let startRow = 5;
    data.teams.forEach((team) => {
      const endRow = startRow + team.members.length - 1;

      if (team.members.length > 1) {
        [0, 2, 4, 6].forEach((col) => {
          worksheet['!merges']!.push({
            s: { r: startRow, c: col },
            e: { r: endRow, c: col },
          });
        });
      }

      startRow = endRow + 1;
    });

    worksheet['!cols'] = [
      { wch: 10 },
      { wch: 30 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'TeamRank');
    XLSX.writeFile(workbook, `team-rank-${Date.now()}.xlsx`);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_160px_190px_auto_auto] lg:items-end">
          <div>
            <label className="text-sm font-medium text-gray-700">
              {t('input.urlLabel')}
            </label>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder={SAMPLE_URL}
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[var(--p-bg)] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              {t('input.teamSize')}
            </label>
            <select
              value={teamSize}
              onChange={(event) => setTeamSize(Number(event.target.value))}
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              {t('input.sortMode')}
            </label>
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {sortOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onExtract}
            disabled={isLoading}
            className="h-10 rounded-xl bg-[var(--p-bg)] px-4 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? t('input.loading') : t('input.extract')}
          </button>

          <button
            type="button"
            onClick={exportXls}
            disabled={!hasData}
            className="h-10 rounded-xl border border-[var(--p-bg)] px-4 text-sm font-medium text-[var(--p-bg)] hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t('export.xls')}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {data && (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th
                    colSpan={7}
                    className="border px-3 py-2 text-left text-lg font-semibold"
                  >
                    {data.sourceTitle}
                  </th>
                </tr>
                <tr>
                  <th
                    colSpan={7}
                    className="border px-3 py-2 text-left text-base"
                  >
                    {t('table.standingsAfterRound', { round: roundText })}
                  </th>
                </tr>
                <tr className="text-blue-700">
                  <th className="border px-3 py-2">{t('table.rank')}</th>
                  <th className="border px-3 py-2">{t('table.playerName')}</th>
                  <th className="border px-3 py-2">{t('table.team')}</th>
                  <th className="border px-3 py-2">
                    {t('table.individualRank')}
                  </th>
                  <th className="border px-3 py-2">{t('table.totalRank')}</th>
                  <th className="border px-3 py-2">
                    {t('table.individualScore')}
                  </th>
                  <th className="border px-3 py-2">{t('table.totalScore')}</th>
                </tr>
              </thead>

              <tbody>
                {data.teams.map((team) =>
                  team.members.map((member, index) => (
                    <tr key={`${team.teamName}-${member.name}`}>
                      {index === 0 && (
                        <td
                          rowSpan={team.members.length}
                          className="border px-3 py-2 text-center font-bold"
                        >
                          {getMedalLabel(team.teamRank)}
                        </td>
                      )}

                      <td className="border px-3 py-2">{member.name}</td>

                      {index === 0 && (
                        <td
                          rowSpan={team.members.length}
                          className="border px-3 py-2 text-center font-semibold"
                        >
                          {team.teamName}
                        </td>
                      )}

                      <td className="border px-3 py-2 text-center">
                        {member.individualRank ?? ''}
                      </td>

                      {index === 0 && (
                        <td
                          rowSpan={team.members.length}
                          className="border px-3 py-2 text-center"
                        >
                          {team.totalRank}
                        </td>
                      )}

                      <td className="border px-3 py-2 text-center">
                        {formatScore(member.individualScore)}
                      </td>

                      {index === 0 && (
                        <td
                          rowSpan={team.members.length}
                          className="border px-3 py-2 text-center"
                        >
                          {formatScore(team.teamScore)}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500">{data.parserNote}</p>
        </>
      )}
    </section>
  );
};

export default TeamRankScreen;
