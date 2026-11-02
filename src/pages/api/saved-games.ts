import type { NextApiRequest, NextApiResponse } from 'next';
import { requirePracticeAccess } from '@/lib/server/practice-access';
import { privateHubPath } from '@/lib/server/private-hub';
import {
  gameId,
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
    if (req.method === 'GET')
      return res.json({
        hubPath: privateHubPath(),
        writable: writable(),
        games: await readSavedGames(),
      });
    const input = req.method === 'POST' ? validateSavedGame(req.body) : null;
    if (
      !input &&
      (typeof req.body?.id !== 'string' || !/^[a-f0-9]{24}$/.test(req.body.id))
    )
      return res.status(400).json({ error: 'Mã ván không hợp lệ.' });
    const id = input ? gameId(input.source) : req.body.id;
    const games = await mutateSavedGames((games) => {
      const old = games.find((g) => g.id === id);
      if ((old?.updatedAt ?? null) !== (req.body.expectedUpdatedAt ?? null))
        throw new Error('Ván đã thay đổi. Hãy đóng rồi mở lại để tải bản mới.');
      if (!input) return games.filter((g) => g.id !== id);
      const now = new Date(
        Math.max(Date.now(), old ? Date.parse(old.updatedAt) + 1 : 0)
      ).toISOString();
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
      const next = {
        ...input,
        source: { ...input.source, lines },
        reference: { ...input.reference, ...moment },
        id,
        createdAt: old?.createdAt ?? now,
        updatedAt: now,
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
