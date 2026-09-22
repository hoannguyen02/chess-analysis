import { LIMA_LOGO_PDF } from '../brand/logo';
import { LIMA_CONTACT } from '../brand/contact';
import { getKnowledgeSummary } from './knowledge-summary';
import { waitForPdfTask } from './pdf-task';
import {
  cancellationParts,
  cancellationText,
  stripRedundantFractionParentheses,
  wholeNumberFraction,
} from './format';
import {
  MathExercise,
  MathLessonData,
  checkAnswer,
  parseMathPack,
  packLessons,
} from './lessons';

// Small, self-contained A4 exporter: embedded TrueType outlines and searchable
// Unicode text. No network service, browser print dialog, or Python runtime.
const enc = new TextEncoder();
const W = 595.28,
  H = 841.89,
  M = 44,
  BOTTOM = 790;
const join = (parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
};
const hex = (n: number) => n.toString(16).padStart(4, '0');
function fontMetrics(bytes: Uint8Array) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength),
    tables: Record<string, number> = {};
  for (let i = 0; i < v.getUint16(4); i++) {
    const o = 12 + i * 16;
    tables[String.fromCharCode(...bytes.slice(o, o + 4))] = v.getUint32(o + 8);
  }
  const units = v.getUint16(tables.head + 18),
    metrics = v.getUint16(tables.hhea + 34),
    cmap = tables.cmap;
  let format4 = 0;
  for (let i = 0; i < v.getUint16(cmap + 2); i++) {
    const offset = cmap + v.getUint32(cmap + 4 + i * 8 + 4);
    if (v.getUint16(offset) === 4) format4 = offset;
  }
  if (!format4) throw new Error('Không đọc được phông PDF.');
  const count = v.getUint16(format4 + 6) / 2,
    ends = format4 + 14,
    starts = ends + count * 2 + 2,
    deltas = starts + count * 2,
    ranges = deltas + count * 2;
  function glyph(cp: number) {
    for (let i = 0; i < count; i++)
      if (
        cp <= v.getUint16(ends + i * 2) &&
        cp >= v.getUint16(starts + i * 2)
      ) {
        const delta = v.getInt16(deltas + i * 2),
          offset = v.getUint16(ranges + i * 2);
        if (!offset) return (cp + delta) & 65535;
        const id = v.getUint16(
          ranges + i * 2 + offset + (cp - v.getUint16(starts + i * 2)) * 2
        );
        return id ? (id + delta) & 65535 : 0;
      }
    return 0;
  }
  const width = (id: number) =>
    (v.getUint16(tables.hmtx + Math.min(id, metrics - 1) * 4) / units) * 1000;
  return {
    glyph,
    width,
    bbox: [36, 38, 40, 42].map((o) =>
      Math.round((v.getInt16(tables.head + o) / units) * 1000)
    ),
    ascent: Math.round((v.getInt16(tables.hhea + 4) / units) * 1000),
    descent: Math.round((v.getInt16(tables.hhea + 6) / units) * 1000),
  };
}
type Token = { text: string } | { n: string; d: string };
function tokens(text: string): Token[] {
  text = stripRedundantFractionParentheses(text.normalize('NFC'));
  const out: Token[] = [],
    re = /(\([^()]+\)|-?\d+|□)\s*\/\s*(\([^()]+\)|-?\d+|□)/g;
  let last = 0;
  const words = (s: string) =>
    s
      .split(/(\n|[ \t]+)/)
      .filter(Boolean)
      .forEach((text) => out.push({ text }));
  for (const match of text.matchAll(re)) {
    words(text.slice(last, match.index));
    const clean = (v: string) => (v.startsWith('(') ? v.slice(1, -1) : v);
    const n = clean(match[1]),
      d = clean(match[2]);
    const whole = wholeNumberFraction(n, d, text.slice(0, match.index));
    out.push(whole === null ? { n, d } : { text: whole });
    last = match.index! + match[0].length;
  }
  words(text.slice(last));
  return out;
}

