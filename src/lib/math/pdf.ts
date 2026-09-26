import { exerciseLabels } from './exercise-groups';
import { mathXPdfPath, mathXStrokeWidth } from './math-variable-glyph';
import { LIMA_CONTACT } from '../brand/contact';
import { LIMA_LOGO_PDF } from '../brand/logo';
import {
  cancellationParts,
  cancellationText,
  formatCalculationSteps,
  calculationContinuation,
  isCalculationOnlySolution,
  formatMultiplicationNotation,
  variableParts,
  stripRedundantFractionParentheses,
  wholeNumberFraction,
} from './format';
import { getKnowledgeSummary } from './knowledge-summary';
import {
  checkAnswer,
  MathExercise,
  MathLessonData,
  packLessons,
  parseMathPack,
} from './lessons';
import { withNumberLineSolution } from './number-line-lesson';
import { waitForPdfTask } from './pdf-task';
import { segmentGeometry } from './segment';
import { numberLineGeometry, SolutionNumberLine } from './solution-number-line';
import { upgradeUnitFractionSolutions } from './unit-fraction-lesson';
import { updateExponentCoefficientNotation } from './rational-exponent-equations';
import {
  WordProblemRow as SharedWordProblemRow,
  wordProblemRows,
} from './word-problem-format';

