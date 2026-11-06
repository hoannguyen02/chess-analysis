import type { NextApiRequest, NextApiResponse } from 'next';
import { requirePracticeAccess } from '@/lib/server/practice-access';
import {
  mutatePracticeAdjustments,
  practiceAdjustmentId,
  practiceManagementWritable,
  readPracticeAdjustments,
  validPracticeReference,
  validPracticeScope,
  practiceManagementTopics,
  assertPracticeDestinationAvailable,
  validatePracticeSolution,
} from '@/lib/server/practice-management';
import { practiceLevels, type PracticeLevel } from '@/lib/chess/draw-levels';
import {
  practiceManagementHref,
  practiceCurrentScope,
  type PracticeAdjustment,
} from '@/lib/chess/practice-management';

export const config = { api: { bodyParser: { sizeLimit: '64kb' } } };
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!requirePracticeAccess(req, res)) return;
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end();
  }
  if (req.method === 'POST' && !practiceManagementWritable())
    return res
      .status(403)
      .json({ error: 'Mở dự án trên máy để quản lý bài tập.' });
  try {
    const scope = req.method === 'GET' ? req.query.scope : req.body?.scope;
    if (!validPracticeScope(scope)) throw new Error('Chủ đề không hợp lệ.');
    if (req.method === 'GET')
      return res.json({
        writable: practiceManagementWritable(),
        entries: (await readPracticeAdjustments()).filter(
          (entry) =>
            entry.reference.scope === scope ||
            practiceCurrentScope(entry) === scope
        ),
        topics: practiceManagementTopics(),
      });
    const { id, action, expectedUpdatedAt, reference, signature } = req.body;
    const referenceId = reference
      ? practiceAdjustmentId(
          scope,
          reference.fen,
          reference.baseLevel === 'Beginner'
            ? (reference.manualId ?? undefined)
            : undefined
        )
      : undefined;
    const legacyReference =
      reference && reference.baseLevel === 'Beginner' && reference.manualId
        ? (await readPracticeAdjustments()).some(
            (entry) =>
              entry.id === id &&
              entry.reference.scope === scope &&
              entry.id === practiceAdjustmentId(scope, entry.reference.fen) &&
              entry.reference.baseLevel === 'Beginner' &&
              entry.reference.manualId === reference.manualId
          )
        : false;
    if (
      typeof id !== 'string' ||
      !/^[a-f0-9]{24}$/.test(id) ||
      ![
        'move',
        'remove',
        'restore',
        'reset',
        'solution',
        'reset-solution',
      ].includes(action)
    )
      throw new Error('Thay đổi không hợp lệ.');
    if (action === 'move' && !practiceLevels.includes(req.body.level))
      throw new Error('Chọn cấp độ hợp lệ.');
    if (
      action === 'move' &&
      req.body.destinationScope !== undefined &&
      !validPracticeScope(req.body.destinationScope)
    )
      throw new Error('Chọn chủ đề đích hợp lệ.');
    if (typeof req.body.note !== 'string' || req.body.note.length > 1000)
      throw new Error('Ghi chú tối đa 1000 ký tự.');
    const note = req.body.note.trim();
    if (
      ['move', 'remove', 'solution', 'reset-solution'].includes(action) &&
      (!validPracticeReference(reference, signature) ||
        reference.scope !== scope ||
        (referenceId !== id && !legacyReference))
    )
      return res
        .status(400)
        .json({ error: 'Bài tập đã thay đổi. Hãy tải lại trang rồi thử lại.' });
    let conflict = false;
    const entries = await mutatePracticeAdjustments(async (items) => {
      const old = items.find((entry) => entry.id === id);
      if (
        (old?.updatedAt ?? null) !== expectedUpdatedAt ||
        (old && old.reference.scope !== scope)
      ) {
        conflict = true;
        throw new Error(
          'Có thay đổi mới hơn. Hãy tải lại trang trước khi sửa.'
        );
      }
      if (!old && (action === 'restore' || action === 'reset'))
        throw new Error('Không tìm thấy thay đổi cần khôi phục.');
      const editingSolution =
        action === 'solution' || action === 'reset-solution';
      if (
        editingSolution &&
        (reference.manualId ||
          (old?.level ?? reference.baseLevel) === 'Beginner')
      )
        throw new Error(
          'Dùng cửa sổ chỉnh sửa thế cờ để sửa bài tự thêm hoặc bài Nhập môn.'
        );
      if (
        editingSolution &&
        (!reference.exercise || reference.exercise.decision)
      )
        throw new Error('Bài tập này không hỗ trợ ghi phương án.');
      if (old?.removed && editingSolution)
        throw new Error('Khôi phục bài tập trước khi sửa lời giải.');
      const solutionOverride =
        action === 'solution'
          ? validatePracticeSolution(reference, req.body.solution)
          : action === 'reset-solution'
            ? undefined
            : old?.solutionOverride;
      const destinationScope =
        action === 'reset'
          ? scope
          : action === 'move'
            ? (req.body.destinationScope ??
              (old ? practiceCurrentScope(old) : scope))
            : old
              ? practiceCurrentScope(old)
              : scope;
      if (action === 'move' || action === 'reset' || action === 'restore') {
        const source = reference ?? old!.reference;
        const destinationLevel =
          action === 'move'
            ? req.body.level
            : action === 'reset'
              ? source.baseLevel
              : (old?.level ?? source.baseLevel);
        let sourceMoves =
          old?.solutionOverride?.moves ??
          source.exercise?.moves ??
          source.moves;
        if (source.manualId) {
          const { readManualTactics } = await import(
            '@/lib/server/manual-tactics'
          );
          sourceMoves =
            (await readManualTactics()).find(
              (entry) => entry.id === source.manualId
            )?.moves ?? sourceMoves;
        }
        if (destinationLevel !== 'Beginner' && !sourceMoves?.length)
          throw new Error(
            'Ghi phương án hợp lệ trước khi chuyển bài tập sang cấp độ A–D.'
          );
        if (destinationScope !== scope && !source.exercise)
          throw new Error(
            'Hãy tải lại trang trước khi chuyển sang chủ đề khác.'
          );
        await assertPracticeDestinationAvailable(
          items,
          id,
          scope,
          destinationScope,
          source.fen,
          source
        );
      }
      const now = new Date(
        Math.max(Date.now(), old ? Date.parse(old.updatedAt) + 1 : 0)
      ).toISOString();
      const entry: PracticeAdjustment = {
        id,
        reference:
          action === 'move' || action === 'remove' || editingSolution
            ? reference
            : old!.reference,
        level:
          action === 'reset'
            ? null
            : action === 'move'
              ? req.body.level
              : (old?.level ?? null),
        ...(destinationScope !== scope ? { destinationScope } : {}),
        removed: action === 'remove',
        note: editingSolution ? (old?.note ?? '') : note,
        ...(solutionOverride ? { solutionOverride } : {}),
        updatedAt: now,
        history: [
          ...(old?.history ?? []),
          {
            action,
            level: action === 'move' ? req.body.level : null,
            scope: destinationScope,
            note,
            at: now,
            ...(action === 'solution' ? { solution: solutionOverride } : {}),
          },
        ],
      };
      // Incoming transfers use this order too; solution edits keep their slot.
      return old
        ? items.map((item) => (item.id === id ? entry : item))
        : [...items, entry];
    }).catch((error) => {
      if (conflict) res.status(409);
      throw error;
    });
    const entry = entries.find((item) => item.id === id)!;
    const level = entry.level ?? (entry.reference.baseLevel as PracticeLevel);
    return res.json({
      entry,
      href: practiceManagementHref(
        practiceCurrentScope(entry),
        level,
        entry.removed ? undefined : id
      ),
    });
  } catch (e) {
    return res.status(res.statusCode === 409 ? 409 : 400).json({
      error:
        e instanceof Error && !('code' in e)
          ? e.message
          : 'Không lưu được thay đổi. Dữ liệu cũ được giữ nguyên.',
    });
  }
}
