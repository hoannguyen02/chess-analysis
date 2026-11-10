import type { NextApiRequest, NextApiResponse } from 'next';
import { requirePracticeAccess } from '@/lib/server/practice-access';
import { privateHubPath } from '@/lib/server/private-hub';
import { tacticsCatalog } from '@/lib/server/tactics-catalog';
import { manualTopicPath, manualPositionKey } from '@/lib/chess/manual-tactics';
import {
  manualTacticsWritable,
  readManualTactics,
  validateManualTactic,
  manualTacticId,
  mutateManualTactics,
  validateManualPreviousMove,
  manualPracticeAdjustment,
  validateBeginnerInsertion,
} from '@/lib/server/manual-tactics';
import {
  readPracticeAdjustments,
  practiceAdjustmentId,
} from '@/lib/server/practice-management';

export const config = { api: { bodyParser: { sizeLimit: '64kb' } } };
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!requirePracticeAccess(req, res)) return;
  if (!['GET', 'POST', 'DELETE'].includes(req.method ?? '')) {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).end();
  }
  if (req.method !== 'GET' && !manualTacticsWritable())
    return res
      .status(403)
      .json({ error: 'Mở dự án trên máy để thêm hoặc sửa thế cờ.' });
  try {
    if (req.method === 'GET') {
      const positions = await readManualTactics();
      const adjustments = await readPracticeAdjustments();
      const positionAdjustments = await Promise.all(
        positions.map(async (position) => ({
          position,
          adjustment: await manualPracticeAdjustment(
            position,
            adjustments,
            positions
          ),
        }))
      );
      return res.json({
        hubPath: privateHubPath(),
        writable: manualTacticsWritable(),
        positions,
        levelOverrides: Object.fromEntries(
          positionAdjustments.flatMap(({ position, adjustment }) => {
            const level = adjustment?.level;
            return level ? [[position.id, level]] : [];
          })
        ),
        topicOverrides: Object.fromEntries(
          positionAdjustments.flatMap(({ position, adjustment }) => {
            return adjustment?.destinationScope
              ? [[position.id, adjustment.destinationScope]]
              : [];
          })
        ),
        themes: tacticsCatalog.themes.map((t) => ({
          id: t.id,
          label: t.label,
          href: manualTopicPath(t),
        })),
      });
    }
    const input =
      req.method === 'POST' ? validateManualTactic(req.body) : undefined;
    const suppliedId = input ? req.body?.id : undefined;
    if (
      suppliedId !== undefined &&
      (typeof suppliedId !== 'string' || !/^[a-f0-9]{24}$/.test(suppliedId))
    )
      throw new Error('Mã thế cờ không hợp lệ.');
    const current = input ? await readManualTactics() : [];
    const suppliedOld = suppliedId
      ? current.find((entry) => entry.id === suppliedId)
      : undefined;
    if (suppliedId && !suppliedOld)
      throw new Error('Không tìm thấy thế cờ cần sửa.');
    const copying =
      !!input && !!suppliedOld && suppliedOld.themeId !== input.themeId;
    const previousAtPosition =
      input && !suppliedId && req.body.expectedUpdatedAt
        ? current.find(
            (entry) =>
              entry.themeId === input.themeId &&
              manualPositionKey(entry.fen) === manualPositionKey(input.fen) &&
              entry.updatedAt === req.body.expectedUpdatedAt
          )
        : undefined;
    const id = input
      ? (!copying && suppliedId) ||
        previousAtPosition?.id ||
        manualTacticId(input.themeId, input.fen, input.level)
      : req.body?.id;
    const insertion =
      input && req.body.insertion !== undefined
        ? validateBeginnerInsertion(
            req.body.insertion,
            input.level,
            manualTopicPath(
              tacticsCatalog.themes.find((theme) => theme.id === input.themeId)!
            )
          )
        : undefined;
    if (typeof id !== 'string' || !/^[a-f0-9]{24}$/.test(id))
      throw new Error('Mã thế cờ không hợp lệ.');
    if (input) {
      const old = current.find((entry) => entry.id === id);
      const theme = tacticsCatalog.themes.find(
        (theme) => theme.id === input.themeId
      )!;
      const scope = manualTopicPath(theme);
      const adjustments = await readPracticeAdjustments();
      const override = old
        ? await manualPracticeAdjustment(old, adjustments, current)
        : undefined;
      const effectiveLevel = override?.level ?? input.level;
      if (old && override?.level && input.level !== old.level)
        throw new Error('Đổi cấp độ trong phần Quản lý bài tập.');
      if (effectiveLevel !== 'Beginner' && !input.moves.length)
        throw new Error(
          'Ghi phương án hợp lệ trước khi lưu bài tập ở cấp độ A–D.'
        );
      if (
        old &&
        old.fen !== input.fen &&
        (old.level !== 'Beginner' ||
          input.level !== 'Beginner' ||
          effectiveLevel !== 'Beginner')
      )
        throw new Error('Chỉ sửa bàn cờ của bài tập Nhập môn.');
      if (
        old?.beginnerOriginalFen &&
        input.beginnerOriginalFen &&
        old.beginnerOriginalFen !== input.beginnerOriginalFen
      )
        throw new Error('Không thay đổi mốc thế cờ gốc.');
      if (
        old?.beginnerBaseFen &&
        input.beginnerBaseFen &&
        old.beginnerBaseFen !== input.beginnerBaseFen
      )
        throw new Error('Không thay đổi bài tập Nhập môn được thay thế.');
      const baseFen = input.beginnerBaseFen ?? old?.beginnerBaseFen;
      const { curatedPositionLevel } = await import(
        '@/lib/server/manual-tactics'
      );
      if (
        baseFen &&
        (input.level !== 'Beginner' ||
          (await curatedPositionLevel(
            input.themeId,
            manualPositionKey(baseFen),
            undefined,
            true
          )) !== 'Beginner')
      )
        throw new Error('Chỉ thay thế thế cờ có sẵn ở cấp độ Nhập môn.');
      if (baseFen) {
        const adjustment = adjustments.find(
          (entry) => entry.id === practiceAdjustmentId(scope, baseFen)
        );
        if (adjustment?.level && adjustment.level !== 'Beginner')
          throw new Error('Chỉ sửa bàn cờ của bài tập Nhập môn.');
      }
      const duplicate = await curatedPositionLevel(
        input.themeId,
        manualPositionKey(input.fen)
      );
      const beginnerDuplicate =
        input.level === 'Beginner'
          ? await curatedPositionLevel(
              input.themeId,
              manualPositionKey(input.fen),
              undefined,
              true
            )
          : undefined;
      const sourceCopy =
        input.level === 'Beginner' &&
        duplicate !== 'Beginner' &&
        input.beginnerOriginalFen &&
        manualPositionKey(input.beginnerOriginalFen) ===
          manualPositionKey(input.fen);
      const ownBeginnerOverlay =
        input.level === 'Beginner' &&
        baseFen &&
        manualPositionKey(baseFen) === manualPositionKey(input.fen) &&
        duplicate === 'Beginner';
      if (
        (duplicate && !sourceCopy && !ownBeginnerOverlay) ||
        (beginnerDuplicate && !ownBeginnerOverlay)
      )
        return res.status(409).json({
          error: `Thế cờ này đã có trong bài tập ở cấp độ ${duplicate}.`,
          href: manualTopicPath(
            tacticsCatalog.themes.find((t) => t.id === input.themeId)!
          ),
        });
    }
    const positions = await mutateManualTactics((entries) => {
      const old = entries.find((e) => e.id === id);
      if (insertion && (old || input?.beginnerBaseFen))
        throw new Error('Bài đã có giữ nguyên vị trí khi cập nhật.');
      if (
        copying &&
        entries.find((entry) => entry.id === suppliedId)?.updatedAt !==
          req.body.expectedUpdatedAt
      )
        throw new Error('Thế cờ nguồn đã thay đổi. Hãy mở lại để tải bản mới.');
      if (
        (old?.updatedAt ?? null) !==
        (copying ? null : (req.body.expectedUpdatedAt ?? null))
      )
        throw new Error(
          'Thế cờ đã thay đổi. Hãy đóng rồi mở lại để tải bản mới.'
        );
      if (!input) return entries.filter((e) => e.id !== id);
      const duplicate = entries.find(
        (entry) =>
          entry.id !== id &&
          entry.themeId === input.themeId &&
          (entry.level === 'Beginner') === (input.level === 'Beginner') &&
          (manualPositionKey(entry.fen) === manualPositionKey(input.fen) ||
            (input.beginnerBaseFen &&
              entry.beginnerBaseFen &&
              manualPositionKey(entry.beginnerBaseFen) ===
                manualPositionKey(input.beginnerBaseFen)))
      );
      if (duplicate)
        throw Object.assign(
          new Error('Thế cờ này đã có trong chủ đề. Hãy mở bài đã có để sửa.'),
          { statusCode: 409 }
        );
      const changedFen = !!old && old.fen !== input.fen;
      const updated =
        !changedFen &&
        input.alternativeLines === undefined &&
        old?.alternativeLines
          ? validateManualTactic({
              ...input,
              alternativeLines: old.alternativeLines,
            })
          : input;
      const now = new Date(
        Math.max(Date.now(), old ? Date.parse(old.updatedAt) + 1 : 0)
      ).toISOString();
      const entry = {
        ...updated,
        ...((old?.beginnerInsertion ?? insertion)
          ? { beginnerInsertion: old?.beginnerInsertion ?? insertion }
          : {}),
        reference: input.reference ?? old?.reference,
        headers: input.headers ?? old?.headers,
        gameOpening: input.gameOpening ?? old?.gameOpening,
        ...(input.level === 'Beginner' || old?.beginnerOriginalFen
          ? {
              beginnerOriginalFen:
                old?.beginnerOriginalFen ??
                input.beginnerOriginalFen ??
                old?.fen ??
                input.fen,
              ...((input.beginnerBaseFen ?? old?.beginnerBaseFen)
                ? {
                    beginnerBaseFen:
                      input.beginnerBaseFen ?? old?.beginnerBaseFen,
                  }
                : {}),
              ...((input.beginnerSourceLevel ?? old?.beginnerSourceLevel)
                ? {
                    beginnerSourceLevel:
                      input.beginnerSourceLevel ?? old?.beginnerSourceLevel,
                  }
                : {}),
            }
          : {}),
        previousMove: validateManualPreviousMove(
          input.fen,
          input.level === 'Beginner' && req.body.previousMove === null
            ? undefined
            : (input.previousMove ??
                (changedFen ? undefined : old?.previousMove))
        ),
        id,
        createdAt: old?.createdAt ?? now,
        updatedAt: now,
      };
      // Updating content must not move an exercise to the end of the review list.
      return old
        ? entries.map((item) => (item.id === id ? entry : item))
        : [...entries, entry];
    });
    const position = positions.find((e) => e.id === id);
    const theme = tacticsCatalog.themes.find((t) => t.id === position?.themeId);
    const destination = theme ? manualTopicPath(theme) : '';
    const adjustment = position
      ? await manualPracticeAdjustment(
          position,
          await readPracticeAdjustments(),
          positions
        )
      : undefined;
    const effectiveLevel = adjustment?.level ?? position?.level;
    const effectiveDestination = adjustment?.destinationScope ?? destination;
    return res.json({
      position,
      href: position
        ? `${effectiveDestination}${effectiveDestination.includes('?') ? '&' : '?'}level=${encodeURIComponent(effectiveLevel!)}&exercise=${adjustment?.destinationScope ? adjustment.id : id}`
        : undefined,
    });
  } catch (e) {
    return res
      .status((e as { statusCode?: number })?.statusCode === 409 ? 409 : 400)
      .json({
        error:
          e instanceof Error && !('code' in e)
            ? e.message
            : 'Không lưu được thế cờ. Dữ liệu cũ được giữ nguyên.',
      });
  }
}
