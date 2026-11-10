import type { NextApiRequest, NextApiResponse } from 'next';
import { requirePracticeAccess } from '@/lib/server/practice-access';
import { privateHubPath } from '@/lib/server/private-hub';
import {
  gameId,
  positionId,
  mutateSavedGames,
  readSavedGames,
  validateSavedGame,
  writable,
} from '@/lib/server/saved-games-store';

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!requirePracticeAccess(req, res)) return;
  if (!['GET', 'POST', 'DELETE'].includes(req.method || '')) {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).end();
  }
  if (req.method !== 'GET' && !writable())
    return res
      .status(403)
      .json({ error: 'Hãy mở dự án trên máy để chỉnh sửa bộ sưu tập.' });
  try {
    if (req.method === 'GET') {
      const { tacticsCatalog } = await import('@/lib/server/tactics-catalog');
      return res.json({
        hubPath: privateHubPath(),
        writable: writable(),
        games: await readSavedGames(),
        themes: tacticsCatalog.themes.map(({ id, label, kind }) => ({
          id,
          label,
          kind,
        })),
      });
    }
    const input = req.method === 'POST' ? validateSavedGame(req.body) : null;
    if (
      !input &&
      (typeof req.body?.id !== 'string' || !/^[a-f0-9]{24}$/.test(req.body.id))
    )
      return res.status(400).json({ error: 'Mã ván không hợp lệ.' });
    const id = input ? gameId(input.source) : req.body.id;
    if (
      req.body.positionId !== undefined &&
      (req.method !== 'DELETE' ||
        typeof req.body.positionId !== 'string' ||
        !/^[a-f0-9]{24}$/.test(req.body.positionId))
    )
      return res.status(400).json({ error: 'Mã thế cờ không hợp lệ.' });
    const games = await mutateSavedGames((games) => {
      const old = games.find((g) => g.id === id);
      if ((old?.updatedAt ?? null) !== (req.body.expectedUpdatedAt ?? null))
        throw new Error('Ván đã thay đổi. Hãy đóng rồi mở lại để tải bản mới.');
      const now = new Date(
        Math.max(Date.now(), old ? Date.parse(old.updatedAt) + 1 : 0)
      ).toISOString();
      if (!input) {
        if (!req.body.positionId) return games.filter((g) => g.id !== id);
        if (!old?.positions?.some((p) => p.id === req.body.positionId))
          throw new Error('Không tìm thấy thế cờ đã lưu.');
        return games.map((g) =>
          g.id === id
            ? {
                ...g,
                positions: g.positions?.filter(
                  (p) => p.id !== req.body.positionId
                ),
                updatedAt: now,
              }
            : g
        );
      }
      const { position, ...gameInput } = input;
      const lines = [...(old?.source.lines ?? [])];
      for (const line of input.source.lines) {
        if (
          !lines.some((saved) => JSON.stringify(saved) === JSON.stringify(line))
        )
          lines.push(line);
      }
      const selectedLine = JSON.stringify(
        input.source.lines[input.reference.branch]
      );
      const moment = {
        branch: lines.findIndex(
          (line) => JSON.stringify(line) === selectedLine
        ),
        ply: input.reference.ply,
      };
      const moments = old?.moments ?? [];
      const positions = [...(old?.positions ?? [])];
      if (position) {
        const candidateId = positionId(
          id,
          moment.branch,
          moment.ply,
          position.themeId
        );
        const index = positions.findIndex((p) => p.id === candidateId);
        const candidate = {
          ...position,
          id: candidateId,
          reference: { ...input.reference, ...moment },
          status: 'pending-review' as const,
          createdAt: index < 0 ? now : positions[index].createdAt,
          updatedAt: now,
        };
        if (index < 0) positions.push(candidate);
        else positions[index] = candidate;
      }
      const next = {
        ...gameInput,
        // Position notes belong to that candidate; preserve game-wide notes.
        ...(position && old
          ? { squares: old.squares, tags: old.tags, note: old.note }
          : {}),
        source: { ...old?.source, ...input.source, lines },
        reference: { ...input.reference, ...moment },
        id,
        createdAt: old?.createdAt ?? now,
        updatedAt: now,
        ...(positions.length || old?.positions ? { positions } : {}),
        moments: moments.some(
          (m) => m.branch === moment.branch && m.ply === moment.ply
        )
          ? moments
          : [...moments, moment],
      };
      return [next, ...games.filter((g) => g.id !== id)];
    });
    return res.json({ games });
  } catch (error) {
    return res.status(400).json({
      error:
        error instanceof Error && !('code' in error)
          ? error.message
          : 'Không lưu được bộ sưu tập. Dữ liệu cũ được giữ nguyên.',
    });
  }
}