export function printableWordProblemSolution(exercise: MathExercise) {
  if (!['number', 'fraction'].includes(exercise.kind)) return null;
  const prompt = exercise.prompt.normalize('NFC');
  const questionEnd = prompt.indexOf('?');
  if (questionEnd < 0 || questionEnd !== prompt.lastIndexOf('?')) return null;
  const question = prompt
    .slice(0, questionEnd)
    .split(/[.!]\s+/u)
    .at(-1)!
    .trim()
    .replace(/^Hỏi\s+/iu, '')
    .replace(/^Sau [^,]+,\s*/iu, '');
  let statement: string;
  const quantity = question.match(/^(.+?) (?:bằng|là) bao nhiêu(?: .+)?$/iu);
  const count = question.match(/^(.+?) bao nhiêu (.+)$/iu);
  if (quantity) statement = `${quantity[1]} là:`;
  else if (count) {
    statement = /^Còn$/iu.test(count[1])
      ? `Số ${count[2]} còn lại là:`
      : `${count[1]} số ${count[2]} là:`;
  } else return null;
  statement = statement[0].toLocaleUpperCase('vi') + statement.slice(1);

  // Only shorten a single numeric equality chain. Explanations, algebra and
  // separate calculations need their authored steps and are left intact.
  const steps = exercise.solution
    .normalize('NFC')
    .trim()
    .replace(/\.$/u, '')
    .split('=')
    .map((part) => part.trim());
  if (
    steps.length < 2 ||
    !steps
      .slice(0, -1)
      .every((part) => /^(?:\d+(?:[.,]\d+)?|[+−×÷*/:()[\]\s-])+$/u.test(part))
  )
    return null;
  const final = steps
    .at(-1)!
    .match(/^([+-]?\d+(?:[.,]\d+)?(?:\/\d+)?)\s*(?:\(([^()]+)\)|([^()]*))$/u);
  if (!final || !checkAnswer(exercise, final[1], exercise.unit).correct)
    return null;
  const unit = (final[2] || final[3] || exercise.unit).trim();
  if (!unit || !/^[\p{L}°²³%]+(?:[ /][\p{L}°²³%]+){0,2}$/u.test(unit))
    return null;
  if (exercise.unit && unit !== exercise.unit) return null;
  const value = final[1].replace('.', ',');
  const result = `${value} (${unit})`;
  const calculation = steps[0].replace(/(\d)\.(?=\d)/g, '$1,');
  return `${statement}\n${calculation} = ${result}\nĐáp số: ${value} ${unit}`;
}

type SolutionAlignment = 'left' | 'center';
type WordProblemRow = {
  text: string;
  role: 'heading' | 'explanation' | 'calculation' | 'answer';
  align: SolutionAlignment;
};

const wordProblemUnit = /\s*\(([\p{L}°²³%]+(?:[ /][\p{L}°²³%]+)*)\)(\s*\.?)$/u;

function wordProblemCalculation(line: string): string | null {
  // Use the same visible cancellation text as the renderer. Presentation marks
  // must not make a numeric calculation look like prose.
  const expression = cancellationText(line.replace(wordProblemUnit, ''));
  if (
    !expression.includes('=') ||
    !/^(?:[\d\s.,;+−×÷*/:()[\]{}=⁰¹²³⁴⁵⁶⁷⁸⁹^%-]|ƯCLN|BCNN|ƯC|BC)+$/u.test(
      expression
    )
  )
    return null;

  const steps = expression.replace(/\.$/u, '').split('=');
  // A word problem shows each calculation directly, as in the Grade 4
  // reference. Keep separate calculations and prose; only elide intermediate
  // numeric equalities, never symbolic working or a remainder explanation.
  if (
    steps.length > 2 &&
    steps.every((part) =>
      /^(?:\d+(?:[.,]\d+)?|[+−×÷*/:()[\]\s-])+$/u.test(part)
    ) &&
    /^[+−-]?\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?$/u.test(steps.at(-1)!.trim())
  ) {
    const authored = line.split('=').map((part) => part.trim());
    return `${authored[0]} = ${authored.at(-1)}`;
  }
  return line;
}

