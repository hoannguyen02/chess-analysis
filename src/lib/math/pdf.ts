import { LIMA_LOGO_PDF } from '../brand/logo';
import { wholeNumberFraction } from './format';
import {
  EXTRA_GROUPS,
  MathLessonData,
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
  text = text.normalize('NFC');
  const out: Token[] = [],
    re = /(\([^()]+\)|-?\d+|□)\s*\/\s*(\([^()]+\)|-?\d+|□)/g;
  let last = 0;
  const words = (s: string) =>
    s
      .split(/(\n|[ \t]+)/)
      .filter(Boolean)
      .forEach((text) => out.push({ text }));
  for (const match of text.normalize('NFC').matchAll(re)) {
    words(text.slice(last, match.index));
    const clean = (v: string) => (v.startsWith('(') ? v.slice(1, -1) : v);
    const n = clean(match[1]),
      d = clean(match[2]);
    const whole = wholeNumberFraction(n, d);
    out.push(whole === null ? { n, d } : { text: whole });
    last = match.index! + match[0].length;
  }
  words(text.slice(last));
  return out;
}
export function createPracticePdf(
  input: MathLessonData,
  mode: 'worksheet' | 'solutions',
  fontBytes: Uint8Array
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
  const tokenWidth = (t: Token, size: number) =>
    'text' in t
      ? measure(t.text, size)
      : Math.max(measure(t.n, size * 0.88), measure(t.d, size * 0.88)) + 10;
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

  function paragraph(text: string, size = 11, gap = 7, keep = false) {
    const lines = layout(text, size),
      height = lines.reduce((sum, l) => sum + l.height, 0);
    if (keep && height <= BOTTOM - 133 && y + height > BOTTOM) newPage();
    for (const row of lines) {
      if (y + row.height > BOTTOM) newPage();
      let x = M;
      const frac = row.items.some((t) => !('text' in t));
      for (const t of row.items) {
        const width = tokenWidth(t, size);
        if ('text' in t) draw(t.text, x, y + (frac ? size * 0.48 : 0), size);
        else {
          const fs = size * 0.88;
          draw(t.n, x + (width - measure(t.n, fs)) / 2, y, fs);
          line(x + 2, y + size * 1.18, x + width - 2, '0.09 0.14 0.24');
          draw(t.d, x + (width - measure(t.d, fs)) / 2, y + size * 1.38, fs);
        }
        x += width;
      }
      y += row.height;
    }
    y += gap;
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
    paragraph(
      'Làm bài theo thứ tự hoặc chọn câu cần ôn. Trình bày các bước giải; chú ý đơn vị và yêu cầu tối giản.',
      10,
      14
    );
  } else
    paragraph(
      'Dùng sau khi tự làm bài. Bài tự luận có lời giải mẫu và tiêu chí để tự đối chiếu.',
      10,
      14
    );
  let group = '';
  exercises.forEach((e, i) => {
    const groupLabel = EXTRA_GROUPS[e.group || 'skills'];
    const prompt = `Bài ${i + 1}. ${e.prompt}`;
    const options =
      e.kind === 'choice'
        ? e.options
            .map((o, index) => `${String.fromCharCode(65 + index)}. ${o}`)
            .join('\n')
        : '';
    const instruction = e.simplified ? 'Yêu cầu: viết phân số tối giản.' : '';
    const work =
      mode === 'worksheet'
        ? { small: 36, medium: 72, large: 108 }[e.workspace || 'medium']
        : 0;
    const headHeight =
      layout(prompt, 11).reduce((n, l) => n + l.height, 0) +
      (options
        ? layout(options, 11).reduce((n, l) => n + l.height, 0) + 7
        : 0) +
      (instruction ? 24 : 0) +
      32;
    const groupHeight = groupLabel !== group ? 35 : 0;
    if (y + headHeight + work + groupHeight > BOTTOM && y > 100) newPage();
    if (groupLabel !== group) {
      paragraph(groupLabel.toLocaleUpperCase('vi'), 11, 9, true);
      group = groupLabel;
    }
    paragraph(prompt, 11, 8, true);
    if (options) paragraph(options, 11, 6, true);
    if (instruction) paragraph(instruction, 10, 7, true);
    if (mode === 'solutions') {
      paragraph(
        e.kind === 'written'
          ? `Lời giải mẫu: ${e.solution}`
          : `Lời giải: ${e.solution}`,
        11,
        8
      );
      if (e.kind === 'written')
        for (const criterion of e.criteria || [])
          paragraph(`- ${criterion}`, 10, 4);
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
    draw('A learning resource by LIMA Chess', M, 813, 8);
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
export async function downloadPracticePdf(
  lesson: MathLessonData,
  mode: 'worksheet' | 'solutions'
) {
  const response = await fetch('/fonts/DejaVuSans.ttf');
  if (!response.ok) throw new Error('Không tải được phông chữ. Hãy thử lại.');
  const bytes = createPracticePdf(
    lesson,
    mode,
    new Uint8Array(await response.arrayBuffer())
  );
  const url = URL.createObjectURL(
    new Blob([bytes as BlobPart], { type: 'application/pdf' })
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = `toan-lop-${lesson.grade}-${mode === 'worksheet' ? 'bai-tap' : 'loi-giai'}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