// Small, self-contained A4 exporter: embedded TrueType outlines and searchable
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
type TextToken = {
  text: string;
  exponent?: string;
  innerExponent?: string;
  parenthesized?: boolean;
};
type FractionToken = {
  n: string;
  d: string;
  parenthesized?: boolean;
  exponent?: string;
  nested?: boolean;
  outerExponent?: string;
};
type GroupedExpressionToken = {
  items: Token[];
  exponent: string;
};
type Token = TextToken | FractionToken | GroupedExpressionToken;
function containsFraction(token: Token): boolean {
  return 'items' in token ? token.items.some(containsFraction) : 'n' in token;
}
function tokens(text: string, grade = 0): Token[] {
  text = formatMultiplicationNotation(text, grade);
  text = stripRedundantFractionParentheses(text.normalize('NFC'));
  const grouped = /\(([^()]+)\)\^(\([^()]*\)|[+-]?(?:\d+|[a-zA-Z]))/gu;
  const groupedMatches = [...text.matchAll(grouped)].filter((match) =>
    /\s[+\-−]\s/u.test(match[1])
  );
  if (groupedMatches.length) {
    const out: Token[] = [];
    let last = 0;
    for (const match of groupedMatches) {
      const index = match.index!;
      out.push(...tokens(text.slice(last, index)));
      out.push({
        items: tokens(match[1]),
        exponent: match[2].replace(/^\(|\)$/gu, ''),
      });
      last = index + match[0].length;
    }
    out.push(...tokens(text.slice(last)));
    return out;
  }
  const out: Token[] = [],
    re =
      /(?:(?:\[|\()\s*\(\s*(\([^()]+\)|~[^~]+~|-?\d+|□)\s*\/\s*(\([^()]+\)|~[^~]+~|-?\d+|□)\s*\)\s*\^(\([^()]*\)|[+-]?(?:\d+|[a-zA-Z]))\s*(?:\]|\))\s*\^(\([^()]*\)|[+-]?(?:\d+|[a-zA-Z])))|(?:\(\s*(\([^()]+\)|~[^~]+~|-?\d+|□)\s*\/\s*(\([^()]+\)|~[^~]+~|-?\d+|□)\s*\)\s*\^(\([^()]*\)|[+-]?(?:\d+|[a-zA-Z])))|(?:\(\s*(\([^()]+\)|~[^~]+~|-?\d+|□)\s*\/\s*(\([^()]+\)|~[^~]+~|-?\d+|□)\s*\))|(?:(\([^()]+\)|~[^~]+~|-?\d+|□)\s*\/\s*(\([^()]+\)|~[^~]+~|-?\d+|□))/g;
  let last = 0;
  const plainWords = (s: string) =>
    s
      .split(/(\n|[ \t]+)/)
      .filter(Boolean)
      .forEach((text) => out.push({ text }));
  const words = (s: string) => {
    const power =
      /\(\s*([a-zA-Z]|-?\d+)\s*\^(\([^()]*\)|[+-]?(?:\d+|[a-zA-Z]))\s*\)\s*\^(\([^()]*\)|[+-]?(?:\d+|[a-zA-Z]))|(\([^()]+\)|[a-zA-Z]|-?\d+)\s*\^(\([^()]*\)|[+-]?(?:\d+|[a-zA-Z]))/g;
    let powerLast = 0;
    const clean = (value: string) =>
      value.startsWith('(') ? value.slice(1, -1) : value;
    for (const match of s.matchAll(power)) {
      plainWords(s.slice(powerLast, match.index));
      if (match[1])
        out.push({
          text: match[1],
          innerExponent: clean(match[2]),
          exponent: clean(match[3]),
          parenthesized: true,
        });
      else
        out.push({
          text: clean(match[4]),
          exponent: clean(match[5]),
          parenthesized: match[4].startsWith('('),
        });
      powerLast = match.index! + match[0].length;
    }
    plainWords(s.slice(powerLast));
  };
  for (const match of text.matchAll(re)) {
    words(text.slice(last, match.index));
    const clean = (v: string) => (v.startsWith('(') ? v.slice(1, -1) : v);
    const nested = Boolean(match[1]);
    const powered = Boolean(match[5]);
    const parenthesized = nested || powered || Boolean(match[8]);
    const offset = nested ? 0 : powered ? 4 : parenthesized ? 7 : 9;
    const n = clean(match[offset + 1]),
      d = clean(match[offset + 2]),
      exponent = nested || powered ? clean(match[offset + 3]) : undefined,
      outerExponent = nested ? clean(match[4]) : undefined;
    const whole = wholeNumberFraction(n, d, text.slice(0, match.index));
    out.push(
      whole === null
        ? { n, d, parenthesized, exponent, nested, outerExponent }
        : { text: whole }
    );
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
type PdfWordProblemRow = SharedWordProblemRow & {
  align: SolutionAlignment;
};
type LaidOutWordProblemRow = PdfWordProblemRow & {
  left: number;
  gap: number;
  height: number;
};

export function printableWordProblemRows(
  exercise: MathExercise
): PdfWordProblemRow[] | null {
  if (exercise.kind === 'choice') return null;
  const rows = wordProblemRows(
    printableWordProblemSolution(exercise) || exercise.solution
  );
  if (!rows) return null;
  return (
    rows.map(
      (row): PdfWordProblemRow => ({
        ...row,
        align: row.role === 'answer' ? 'left' : 'center',
      })
    ) || null
  );
}

export type PracticePdfOptions = { includeKnowledgeSummary?: boolean };

/** Shared answer-first presentation for short-answer and choice exercises.
 * Word problems keep their dedicated workbook rows; tables/written tasks have
 * model solutions rather than a single automatically checked answer.
 */
export function printableShortSolution(exercise: MathExercise): string {
  if (exercise.table || exercise.kind === 'written')
    return `${exercise.kind === 'written' ? 'Lời giải mẫu' : 'Lời giải'}: ${exercise.solution}`;
  // Find-x workings already end in the answer. Preserve all authored equations
  // and explanations, without adding a duplicate answer or method label.
  if ((exercise.kind === 'number' || exercise.kind === 'fraction') &&
      !exercise.unit && !exercise.solutionStyle &&
      /^Tìm\s+x\b/iu.test(exercise.prompt.trim()) &&
      exercise.solution.includes('=') && variableParts(exercise.solution).includes('x'))
    return calculationContinuation(exercise.prompt, exercise.solution);
  if ((exercise.kind === 'number' || exercise.kind === 'fraction') &&
      !exercise.unit && !exercise.solutionStyle && isCalculationOnlySolution(exercise.solution))
    return calculationContinuation(exercise.prompt, exercise.solution);
  const optionIndex = exercise.options.indexOf(exercise.answer);
  const normalized = (text: string) =>
    text
      .trim()
      .replace(/[.!。]+$/u, '')
      .toLocaleLowerCase('vi');
  const answerOnly =
    exercise.solutionStyle === 'answer-only' ||
    normalized(exercise.solution) === normalized(exercise.answer);
  const answer =
    exercise.kind === 'choice'
      ? optionIndex >= 0
        ? `${String.fromCharCode(65 + optionIndex)}${answerOnly ? `. ${exercise.answer}` : ''}`
        : exercise.answer
      : `${exercise.answer}${exercise.unit ? ` ${exercise.unit}` : ''}`;
  const heading = `Đáp án: ${answer}`;
  // Only an explicit author decision (or exact duplicate) can hide working.
  if (answerOnly) return heading;
  const style =
    exercise.solutionStyle ??
    (/=/u.test(exercise.solution) ? 'method' : 'explanation');
  return `${heading}\n${style === 'method' ? 'Cách làm' : 'Giải thích'}: ${formatCalculationSteps(exercise.solution)}`;
}

export function createPracticePdf(
  input: MathLessonData,
  mode: 'worksheet' | 'solutions',
  fontBytes: Uint8Array,
  options: PracticePdfOptions = {}
): Uint8Array {
  input = upgradeUnitFractionSolutions([input])[0];
  input = updateExponentCoefficientNotation([input])[0];
  const lesson = parseMathPack(
      packLessons([
        {
          ...input,
          exercises: input.exercises.map(withNumberLineSolution),
        },
      ])
    ).lessons[0],
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
    color = '0.09 0.14 0.24',
    italic = false
  ) {
    measure(text, size);
    const parts = variableParts(text);
    if (!italic && parts.includes('x')) {
      for (const part of parts) {
        if (part) draw(part, x, top, size, color, part === 'x');
        x += measure(part, size);
      }
      return;
    }
    if (text.includes('□')) {
      for (const part of text.split(/(□)/u)) {
        const advance = measure(part, size);
        if (part === '□') {
          // Keep the original placeholder's advance so wrapping is unchanged.
          // Center on the digit/capital height, not on the text baseline.
          const side = Math.min(size * 0.95, advance - size * 0.08);
          const centerTop = top + size * 0.635;
          const questionSize = size * 0.7;
          page.push(
            '/Span << /ActualText <FEFF25A1> >> BDC',
            `q ${color} RG ${num(size * 0.06)} w ${num(x + (advance - side) / 2)} ${num(H - centerTop - side / 2)} ${num(side)} ${num(side)} re S Q`
          );
          draw(
            '?',
            x + (advance - measure('?', questionSize)) / 2,
            centerTop - questionSize * 0.635,
            questionSize,
            color
          );
          page.push('EMC');
        } else if (part) draw(part, x, top, size, color);
        x += advance;
      }
      return;
    }
    const glyphs = Array.from(text.normalize('NFC'), (c) =>
      hex(font.glyph(c.codePointAt(0)!))
    ).join('');
    if (italic) {
      // Invisible searchable ASCII x plus the same true math outline used on web.
      page.push(`q BT 3 Tr ET`,
        `BT /F1 ${size} Tf ${color} rg 1 0 0 1 ${num(x)} ${num(H - top - size)} Tm <${glyphs}> Tj ET`,
        'Q',
        `q ${color} rg ${(measure('x', size) / 559).toFixed(6)} 0 0 ${(size * 1.14 / 1000).toFixed(6)} ${num(x)} ${num(H - top - size)} cm`,
        `${color} RG ${mathXStrokeWidth} w 1 j`, mathXPdfPath, 'B Q');
      return;
    }
    page.push(
      `BT /F1 ${size} Tf ${color} rg 1 0 0 1 ${num(x)} ${num(H - top - size)} Tm <${glyphs}> Tj ET`
    );
  }
  function drawTallDelimiter(
    text: '(' | ')' | '[' | ']',
    x: number,
    top: number,
    size: number,
    scaleY: number
  ) {
    const glyphs = Array.from(text, (char) =>
      hex(font.glyph(char.codePointAt(0)!))
    ).join('');
    measure(text, size);
    page.push(
      `BT /F1 ${size} Tf 0.09 0.14 0.24 rg 1 0 0 ${scaleY} ${num(x)} ${num(H - top - size * scaleY)} Tm <${glyphs}> Tj ET`
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
  const fractionWidth = (t: FractionToken, size: number) =>
    Math.max(
      measure(cancellationText(t.n), size * 0.88),
      measure(cancellationText(t.d), size * 0.88)
    ) + 10;
  function ordinaryTokenWidth(
    t: TextToken | FractionToken,
    size: number
  ): number {
    if ('text' in t) {
      if (!t.exponent) return measure(t.text, size);
      const baseWidth = measure(t.text, size);
      const bracketWidth = t.parenthesized ? measure('(', size) * 2 : 0;
      const innerExponentWidth = t.innerExponent
        ? measure(t.innerExponent, size * 0.68)
        : 0;
      return (
        baseWidth +
        bracketWidth +
        innerExponentWidth +
        measure(t.exponent, size * 0.68)
      );
    }
    const innerBracket = t.parenthesized ? measure('(', size) * 2 : 0;
    const outerBracket = t.nested ? measure('[', size) * 2 : 0;
    const innerExponent = t.exponent ? measure(t.exponent, size * 0.68) : 0;
    const outerExponent = t.outerExponent
      ? measure(t.outerExponent, size * 0.68)
      : 0;
    const outerGap = t.nested ? size * 0.18 : 0;
    return (
      fractionWidth(t, size) +
      innerBracket +
      outerBracket +
      innerExponent +
      outerExponent +
      outerGap * 3
    );
  }
  function tokenWidth(t: Token, size: number): number {
    if (!('items' in t)) return ordinaryTokenWidth(t, size);
    const contentWidth = t.items.reduce(
      (sum, item) =>
        sum + ordinaryTokenWidth(item as TextToken | FractionToken, size),
      0
    );
    return (
      measure('(', size) * 2 + contentWidth + measure(t.exponent, size * 0.68)
    );
  }
  function layout(text: string, size: number, width = W - 2 * M) {
    const lines: Token[][] = [[]];
    let occupied = 0;
    for (const t of tokens(text, lesson.grade)) {
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
      height: items.some(containsFraction) ? size * 2.7 : size * 1.55,
    }));
  }
  function newPage() {
    page = [];
    pages.push(page);
    // A single, faint mark preserves attribution without competing with print text.
    // Paint behind all content without advancing y or changing pagination.
    // Mark as a decorative artifact; this is branding, not edit protection.
    const watermark = 'LIMA';
    const watermarkSize = 30;
    const halfWidth = measure(watermark, watermarkSize) / 2;
    const glyphs = Array.from(watermark, (c) =>
      hex(font.glyph(c.codePointAt(0)!))
    ).join('');
    const cosine = Math.cos(Math.PI / 6);
    page.push('/Artifact << /Type /Pagination /Subtype /Watermark >> BDC', 'q');
    const center = 300,
      baseline = 420;
    page.push(
      `BT /F1 ${watermarkSize} Tf 0.975 0.975 0.975 rg ${cosine.toFixed(6)} 0.5 -0.5 ${cosine.toFixed(6)} ${num(center - halfWidth * cosine)} ${num(baseline - halfWidth * 0.5)} Tm <${glyphs}> Tj ET`
    );
    page.push('Q', 'EMC');
    const first = pages.length === 1;
    const size = first ? 58 : 35;
    const top = 23;
    const scale = size / 500;
    // Same vector symbol as the website; white/black/gold works on paper.
    page.push(
      `q ${scale} 0 0 ${-scale} ${M} ${H - top + 40 * scale} cm ${LIMA_LOGO_PDF} Q`
    );
    draw(
      'LIMA',
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
    frac = items.some(containsFraction)
  ) {
    for (const t of items) {
      const width = tokenWidth(t, size);
      if ('items' in t) {
        const contentWidth = t.items.reduce(
          (sum, item) => sum + tokenWidth(item, size),
          0
        );
        const hasFraction = t.items.some(containsFraction);
        const bracketWidth = measure('(', size);
        const baseline = y + (frac ? size * 0.48 : 0);
        if (hasFraction) {
          drawTallDelimiter('(', x, y - size * 0.08, size, 2.1);
          drawTallDelimiter(
            ')',
            x + bracketWidth + contentWidth,
            y - size * 0.08,
            size,
            2.1
          );
        } else {
          draw('(', x, baseline, size);
          draw(')', x + bracketWidth + contentWidth, baseline, size);
        }
        // A text-only group inherits the surrounding row's math baseline.
        // A group containing real fractions keeps the fraction's top origin.
        drawRow(t.items, x + bracketWidth, size, frac);
        draw(
          t.exponent,
          x + bracketWidth * 2 + contentWidth,
          hasFraction ? y - size * 0.12 : baseline - size * 0.38,
          size * 0.68
        );
      } else if ('text' in t) {
        const baseline = y + (frac ? size * 0.48 : 0);
        if (!t.exponent) draw(t.text, x, baseline, size);
        else {
          const bracketWidth = t.parenthesized ? measure('(', size) : 0;
          const baseX = x + bracketWidth;
          if (t.parenthesized) draw('(', x, baseline, size);
          draw(t.text, baseX, baseline, size);
          const baseEnd = baseX + measure(t.text, size);
          if (t.innerExponent) {
            draw(t.innerExponent, baseEnd, baseline - size * 0.38, size * 0.68);
            draw(
              ')',
              baseEnd + measure(t.innerExponent, size * 0.68),
              baseline,
              size
            );
          } else if (t.parenthesized) draw(')', baseEnd, baseline, size);
          const outerX =
            baseEnd +
            (t.innerExponent
              ? measure(t.innerExponent, size * 0.68) + measure(')', size)
              : t.parenthesized
                ? measure(')', size)
                : 0);
          draw(t.exponent, outerX, baseline - size * 0.38, size * 0.68);
        }
      } else {
        const fs = size * 0.88;
        const baseWidth = fractionWidth(t, size);
        const innerBracketSize = size;
        const innerBracketScaleY = 2.1;
        const innerBracketWidth = t.parenthesized
          ? measure('(', innerBracketSize)
          : 0;
        const outerBracketSize = size;
        const outerBracketScaleY = innerBracketScaleY * (2.35 / 1.85);
        const outerBracketTop =
          y - size * (0.08 + (outerBracketScaleY - innerBracketScaleY) / 2);
        const outerBracketWidth = t.nested ? measure('[', outerBracketSize) : 0;
        const outerGap = t.nested ? size * 0.18 : 0;
        const innerExponentWidth = t.exponent
          ? measure(t.exponent, size * 0.68)
          : 0;
        const fractionX = x + outerBracketWidth + outerGap + innerBracketWidth;
        drawFactors(
          t.n,
          fractionX + (baseWidth - measure(cancellationText(t.n), fs)) / 2,
          y,
          fs
        );
        line(
          fractionX + 2,
          y + size * 1.18,
          fractionX + baseWidth - 2,
          '0.09 0.14 0.24'
        );
        drawFactors(
          t.d,
          fractionX + (baseWidth - measure(cancellationText(t.d), fs)) / 2,
          y + size * 1.38,
          fs
        );
        if (t.parenthesized) {
          drawTallDelimiter(
            '(',
            x + outerBracketWidth + outerGap,
            y - size * 0.08,
            innerBracketSize,
            innerBracketScaleY
          );
          drawTallDelimiter(
            ')',
            fractionX + baseWidth,
            y - size * 0.08,
            innerBracketSize,
            innerBracketScaleY
          );
        }
        if (t.exponent)
          draw(
            t.exponent,
            fractionX + baseWidth + innerBracketWidth,
            y - size * 0.12,
            size * 0.68
          );
        if (t.nested) {
          drawTallDelimiter(
            '[',
            x,
            outerBracketTop,
            outerBracketSize,
            outerBracketScaleY
          );
          drawTallDelimiter(
            ']',
            fractionX +
              baseWidth +
              innerBracketWidth +
              innerExponentWidth +
              outerGap,
            outerBracketTop,
            outerBracketSize,
            outerBracketScaleY
          );
        }
        if (t.outerExponent)
          draw(
            t.outerExponent,
            fractionX +
              baseWidth +
              innerBracketWidth +
              innerExponentWidth +
              outerGap * 2 +
              outerBracketWidth,
            y - size * 0.25,
            size * 0.68
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
  function solutionNumberLineLayout(diagram: SolutionNumberLine) {
    const geometry = numberLineGeometry(diagram);
    const label = (text: string, position: number, name = false) => {
      const items: Token[] = name ? [{ text }] : tokens(text, lesson.grade);
      return {
        position,
        items,
        width: items.reduce((sum, item) => sum + tokenWidth(item, 10), 0),
      };
    };
    const integerStride = Math.max(
      1,
      Math.ceil((diagram.max - diagram.min) / 10)
    );
    // A plotted integer replaces its tick label instead of printing it twice.
    // Pack all numeric labels together so points cannot overlap nearby ticks.
    const values = [
      ...geometry.points.map((point) => label(point.value, point.position)),
      ...geometry.ticks
        .filter(
          (tick) =>
            tick.major &&
            (tick.value === 0 || tick.value % integerStride === 0) &&
            !geometry.points.some(
              (point) => Math.abs(point.position - tick.position) < 1e-8
            )
        )
        .map((tick) => label(String(tick.value), tick.position)),
    ].sort((a, b) => a.position - b.position);
    const names = geometry.points
      .filter((point) => point.name)
      .map((point) => label(point.name!, point.position, true));
    // Keep every label centered on its point, even for long custom labels at
    // the endpoints: inset the whole axis, rather than shifting just the text.
    const inset = Math.max(
      24,
      ...[...values, ...names].map((item) => item.width / 2 + 4)
    );
    const left = M + inset,
      right = W - M - inset;
    const x = (position: number) => left + position * (right - left);
    const packLabels = (labels: ReturnType<typeof label>[]) => {
      const laneEnds: number[] = [];
      const fractions: boolean[] = [];
      const placed = labels.map((item) => {
        const labelLeft = x(item.position) - item.width / 2;
        let lane = laneEnds.findIndex((end) => end + 10 <= labelLeft);
        if (lane < 0) lane = laneEnds.length;
        laneEnds[lane] = labelLeft + item.width;
        fractions[lane] ||= item.items.some(containsFraction);
        return { ...item, x: x(item.position), labelLeft, lane };
      });
      return { labels: placed, count: laneEnds.length, fractions };
    };
    const valueRows = packLabels(values),
      nameRows = packLabels(names);
    const axisTop = 12 + nameRows.count * 24;
    const captionTop = axisTop + 12 + valueRows.count * 32 + 8;
    const caption = diagram.caption ? layout(diagram.caption, 9.5) : [];
    return {
      left,
      right,
      points: geometry.points.map((point) => ({
        ...point,
        x: x(point.position),
      })),
      valueRows,
      nameRows,
      axisTop,
      captionTop,
      caption,
      ticks: geometry.ticks.map((tick) => ({ ...tick, x: x(tick.position) })),
      height:
        captionTop + caption.reduce((sum, row) => sum + row.height, 0) + 8,
    };
  }
  function drawSolutionNumberLine(
    figure: ReturnType<typeof solutionNumberLineLayout>
  ) {
    if (y + figure.height > BOTTOM) newPage();
    const top = y,
      axisY = top + figure.axisTop;
    const ink = '0.09 0.14 0.24',
      accent = '0.08 0.25 0.60';
    const segment = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      color = ink,
      width = 0.8
    ) =>
      page.push(
        `q ${color} RG ${num(width)} w ${num(x1)} ${num(H - y1)} m ${num(x2)} ${num(H - y2)} l S Q`
      );
    const circle = (
      x: number,
      radius: number,
      filled: boolean,
      color: string
    ) => {
      const cy = H - axisY,
        k = radius * 0.5522847498;
      page.push(
        `q ${color} RG ${color} rg 0.9 w ` +
          `${num(x + radius)} ${num(cy)} m ` +
          `${num(x + radius)} ${num(cy + k)} ${num(x + k)} ${num(cy + radius)} ${num(x)} ${num(cy + radius)} c ` +
          `${num(x - k)} ${num(cy + radius)} ${num(x - radius)} ${num(cy + k)} ${num(x - radius)} ${num(cy)} c ` +
          `${num(x - radius)} ${num(cy - k)} ${num(x - k)} ${num(cy - radius)} ${num(x)} ${num(cy - radius)} c ` +
          `${num(x + k)} ${num(cy - radius)} ${num(x + radius)} ${num(cy - k)} ${num(x + radius)} ${num(cy)} c ${filled ? 'f' : 'S'} Q`
      );
    };
    // The arrow points in the increasing direction; equal numeric intervals
    // always occupy equal widths, including across zero.
    segment(figure.left - 16, axisY, figure.right + 16, axisY);
    segment(figure.right + 10, axisY - 3, figure.right + 16, axisY);
    segment(figure.right + 10, axisY + 3, figure.right + 16, axisY);
    draw('x', figure.right + 16, axisY + 9, 9);
    for (const tick of figure.ticks) {
      const halfHeight = tick.major ? 5 : 3;
      segment(
        tick.x,
        axisY - halfHeight,
        tick.x,
        axisY + halfHeight,
        ink,
        tick.major ? 0.9 : 0.55
      );
    }
    const labels = [
      ...figure.nameRows.labels.map((item) => ({
        ...item,
        top: axisY - 28 - item.lane * 24,
        fraction: false,
        above: true,
      })),
      ...figure.valueRows.labels.map((item) => ({
        ...item,
        top: axisY + 12 + item.lane * 32,
        fraction: figure.valueRows.fractions[item.lane],
        above: false,
      })),
    ];
    // Draw guides first, then label backgrounds: a guide to a staggered label
    // must never cross the digits of another label closer to the axis.
    for (const item of labels)
      if (item.lane > 0)
        segment(
          item.x,
          axisY + (item.above ? -7 : 7),
          item.x,
          item.top + (item.above ? 14 : -3),
          '0.55 0.60 0.68',
          0.45
        );
    for (const item of labels) {
      const height = item.fraction ? 27 : 16;
      page.push(
        `q 1 1 1 rg ${num(item.labelLeft - 2)} ${num(H - item.top - height)} ${num(item.width + 4)} ${num(height + 1)} re f Q`
      );
      y = item.top;
      drawRow(item.items, item.labelLeft, 10, item.fraction);
    }
    for (const point of figure.points) {
      circle(point.x, 2.8, true, point.emphasis ? accent : ink);
      if (point.emphasis) circle(point.x, 4.7, false, accent);
    }
    y = top + figure.captionTop;
    for (const row of figure.caption) {
      drawRow(row.items, M, 9.5);
      y += row.height;
    }
    y = top + figure.height;
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
    `Lớp ${lesson.grade}${lesson.semester ? ` · Học kỳ ${lesson.semester}` : ''} · ${lesson.topic} · ${exercises.length} bài tập`,
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
    const items = labels.map((label) => tokens(label, lesson.grade));
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
          cell[index]?.items.some(containsFraction)
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
  function drawExerciseTable(rows: string[][]) {
    const height = 28,
      labelWidth = 110;
    const cellWidth = (W - 2 * M - labelWidth) / (rows[0].length - 1);
    rows.forEach((row) => {
      let x = M;
      row.forEach((cell, j) => {
        const width = j === 0 ? labelWidth : cellWidth;
        page.push(
          `0.65 0.70 0.79 RG 0.6 w ${num(x)} ${num(H - y - height)} ${num(width)} ${height} re S`
        );
        draw(
          cell,
          j === 0 ? x + 8 : x + (width - measure(cell, 11)) / 2,
          y + 7,
          11
        );
        x += width;
      });
      y += height;
    });
    y += 10;
  }
  function drawSegment(
    values: number[],
    labels: [string, string, string] = ['A', 'M', 'B']
  ) {
    const g = segmentGeometry(values),
      scale = (W - 2 * M) / 480;
    const [start, middle, end] = labels;
    const px = (x: number) => M + x * scale;
    const py = (top: number) => y + top * 0.75;
    const edge = (x1: number, y1: number, x2: number, y2: number) =>
      page.push(
        `0.14 0.21 0.33 RG 1 w ${num(px(x1))} ${num(H - py(y1))} m ${num(px(x2))} ${num(H - py(y2))} l S`
      );
    edge(30, 70, 450, 70);
    if (g.lift) {
      page.push('q [4 3] 0 d');
      edge(30, 70, g.middle, g.y);
      edge(g.middle, g.y, 450, 70);
      page.push('Q');
    }
    for (const [x, top, label] of [
      [30, 70, start],
      [g.middle, g.y, middle],
      [450, 70, end],
    ] as const) {
      page.push(
        `0.14 0.21 0.33 rg ${num(px(x) - 2)} ${num(H - py(top) - 2)} 4 4 re f`
      );
      draw(label, px(x) - 4, py(top) + 6, 11);
    }
    if (g.show) {
      draw(`${g.left} cm`, px((30 + g.middle) / 2) - 12, py(45), 10);
      draw(`${g.right} cm`, px((450 + g.middle) / 2) - 12, py(45), 10);
    }
    y += 90;
  }
  function writingHeight(e: MathExercise, width = W - 2 * M) {
    if (e.kind === 'choice' || e.table) return 0;
    const workbookRows = printableWordProblemRows(e);
    const working = e.solutionStyle === 'answer-only' ? e.answer : workbookRows
      ? workbookRows.filter(row => row.role !== 'heading').map(row => row.text).join('\n')
      : calculationContinuation(e.prompt, e.solution);
    const measurable = Array.from(working.normalize('NFC'), char =>
      /\s/u.test(char) || font.glyph(char.codePointAt(0)!) ? char : '?'
    ).join('');
    const height = layout(measurable, 11, width).reduce((sum, row) => sum + row.height, 0);
    return Math.max(1, Math.ceil(height / 18), e.solutionNumberLine ? 5 : 0) * 18;
  }
  function dottedRows(left: number, width: number, height: number) {
    for (let space = 0; space < height; space += 18) {
      if (y + 18 > BOTTOM) newPage();
      page.push(`q 0.65 0.70 0.79 RG 0.7 w 1 J [0 3] 0 d ${num(left)} ${num(H - y - 16)} m ${num(left + width)} ${num(H - y - 16)} l S Q`);
      y += 18;
    }
  }
  const labels = exerciseLabels(exercises);
  const columnGap = 22;
  function compactCell(e: MathExercise, index: number, columns: number) {
    // Keep complex structures in their established full-width renderer.
    if (e.kind === 'choice' || e.kind === 'written' || e.table || e.segment ||
        e.solutionNumberLine || printableWordProblemRows(e)) return null;
    const width = (W - 2 * M - columnGap * (columns - 1)) / columns;
    const promptRows = layout(labels[index].prompt, 11, width);
    const rawSolution = printableShortSolution(e);
    const solution = mode === 'worksheet' ? Array.from(rawSolution.normalize('NFC'), char =>
      /\s/u.test(char) || font.glyph(char.codePointAt(0)!) ? char : '?'
    ).join('') : rawSolution;
    const methodIndex = solution.indexOf('\nCách làm: ');
    const methodLine = methodIndex < 0 ? -1 : solution.slice(0, methodIndex).split('\n').length;
    const solutionRows = solution ? solution.split('\n').flatMap((text, index) => {
      const inset = methodLine < 0 && isCalculationOnlySolution(solution)
        ? (/^=\s/u.test(text) ? 0 : measure('= ', 11))
        : methodLine >= 0 && index > methodLine
        ? measure('Cách làm: ', 11) - (/^=\s/u.test(text) ? measure('= ', 11) : 0) : 0;
      return layout(text, 11, width - inset).map(row => ({ ...row, inset }));
    }) : [];
    // Reject unbreakable expressions and excessively wrapped question text.
    const fits = [...promptRows.map(row => ({ ...row, inset: 0 })), ...solutionRows].every(row =>
      row.inset + row.items.reduce((sum, token) => sum + tokenWidth(token, 11), 0) <= width + 0.01);
    if (!fits || promptRows.length > (columns === 3 ? 2 : 3)) return null;
    // Students need the same room to work as the printed solution requires.
    const solutionHeight = [...promptRows, ...solutionRows].reduce((sum, row) => sum + row.height, 0) + 24;
    const pageCapacity = BOTTOM - (mode === 'worksheet' ? 112 : 84);
    if (solutionHeight > (columns === 3 ? 130 : pageCapacity)) return null;
    const answerRows = mode === 'solutions' ? solutionRows : [];
    const work = mode === 'worksheet' ? writingHeight(e, width) : 0;
    const height = [...promptRows, ...answerRows].reduce((sum, row) => sum + row.height, 0) + work + 24;
    if (height > (columns === 3 ? 130 : pageCapacity)) return null;
    return { width, promptRows, answerRows, work, height };
  }
  const compactConsumed = new Set<number>();
  exercises.forEach((e, i) => {
    if (compactConsumed.has(i)) return;
    const taskHeading = labels[i].title && labels[i].first
      ? `Bài ${labels[i].number}. ${labels[i].title}` : null;
    const taskHeadingHeight = taskHeading
      ? layout(taskHeading, 12).reduce((sum, row) => sum + row.height, 12) : 0;
    for (const columns of [3, 2]) {
      if (i + columns > exercises.length) continue;
      if (exercises.slice(i, i + columns).some((item, offset) => item.task !== e.task || (e.task && labels[i + offset].number !== labels[i].number))) continue;
      const cells = exercises.slice(i, i + columns).map((item, offset) => compactCell(item, i + offset, columns));
      if (cells.some(cell => !cell)) continue;
      const promptHeight = Math.max(...cells.map(cell => cell!.promptRows.reduce((sum, row) => sum + row.height, 0)));
      const sharedWork = Math.max(...cells.map(cell => cell!.work));
      const rowHeight = mode === 'worksheet'
        ? promptHeight + sharedWork + 24
        : Math.max(...cells.map(cell => cell!.height));
      if (rowHeight + taskHeadingHeight > BOTTOM - (mode === 'worksheet' ? 112 : 84)) continue;
      if (y + rowHeight + taskHeadingHeight > BOTTOM) newPage();
      if (taskHeading) paragraph(taskHeading, 12, 12, true);
      const top = y;
      cells.forEach((cell, column) => {
        const { width, promptRows, answerRows } = cell!;
        const left = M + column * (width + columnGap);
        y = top;
        // Mark each independent reading block for extraction and QA.
        page.push('/Exercise BMC');
        for (const row of promptRows) {
          drawRow(row.items, left, 11);
          y += row.height;
        }
        y += 8;
        for (const row of answerRows) {
          drawRow(row.items, left + row.inset, 11);
          y += row.height;
        }
        if (mode === 'worksheet') {
          y = top + promptHeight + 8;
          dottedRows(left, width, sharedWork);
        }
        page.push('EMC');
        compactConsumed.add(i + column);
      });
      y = top + rowHeight;
      return;
    }
    const prompt = labels[i].prompt;
    const options = e.kind === 'choice' ? choiceRows(e.options) : [];
    const wordRows = mode === 'solutions' ? printableWordProblemRows(e) : null;
    const plainSolution =
      !wordRows && mode === 'solutions' ? printableShortSolution(e) : null;
    const plainSolutionRows = (() => {
      if (plainSolution && isCalculationOnlySolution(plainSolution))
        return plainSolution.split('\n').map(text => ({ text, left: M + (/^=\s/u.test(text) ? 0 : measure('= ', 11)) }));
      if (!plainSolution || !plainSolution.includes('\nCách làm: '))
        return null;
      const [heading, method] = plainSolution.split('\nCách làm: ', 2);
      const [first, ...continuations] = method.split('\n');
      const calculationLeft = M + measure('Cách làm: ', 11);
      const continuationLeft = calculationLeft - measure('= ', 11);
      return [
        { text: heading, left: M },
        { text: `Cách làm: ${first}`, left: M },
        ...continuations.map((text) => ({ text, left: /^=\s/u.test(text) ? continuationLeft : calculationLeft })),
      ];
    })();
    const plainSolutionLines = plainSolutionRows
      ? plainSolutionRows.flatMap((row) =>
          layout(row.text, 11, W - M - row.left)
        )
      : plainSolution
        ? layout(plainSolution, 11)
        : [];
    const solutionFigure =
      mode === 'solutions' && e.solutionNumberLine
        ? solutionNumberLineLayout(e.solutionNumberLine)
        : null;
    // Every calculation line is centered, so its halfway point is W / 2,
    // including wrapped lines and stacked fractions. The answer starts below it.
    const calculationMidpoint = W / 2;
    const solutionRows: LaidOutWordProblemRow[] | null = wordRows
      ? wordRows.map((row) => {
          let left = M;
          if (row.role === 'answer') {
            const width = Math.min(
              W - 2 * M,
              tokens(row.text, lesson.grade).reduce(
                (sum, item) => sum + tokenWidth(item, 11),
                0
              )
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
        })
      : null;
    // Measure the student's working, not the answer-key labels or repeated answer.
    // Fraction rows and wrapped prose need more vertical room than plain text.
    const work = mode === 'worksheet' ? writingHeight(e) : 0;
    const headHeight =
      layout(prompt, 11).reduce((n, l) => n + l.height, 0) +
      (options.length ? options.reduce((n, row) => n + row.height, 0) + 7 : 0) +
      32;
    const solutionHeight =
      solutionRows?.reduce((n, row) => n + row.height, 0) ??
      plainSolutionLines.reduce((n, row) => n + row.height, 0);
    const blockHeight =
      headHeight +
      solutionHeight +
      work +
      (solutionFigure?.height || 0) +
      (e.table ? 94 : 0) +
      (e.segment ? 90 : 0);
    // Keep a question and its solution together. An oversized authored solution
    // must flow across pages instead of leaving the first page empty.
    const reservedHeight =
      blockHeight > BOTTOM - 84
        ? headHeight +
          (solutionRows
            ? solutionRows[0].height + solutionRows[1].height
            : mode === 'worksheet' ? 18 : plainSolutionLines[0]?.height || 0)
        : blockHeight;
    if (y + reservedHeight + taskHeadingHeight > BOTTOM && y > 100) newPage();
    if (taskHeading) paragraph(taskHeading, 12, 12, true);
    paragraph(prompt, 11, 8, true);
    if (e.segment) drawSegment(e.segment, e.segmentLabels);
    if (e.table)
      drawExerciseTable(mode === 'solutions' ? e.table.solution : e.table.rows);
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
      } else if (plainSolutionRows) {
        for (const row of plainSolutionRows)
          paragraph(row.text, 11, 0, false, 'left', row.left);
        y += 8;
      } else if (plainSolution) paragraph(plainSolution, 11, 8);
      if (solutionFigure) drawSolutionNumberLine(solutionFigure);
      y += 8;
    } else {
      dottedRows(M, W - 2 * M, work);
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
  const prefix = `LIMA - Lớp ${lesson.grade} - `;
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