export function printableWordProblemRows(
  exercise: MathExercise
): WordProblemRow[] | null {
  if (exercise.kind === 'choice') return null;
  const text = printableWordProblemSolution(exercise) || exercise.solution;
  const lines = text
    .normalize('NFC')
    .trim()
    .replace(/^(?:Lời giải(?: mẫu)?|Bài giải)\s*:\s*/iu, '')
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
  const body: WordProblemRow[] = lines.map((line) => {
    if (/^Đáp số\s*:/iu.test(line))
      return {
        text: line
          .replace(/^Đáp số\s*:\s*/iu, 'Đáp số: ')
          .replace(wordProblemUnit, ' $1$2'),
        role: 'answer',
        align: 'left',
      };
    // Classification is only for page-break grouping, not an eligibility gate:
    // future notation and prose still use the shared workbook layout.
    const calculation = wordProblemCalculation(line);
    return {
      text: calculation ?? line,
      role: calculation !== null ? 'calculation' : 'explanation',
      align: 'center',
    };
  });
  // An explicit answer following working identifies the solution structure,
  // independent of lesson ID, grade, question wording or arithmetic symbols.
  if (body.length < 2 || body.at(-1)?.role !== 'answer') return null;
  return [{ text: 'Bài giải:', role: 'heading', align: 'center' }, ...body];
}

export type PracticePdfOptions = { includeKnowledgeSummary?: boolean };

