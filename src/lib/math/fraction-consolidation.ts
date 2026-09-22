import { MathLessonData, MathBlock, MathExercise } from './lessons';

const additionId = 'math-fractions-6';
const mergedIds = [additionId, 'math-fraction-basics-6', 'math-fraction-compare-6', 'math-fraction-subtract-6'];
const multiplyId = 'math-fraction-multiply-6';
const summary = 'Quy đồng: đưa các phân số về cùng mẫu lớn hơn 0.\nCộng: cộng các tử và giữ nguyên mẫu chung.\nTrừ: cộng với số đối của số trừ, hoặc quy đồng rồi trừ các tử và giữ nguyên mẫu.\nRút gọn kết quả khi có thể.\nVí dụ: -1/2 + 1/3 = -3/6 + 2/6 = -1/6; 1/3 − (-1/2) = 1/3 + 1/2 = 5/6.\nLưu ý: Không cộng hoặc trừ các mẫu số; mẫu số phải khác 0.';

// Consolidate by stable IDs. Keep authored edits and custom items from every source.
export function consolidateFractionLessons(lessons: MathLessonData[], originals: MathLessonData[]) {
  const sources = lessons.filter(l => mergedIds.includes(l.id));
  let result = lessons;
  if (sources.length) {
    const first = sources.find(l => l.id === additionId) ?? sources[0];
    const blocks: MathBlock[] = [];
    const exercises: MathExercise[] = [];
    const customSummaries: string[] = [];
    const customNotes: string[] = [];
    for (const id of mergedIds) {
      const source = sources.find(l => l.id === id);
      if (!source) continue;
      const original = originals.find(l => l.id === id);
      for (const block of source.blocks) {
        const originalBlock = original?.blocks.find(b => b.id === block.id);
        const edited = !originalBlock || JSON.stringify(block) !== JSON.stringify(originalBlock);
        if (source.id !== first.id && ['foundation', 'guided'].includes(block.section) && !edited) continue;
        const item = !edited && block.section === 'foundation'
          ? {...block, text: 'Nhớ cách rút gọn, quy đồng mẫu số và cộng, trừ số nguyên.'}
          : !edited && block.section === 'example'
            ? {...block, title: block.title.replace(/^\d+\. /, '')}
            : block;
        const existing = blocks.find(b => b.id === item.id);
        if (!existing) blocks.push(item);
        else if (JSON.stringify(existing) !== JSON.stringify(item)) blocks.push({...item, id: `${source.id}-${item.id}`});
      }
      for (const exercise of source.exercises) {
        const existing = exercises.find(e => e.id === exercise.id);
        if (!existing) exercises.push(exercise);
        else if (JSON.stringify(existing) !== JSON.stringify(exercise)) exercises.push({...exercise, id: `${source.id}-${exercise.id}`});
      }
      if (source.knowledgeSummary !== undefined && source.knowledgeSummary !== original?.knowledgeSummary && source.knowledgeSummary !== summary) customSummaries.push(source.knowledgeSummary);
      if (source.teacherNotes && source.teacherNotes !== original?.teacherNotes) customNotes.push(source.teacherNotes);
    }
    const knowledgeSummary = customSummaries.length ? customSummaries.join('\n\n') : summary;
    const teacherNotes = customNotes.join('\n\n');
    if (blocks.length <= 50 && exercises.length <= 100 && knowledgeSummary.length <= 4000 && teacherNotes.length <= 4000) {
      const combined: MathLessonData = {
        ...first, id: additionId, title: 'Cộng trừ phân số', topic: 'Phân số mở rộng',
        goal: 'Quy đồng, cộng trừ phân số, rút gọn kết quả và tìm thành phần chưa biết.',
        knowledgeSummary, teacherNotes, blocks, exercises,
      };
      let inserted = false;
      result = lessons.flatMap(lesson => {
        if (!mergedIds.includes(lesson.id)) return [lesson];
        if (inserted) return [];
        inserted = true;
        return [combined];
      });
    }
  }
  return result.map(lesson => {
    if (lesson.id !== multiplyId) return lesson;
    const original = originals.find(l => l.id === multiplyId);
    return {
      ...lesson, title: 'Nhân chia phân số',
      goal: 'Nhân chia phân số và rút gọn trước khi nhân.',
      blocks: lesson.blocks.map(block => block.section === 'foundation' && block.text === original?.blocks.find(b => b.id === block.id)?.text
        ? {...block, text: 'Nhớ cách rút gọn phân số và quy tắc dấu khi nhân, chia số nguyên.'}
        : block),
    };
  });
}
