import type { MathExercise } from './lessons';
import { calculationExpression } from './format';

function letter(index: number): string {
  let result = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26))
    result = String.fromCharCode(97 + (n - 1) % 26) + result;
  return result;
}

// Group only adjacent exercises, so author order and individual IDs remain intact.
export function exerciseLabels(exercises: MathExercise[]) {
  let number = 0, part = 0;
  return exercises.map((e, i) => {
    const first = !e.task || i === 0 || exercises[i - 1].task !== e.task;
    if (first) { number++; part = 0; } else part++;
    const sublabel = e.task ? letter(part) : '';
    let prompt = e.prompt.trim();
    if (e.task?.startsWith('Tính')) {
      const given = prompt.match(/^Biết (.+)\. Tính (.+)\.$/u);
      if (given) prompt = `${given[2]}, biết ${given[1]}.`;
      prompt = calculationExpression(prompt);
    }
    if (e.task?.startsWith('Tìm x, biết')) prompt = prompt.replace(/^Tìm x, biết:\s*/u, '');
    // Lift only the repeated instruction; retain conditions and units in each part.
    const sharedInstructions: [string, RegExp][] = [
      ['Tìm số thích hợp điền vào ô trống', /^Tìm số thích hợp điền vào ô trống:\s*/u],
      ['Điền số thích hợp', /^Điền số(?: vào ô trống)?:\s*/u],
      ['Điền số vào ô trống', /^Điền số vào ô trống:\s*/u],
      ['Điền dấu thích hợp', /^Điền dấu thích hợp:\s*/u],
      ['Tìm x', /^Tìm x:\s*/u],
      ['Rút gọn phân số', /^Rút gọn\s+/u],
      ['So sánh các phân số', /^So sánh\s+/u],
      ['Tìm mẫu chung nhỏ nhất', /^Tìm mẫu chung nhỏ nhất của\s+/u],
      ['Viết số', /^Viết số:\s*/u],
    ];
    for (const [title, prefix] of sharedInstructions)
      if (e.task === title) prompt = prompt.replace(prefix, '');
    return {
      number, part: sublabel, first, title: e.task,
      label: `Bài ${number}${sublabel ? `(${sublabel})` : ''}`,
      shortLabel: `${number}${sublabel ? `(${sublabel})` : ''}`,
      prompt: `${sublabel ? `${sublabel})` : `Bài ${number}.`} ${prompt}`,
    };
  });
}

export function sameExerciseContent(saved: unknown, exercises: MathExercise[]) {
  if (typeof saved !== 'string') return false;
  try {
    const previous: unknown = JSON.parse(saved);
    if (!Array.isArray(previous)) return false;
    const withoutTask = (items: unknown[]) => items.map(item => {
      if (!item || typeof item !== 'object') return item;
      const { task, ...content } = item as Record<string, unknown>;
      void task;
      return content;
    });
    return JSON.stringify(withoutTask(previous)) === JSON.stringify(withoutTask(exercises));
  } catch { return false; }
}