export function createPracticePdf(
  input: MathLessonData,
  mode: 'worksheet' | 'solutions',
  fontBytes: Uint8Array,
  options: PracticePdfOptions = {}
): Uint8Array {
  const lesson = parseMathPack(packLessons([input])).lessons[0],
    exercises = lesson.exercises.filter((e) => e.section === 'extra');
  if (!exercises.length) throw new Error('Bài học chưa có bài tập thêm.');
  const font = fontMetrics(fontBytes),
    used = new Map<number, number>();
  const pages: string[][] = [];
  let page: string[],
    y = 0;
  const num = (n: number) => n.toFixed(2);
  function measure(text: string, size: number) {
    return Array.from(text.normalize('NFC')).reduce((w, char) => {
      const cp = char.codePointAt(0)!,
        gid = font.glyph(cp);
      if (!gid && cp !== 0)
        throw new Error(
          `Phông PDF chưa hỗ trợ ký tự “${char}”. Hãy thay ký tự này trong bài học.`
        );
      used.set(gid, cp);
      return w + (font.width(gid) * size) / 1000;
    }, 0);
  }
  function draw(
    text: string,
    x: number,
    top: number,
    size: number,
    color = '0.09 0.14 0.24'
  ) {
    measure(text, size);
    const glyphs = Array.from(text.normalize('NFC'), (c) =>
      hex(font.glyph(c.codePointAt(0)!))
    ).join('');
    page.push(
      `BT /F1 ${size} Tf ${color} rg 1 0 0 1 ${num(x)} ${num(H - top - size)} Tm <${glyphs}> Tj ET`
    );
  }
  function line(x1: number, top: number, x2: number, color = '0.75 0.80 0.87') {
    page.push(
      `${color} RG 0.6 w ${num(x1)} ${num(H - top)} m ${num(x2)} ${num(H - top)} l S`
    );
  }
  function drawFactors(value: string, x: number, top: number, size: number) {
    for (const part of cancellationParts(value)) {
      const width = measure(part.text, size);
      draw(part.text, x, top, size);
      if (part.cancelled) {
        page.push(
          `0.55 0.57 0.62 RG 0.3 w ${num(x)} ${num(H - top)} m ${num(x + width)} ${num(H - top - size)} l S`
        );
      }
      x += width;
    }
  }
  const tokenWidth = (t: Token, size: number) =>
    'text' in t
      ? measure(t.text, size)
      : Math.max(
          measure(cancellationText(t.n), size * 0.88),
          measure(cancellationText(t.d), size * 0.88)
        ) + 10;
  function layout(text: string, size: number, width = W - 2 * M) {
    const lines: Token[][] = [[]];
    let occupied = 0;
    for (const t of tokens(text)) {
      if ('text' in t && t.text === '\n') {
        lines.push([]);
        occupied = 0;
        continue;
      }
      if ('text' in t && /^\s+$/.test(t.text) && !occupied) continue;
      const tw = tokenWidth(t, size);
      if (tw > width) {
        if (!('text' in t))
          throw new Error('Phân số quá dài để in. Hãy chia nhỏ biểu thức.');
        for (const char of t.text) {
          const cw = measure(char, size);
          if (occupied + cw > width) {
            lines.push([]);
            occupied = 0;
          }
          lines.at(-1)!.push({ text: char });
          occupied += cw;
        }
      } else {
        if (occupied + tw > width && occupied) {
          lines.push([]);
          occupied = 0;
          if ('text' in t && /^\s+$/.test(t.text)) continue;
        }
        lines.at(-1)!.push(t);
        occupied += tw;
      }
    }
    return lines.map((items) => ({
      items,
      height: items.some((t) => !('text' in t)) ? size * 2.7 : size * 1.55,
    }));
  }
  function newPage() {
    page = [];
    pages.push(page);
    const first = pages.length === 1;
    const size = first ? 58 : 35;
    const top = 23;
    const scale = size / 500;
    // Same vector symbol as the website; white/black/gold works on paper.
    page.push(
      `q ${scale} 0 0 ${-scale} ${M} ${H - top + 40 * scale} cm ${LIMA_LOGO_PDF} Q`
    );
    draw(
      'LIMA Math',
      M + size + 10,
      first ? 36 : 30,
      first ? 21 : 14,
      '0.0627 0.0863 0.1020'
    );
    if (!first && mode === 'solutions') {
      line(M, 70, W - M);
      y = 84;
      return;
    }
    const titleY = first ? 91 : 70;
    draw(
      mode === 'worksheet' ? 'PHIẾU BÀI TẬP' : 'ĐÁP ÁN & HƯỚNG DẪN GIẢI',
      M,
      titleY,
      17
    );
    line(M, titleY + 28, W - M);
    y = titleY + 42;
  }

  function drawRow(
    items: Token[],
    x: number,
    size: number,
    frac = items.some((t) => !('text' in t))
  ) {
    for (const t of items) {
      const width = tokenWidth(t, size);
      if ('text' in t) draw(t.text, x, y + (frac ? size * 0.48 : 0), size);
      else {
        const fs = size * 0.88;
        drawFactors(
          t.n,
          x + (width - measure(cancellationText(t.n), fs)) / 2,
          y,
          fs
        );
        line(x + 2, y + size * 1.18, x + width - 2, '0.09 0.14 0.24');
        drawFactors(
          t.d,
          x + (width - measure(cancellationText(t.d), fs)) / 2,
          y + size * 1.38,
          fs
        );
      }
      x += width;
    }
  }
  function trimRow(items: Token[]) {
    let end = items.length;
    while (end) {
      const last = items[end - 1];
      if (!('text' in last) || !/^\s+$/u.test(last.text)) break;
      end--;
    }
    return items.slice(0, end);
  }
  function paragraph(
    text: string,
    size = 11,
    gap = 7,
    keep = false,
    align: SolutionAlignment = 'left',
    leftEdge = M
  ) {
    const lines = layout(text, size, W - M - leftEdge),
      height = lines.reduce((sum, l) => sum + l.height, 0);
    if (keep && height <= BOTTOM - 133 && y + height > BOTTOM) newPage();
    for (const row of lines) {
      if (y + row.height > BOTTOM) newPage();
      const items = align === 'left' ? row.items : trimRow(row.items);
      const width = items.reduce(
        (sum, item) => sum + tokenWidth(item, size),
        0
      );
      const x = align === 'center' ? (W - width) / 2 : leftEdge;
      drawRow(items, x, size);
      y += row.height;
    }
    y += gap;
  }
  function knowledgeSummary(text: string) {
    const rows = layout(text, 10.5);
    const heading = (continued: boolean, rowHeight: number) => {
      if (y + 28 + rowHeight > BOTTOM) newPage();
      draw(
        continued ? 'KIẾN THỨC CẦN NHỚ (tiếp theo)' : 'KIẾN THỨC CẦN NHỚ',
        M,
        y,
        12
      );
      line(M, y + 20, W - M);
      y += 28;
    };
    heading(false, rows[0].height);
    for (const row of rows) {
      if (y + row.height > BOTTOM) {
        newPage();
        heading(true, row.height);
      }
      drawRow(row.items, M, 10.5);
      y += row.height;
    }
    y += 18;
  }
  newPage();
  paragraph(lesson.title, 16, 8, true);
  paragraph(
    `Lớp ${lesson.grade} · ${lesson.topic} · ${exercises.length} bài tập`,
    10,
    10
  );
  if (mode === 'worksheet') {
    paragraph(
      'Họ và tên: ........................................  Lớp: ........  Ngày: ................',
      10,
      12
    );
    const review = getKnowledgeSummary(lesson).trim();
    if (options.includeKnowledgeSummary !== false && review)
      knowledgeSummary(review);
    paragraph(
      'Làm bài theo thứ tự hoặc chọn câu cần ôn. Trình bày các bước giải; chú ý đơn vị và yêu cầu tối giản.',
      10,
      14
    );
  } else
    paragraph(
      'Dùng sau khi tự làm bài. Bài tự luận có lời giải mẫu để tham khảo.',
      10,
      14
    );
  function choiceRows(options: string[]) {
    const labels = options.map(
      (option, index) => `${String.fromCharCode(65 + index)}. ${option}`
    );
    const items = labels.map((label) => tokens(label));
    const widths = items.map((row) =>
      row.reduce((sum, token) => sum + tokenWidth(token, 11), 0)
    );
    const available = W - 2 * M;
    let columns = Math.min(4, labels.length);
    while (
      columns > 1 &&
      (labels.some((label) => label.includes('\n')) ||
        widths.some((width) => width > available / columns - 16))
    )
      columns--;
    const rows = [];
    for (let i = 0; i < labels.length; i += columns) {
      const cells = labels
        .slice(i, i + columns)
        .map((label) =>
          layout(label, 11, available / columns - (columns > 1 ? 16 : 0))
        );
      const lineCount = Math.max(...cells.map((cell) => cell.length));
      const heights = Array.from({ length: lineCount }, (_, j) =>
        Math.max(...cells.map((cell) => cell[j]?.height || 0))
      );
      rows.push({
        startIndex: i,
        cells,
        heights,
        columns,
        height: heights.reduce((sum, height) => sum + height, 0),
      });
    }
    return rows;
  }
  function drawChoices(
    rows: ReturnType<typeof choiceRows>,
    correctIndex: number
  ) {
    for (const row of rows) {
      if (row.height <= BOTTOM - 133 && y + row.height > BOTTOM) newPage();
      row.heights.forEach((height, index) => {
        if (y + height > BOTTOM) newPage();
        const hasFraction = row.cells.some((cell) =>
          cell[index]?.items.some((token) => !('text' in token))
        );
        row.cells.forEach((cell, column) => {
          const x = M + (column * (W - 2 * M)) / row.columns;
          if (index === 0 && row.startIndex + column === correctIndex) {
            const label = `${String.fromCharCode(65 + correctIndex)}.`;
            const cx = x + measure(label, 11) / 2;
            const cy = H - (y + (hasFraction ? 11 * 0.48 : 0) + 7);
            const r = 8;
            const k = r * 0.5522847498;
            page.push(
              `q 0.09 0.14 0.24 RG 0.8 w ${num(cx + r)} ${num(cy)} m ` +
                `${num(cx + r)} ${num(cy + k)} ${num(cx + k)} ${num(cy + r)} ${num(cx)} ${num(cy + r)} c ` +
                `${num(cx - k)} ${num(cy + r)} ${num(cx - r)} ${num(cy + k)} ${num(cx - r)} ${num(cy)} c ` +
                `${num(cx - r)} ${num(cy - k)} ${num(cx - k)} ${num(cy - r)} ${num(cx)} ${num(cy - r)} c ` +
                `${num(cx + k)} ${num(cy - r)} ${num(cx + r)} ${num(cy - k)} ${num(cx + r)} ${num(cy)} c S Q`
            );
          }
          if (cell[index]) drawRow(cell[index].items, x, 11, hasFraction);
        });
        y += height;
      });
    }
    y += 6;
  }
  exercises.forEach((e, i) => {
    const prompt = `Bài ${i + 1}. ${e.prompt.trim()}`;
    const options = e.kind === 'choice' ? choiceRows(e.options) : [];
    const wordRows = mode === 'solutions' ? printableWordProblemRows(e) : null;
    const plainSolution =
      !wordRows && mode === 'solutions'
        ? `${e.kind === 'written' ? 'Lời giải mẫu' : 'Lời giải'}: ${e.solution}`
        : null;
    const plainSolutionLines = plainSolution ? layout(plainSolution, 11) : [];
    // Every calculation line is centered, so its halfway point is W / 2,
    // including wrapped lines and stacked fractions. The answer starts below it.
    const calculationMidpoint = W / 2;
    const solutionRows = wordRows?.map((row) => {
      let left = M;
      if (row.role === 'answer') {
        const width = Math.min(
          W - 2 * M,
          tokens(row.text).reduce((sum, item) => sum + tokenWidth(item, 11), 0)
        );
        // Shift left only when necessary to keep the answer on the page;
        // answers wider than the full content area wrap at the page margins.
        left = Math.max(M, Math.min(calculationMidpoint, W - M - width));
      }
      const gap = row.role === 'heading' ? 6 : 0;
      return {
        ...row,
        left,
        gap,
        height: layout(row.text, 11, W - M - left).reduce(
          (sum, line) => sum + line.height,
          gap
        ),
      };
    });
    const work =
      mode === 'worksheet' && e.kind !== 'choice'
        ? { small: 36, medium: 72, large: 108 }[e.workspace || 'medium']
        : 0;
    const headHeight =
      layout(prompt, 11).reduce((n, l) => n + l.height, 0) +
      (options.length ? options.reduce((n, row) => n + row.height, 0) + 7 : 0) +
      32;
    const solutionHeight =
      solutionRows?.reduce((n, row) => n + row.height, 0) ??
      plainSolutionLines.reduce((n, row) => n + row.height, 0);
    const blockHeight = headHeight + solutionHeight + work;
    // Keep a question and its solution together. An oversized authored solution
    // must flow across pages instead of leaving the first page empty.
    const reservedHeight =
      mode === 'solutions' && blockHeight > BOTTOM - 84
        ? headHeight +
          (solutionRows
            ? solutionRows[0].height + solutionRows[1].height
            : plainSolutionLines[0]?.height || 0)
        : blockHeight;
    if (y + reservedHeight > BOTTOM && y > 100) newPage();
    paragraph(prompt, 11, 8, true);
    if (options.length)
      drawChoices(
        options,
        mode === 'solutions' ? e.options.indexOf(e.answer) : -1
      );
    if (mode === 'solutions') {
      if (solutionRows) {
        for (let start = 0; start < solutionRows.length; ) {
          let end = start + 1;
          while (
            end < solutionRows.length &&
            (solutionRows[end - 1].role === 'heading' ||
              (solutionRows[end - 1].role === 'explanation' &&
                solutionRows[end].role === 'calculation') ||
              solutionRows[end].role === 'answer')
          )
            end++;
          const rows = solutionRows.slice(start, end);
          const height = rows.reduce((n, row) => n + row.height, 0);
          if (height <= BOTTOM - 84 && y + height > BOTTOM) newPage();
          for (const row of rows)
            paragraph(row.text, 11, row.gap, false, row.align, row.left);
          start = end;
        }
        y += 8;
      } else if (plainSolution) paragraph(plainSolution, 11, 8);
      y += 8;
    } else {
      for (let space = 0; space < work; space += 18) {
        if (y + 18 > BOTTOM) newPage();
        line(M, y + 16, W - M, '0.85 0.88 0.92');
        y += 18;
      }
      y += 14;
    }
  });
  pages.forEach((p, i) => {
    page = p;
    line(M, 807, W - M);
    draw(`${LIMA_CONTACT.name} · ${LIMA_CONTACT.address}`, M, 811, 7);
    draw(`${LIMA_CONTACT.email} · ${LIMA_CONTACT.phone}`, M, 823, 7);
    draw(`${i + 1} / ${pages.length}`, W - M - 40, 813, 8);
  });
  const objects: Uint8Array[] = [enc.encode(''), enc.encode('')];
  const add = (body: string | Uint8Array) => {
    objects.push(typeof body === 'string' ? enc.encode(body) : body);
    return objects.length;
  };
  const stream = (bytes: Uint8Array, extra = '') =>
    join([
      enc.encode(`<< /Length ${bytes.length} ${extra} >>\nstream\n`),
      bytes,
      enc.encode('\nendstream'),
    ]);
  const fontFile = add(stream(fontBytes, `/Length1 ${fontBytes.length}`));
  const descriptor = add(
    `<< /Type /FontDescriptor /FontName /DejaVuSans /Flags 32 /FontBBox [${font.bbox.join(' ')}] /ItalicAngle 0 /Ascent ${font.ascent} /Descent ${font.descent} /CapHeight ${font.ascent} /StemV 80 /FontFile2 ${fontFile} 0 R >>`
  );
  const entries = Array.from(used.entries());
  const mappings = [];
  for (let i = 0; i < entries.length; i += 100) {
    const group = entries.slice(i, i + 100);
    mappings.push(
      `${group.length} beginbfchar\n${group.map(([gid, cp]) => `<${hex(gid)}> <${hex(cp)}>`).join('\n')}\nendbfchar`
    );
  }
  const toUnicode = add(
    stream(
      enc.encode(
        `/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /MathUnicode def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n${mappings.join('\n')}\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend`
      )
    )
  );
  const descendant = add(
    `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /DejaVuSans /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${descriptor} 0 R /CIDToGIDMap /Identity /DW 1000 /W [${entries.map(([gid]) => `${gid} [${num(font.width(gid))}]`).join(' ')}] >>`
  );
  const fontObject = add(
    `<< /Type /Font /Subtype /Type0 /BaseFont /DejaVuSans /Encoding /Identity-H /DescendantFonts [${descendant} 0 R] /ToUnicode ${toUnicode} 0 R >>`
  );
  const pageIds = pages.map((commands) => {
    const content = add(stream(enc.encode(commands.join('\n'))));
    return add(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${fontObject} 0 R >> >> /Contents ${content} 0 R >>`
    );
  });
  objects[0] = enc.encode('<< /Type /Catalog /Pages 2 0 R >>');
  objects[1] = enc.encode(
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`
  );
  const chunks = [enc.encode('%PDF-1.7\n')],
    offsets = [0];
  let length = chunks[0].length;
  objects.forEach((body, i) => {
    offsets.push(length);
    const chunk = join([
      enc.encode(`${i + 1} 0 obj\n`),
      body,
      enc.encode('\nendobj\n'),
    ]);
    chunks.push(chunk);
    length += chunk.length;
  });
  chunks.push(
    enc.encode(
      `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
        .slice(1)
        .map((o) => `${String(o).padStart(10, '0')} 00000 n \n`)
        .join(
          ''
        )}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF\n`
    )
  );
  return join(chunks);
}
export function practicePdfFilename(
  lesson: Pick<MathLessonData, 'grade' | 'title' | 'topic'>,
  mode: 'worksheet' | 'solutions'
) {
  const clean = (value: string) =>
    value
      .normalize('NFC')
      .replace(/:/g, ' - ')
      .replace(/[<>"/\\|?*\p{Cc}\p{Cf}]/gu, ' ')
      .replace(/\s+/gu, ' ')
      .replace(/^[.\s-]+|[.\s-]+$/gu, '');
  let title = clean(lesson.title) || clean(lesson.topic) || 'Bài học';
  const prefix = `LIMAMath - Lớp ${lesson.grade} - `;
  const suffix = ` - ${mode === 'worksheet' ? 'Bài tập' : 'Lời giải'}.pdf`;
  // Bound the complete UTF-8 filename, retaining the grade, type and extension.
  const available = 240 - enc.encode(prefix + suffix).length;
  if (enc.encode(title).length > available) {
    let shortened = '',
      length = 0;
    for (const char of title) {
      const size = enc.encode(char).length;
      if (length + size > available - enc.encode('…').length) break;
      shortened += char;
      length += size;
    }
    title = `${shortened.replace(/[.\s-]+$/gu, '')}…`;
  }
  return `${prefix}${title}${suffix}`;
}

export async function downloadPracticePdf(
  lesson: MathLessonData,
  mode: 'worksheet' | 'solutions',
  options: PracticePdfOptions = {},
  signal: AbortSignal = new AbortController().signal
) {
  signal.throwIfAborted();
  const response = await waitForPdfTask(
    fetch('/fonts/DejaVuSans.ttf', { signal }),
    signal
  );
  if (!response.ok) throw new Error('Không tải được phông chữ. Hãy thử lại.');
  const font = await waitForPdfTask(response.arrayBuffer(), signal);
  signal.throwIfAborted();
  const bytes = createPracticePdf(lesson, mode, new Uint8Array(font), options);
  signal.throwIfAborted();
  const url = URL.createObjectURL(
    new Blob([bytes as BlobPart], { type: 'application/pdf' })
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = practicePdfFilename(lesson, mode);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
