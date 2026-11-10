import fontkit from '@pdf-lib/fontkit';
import { Chess } from 'chess.js';
import {
  PDFDocument,
  concatTransformationMatrix,
  degrees,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib';
import {
  bookFooterName,
  defaultBookOptions,
  defaultWorksheetFooter,
  explainLine,
  previousMoveLabel,
  worksheetClosingReview,
  worksheetFooterText,
  worksheetLevelGuide,
  worksheetLevels,
  worksheetSolutionText,
  worksheetSourceLines,
  type WorksheetBookOptions,
  type WorksheetFooter,
  type WorksheetPage,
} from './worksheet';
import { notationExampleText, notationGuideRows } from './worksheet-notation';
import { practiceGoalLabels } from './practice-goals';
const levelLabel = (level: WorksheetPage['level']) =>
  level === 'Beginner'
    ? 'Cấp độ Nhập môn / Beginner'
    : `Cấp độ ${level} / Level ${level}`;
const coverGreen = rgb(24 / 255, 56 / 255, 47 / 255);
const coverGold = rgb(246 / 255, 167 / 255, 31 / 255);
const W = 595.28,
  H = 841.89;
const bookFooterY = 20;
const bookFooterFontSize = 9;
async function asset(path: string) {
  const res = await fetch(path);
  if (!res.ok)
    throw new Error('Không tải được phông hoặc quân cờ. Vui lòng thử lại.');
  return res.arrayBuffer();
}
function lines(text: string, font: PDFFont, size: number, width: number) {
  const out: string[] = [];
  let line = '';
  for (const word of text.normalize('NFC').split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(next, size) > width) {
      out.push(line);
      line = '';
    }
    if (line) line += ' ';
    for (const character of word) {
      if (line && font.widthOfTextAtSize(line + character, size) > width) {
        out.push(line);
        line = '';
      }
      line += character;
    }
  }
  if (line) out.push(line);
  return out;
}
export async function createWorksheetPdfs(
  pages: WorksheetPage[],
  title: string,
  footer: WorksheetFooter = defaultWorksheetFooter,
  watermark = '',
  book?: WorksheetBookOptions
) {
  const fontBytes = await asset('/fonts/DejaVuSans.ttf');
  const boldBytes = await asset('/fonts/DejaVuSans-Bold.ttf');
  const artworkNotice = await asset('/chess-print/NOTICE.txt');
  // Preserve the existing brand symbol’s vector geometry and original colors.
  const logo: {
    shapes: {
      matrix: [number, number, number, number, number, number];
      path: string;
      color: [number, number, number];
    }[];
  } | null = book
    ? JSON.parse(
        new TextDecoder().decode(await asset('/chess-print/lima-logo.json'))
      )
    : null;
  const symbols = [
    'wP',
    'wN',
    'wB',
    'wR',
    'wQ',
    'wK',
    'bP',
    'bN',
    'bB',
    'bR',
    'bQ',
    'bK',
  ];
  const images = await Promise.all(
    symbols.map((s) => asset(`/chess-print/${s}.png`))
  );
  const sheet = await PDFDocument.create(),
    answers = await PDFDocument.create();
  sheet.registerFontkit(fontkit);
  answers.registerFontkit(fontkit);
  const font = await sheet.embedFont(fontBytes, { subset: true }),
    answerFont = await answers.embedFont(fontBytes, { subset: true });
  const boldFont = await sheet.embedFont(boldBytes, { subset: true });
  const answerBoldFont = book
    ? await answers.embedFont(boldBytes, { subset: true })
    : answerFont;
  const pieces = await Promise.all(images.map((data) => sheet.embedPng(data)));
  const draw = (
    page: PDFPage,
    s: string,
    x: number,
    y: number,
    size = 9,
    f = font,
    color = rgb(0.08, 0.08, 0.08)
  ) =>
    page.drawText(s.normalize('NFC'), {
      x,
      y,
      size,
      font: f,
      color,
    });
  const watermarkText = watermark.trim().replace(/\s+/g, ' ').normalize('NFC');
  const drawWatermark = (page: PDFPage, pageFont: PDFFont) => {
    if (!watermarkText) return;
    // Keep branding outside the content area (x=30..W-30). A printer may
    // darken gray, but it cannot then obscure pieces, squares, or answers.
    const size = Math.min(
      12,
      500 / pageFont.widthOfTextAtSize(watermarkText, 1)
    );
    const width = pageFont.widthOfTextAtSize(watermarkText, size);
    page.drawText(watermarkText, {
      x: W - 16,
      y: (H - width) / 2,
      size,
      font: pageFont,
      color: rgb(0.75, 0.75, 0.75),
      rotate: degrees(90),
    });
  };
  const drawLogo = (
    page: PDFPage,
    center: number,
    top: number,
    width: number
  ) => {
    if (!logo) return;
    const scale = width / 500;
    for (const shape of logo.shapes) {
      const [a, b, c, d, e, f] = shape.matrix;
      page.pushOperators(
        pushGraphicsState(),
        concatTransformationMatrix(
          scale * a,
          -scale * b,
          -scale * c,
          scale * d,
          center - width / 2 + scale * e,
          top + scale * (40 - f)
        )
      );
      page.drawSvgPath(shape.path, {
        color: rgb(
          ...(shape.color.map((c) => c / 255) as [number, number, number])
        ),
      });
      page.pushOperators(popGraphicsState());
    }
  };
  const drawBrandHeader = (
    page: PDFPage,
    pageFont: PDFFont,
    center: number,
    scale = 1
  ) => {
    const gold = rgb(0.72, 0.46, 0.06);
    const centered = (
      text: string,
      y: number,
      size: number,
      color = rgb(0.08, 0.08, 0.08)
    ) =>
      draw(
        page,
        text,
        center - pageFont.widthOfTextAtSize(text, size) / 2,
        y,
        size,
        pageFont,
        color
      );
    drawLogo(page, center, H - 28 * scale, 62 * scale);
    centered('TRUNG TÂM CỜ VUA', H - 111 * scale, 11 * scale);
    centered('LIMA Chess', H - 148 * scale, 32 * scale, gold);
    for (const direction of [-1, 1])
      page.drawLine({
        start: { x: center + direction * 10 * scale, y: H - 163 * scale },
        end: { x: center + direction * 190 * scale, y: H - 163 * scale },
        thickness: 0.7,
        color: rgb(0, 0, 0),
      });
    page.drawSvgPath('M 0 -4 L 4 0 L 0 4 L -4 0 Z', {
      x: center,
      y: H - 163 * scale,
      scale,
      color: gold,
    });
    centered(
      'TƯ DUY · TẬP TRUNG · KỶ LUẬT · BẢN LĨNH',
      H - 183 * scale,
      Math.max(8.5, 9 * scale)
    );
  };
  const heading = title.trim() || 'BÀI TẬP CỜ VUA';
  const included = new Set(
    pages.flatMap((p) => p.exercises.map((e) => e.level ?? p.level))
  );
  const includedLevels = worksheetLevels.filter((level) => included.has(level));
  type ContentsEntry = {
    title: string;
    detail?: string;
    firstNumber?: number;
    target?: PDFPage;
  };
  // Build chapter runs before pagination, then bind them to the actual pages.
  // Solutions can span pages independently of the exercise book.
  const chapterEntries: ContentsEntry[] = [];
  const entryByGroup: number[] = [];
  let previousChapter = '';
  pages.forEach((group) => {
    const key = JSON.stringify([
      !!group.review,
      group.sectionId,
      group.title,
      group.review ? undefined : group.level,
    ]);
    if (key !== previousChapter) chapterEntries.push({ title: group.title });
    previousChapter = key;
    const index = chapterEntries.length - 1;
    entryByGroup.push(index);
    const first = group.exercises[0]?.number;
    const last = group.exercises.at(-1)?.number;
    const entry = chapterEntries[index];
    // Keep the range on continuation pages, rather than listing every page.
    entry.firstNumber ??= first;
    const start = entry.firstNumber;
    entry.detail = [
      !group.review && includedLevels.length > 1 ? levelLabel(group.level) : '',
      first === undefined
        ? ''
        : `Bài ${start}${String(start) === String(last) ? '' : `-${last}`}`,
    ]
      .filter(Boolean)
      .join(' · ');
  });
  const answerEntries: ContentsEntry[] = chapterEntries.map(
    ({ title, detail }) => ({ title, detail })
  );
  const introductionTitle = book?.introduction.title.trim() || 'Mở đầu';
  const introductionEntry: ContentsEntry = { title: introductionTitle };
  if (book?.showLevelGuide) {
    introductionEntry.title =
      introductionTitle === defaultBookOptions.introduction.title
        ? 'Hệ thống cấp độ và hướng dẫn luyện tập'
        : `Hệ thống cấp độ · ${introductionTitle}`;
  }
  const notationEntry: ContentsEntry = { title: 'Hướng dẫn ký hiệu cờ vua' };
  const closingEntry: ContentsEntry = {
    title: book?.closing.title.trim() || 'Tổng kết',
  };
  const reserveContents = (
    doc: PDFDocument,
    pageFont: PDFFont,
    entries: ContentsEntry[],
    isAnswer = false
  ) => {
    if (!book || book.showContents === false) return () => {};
    const rows: {
      page: PDFPage;
      entry: ContentsEntry;
      y: number;
      height: number;
      titleLines: string[];
      detailLines: string[];
    }[] = [];
    let page: PDFPage;
    let cursor = 0;
    const start = () => {
      page = doc.addPage([W, H]);
      drawWatermark(page, pageFont);
      draw(
        page,
        isAnswer ? 'MỤC LỤC LỜI GIẢI' : 'MỤC LỤC',
        30,
        H - 48,
        20,
        pageFont,
        coverGreen
      );
      draw(
        page,
        heading,
        30,
        H - 70,
        Math.min(9, (W - 90) / pageFont.widthOfTextAtSize(heading, 1)),
        pageFont
      );
      draw(page, 'NỘI DUNG', 30, H - 99, 8, pageFont);
      draw(page, 'TRANG', W - 73, H - 99, 8, pageFont);
      cursor = H - 126;
    };
    start();
    for (const entry of entries) {
      const titleLines = lines(entry.title, pageFont, 10, W - 125);
      const detailLines = entry.detail
        ? lines(entry.detail, pageFont, 8.5, W - 125)
        : [];
      const height = titleLines.length * 14 + detailLines.length * 12 + 20;
      if (cursor - height < 48) start();
      rows.push({
        page: page!,
        entry,
        y: cursor,
        height,
        titleLines,
        detailLines,
      });
      cursor -= height;
    }
    return () => {
      const allPages = doc.getPages();
      for (const row of rows) {
        if (!row.entry.target)
          throw new Error('Không xác định được trang trong mục lục.');
        let y = row.y;
        for (const line of row.titleLines) {
          draw(row.page, line, 30, y, 10, pageFont);
          y -= 14;
        }
        for (const line of row.detailLines) {
          draw(row.page, line, 30, y, 8.5, pageFont);
          y -= 12;
        }
        const target = String(allPages.indexOf(row.entry.target) + 1);
        draw(
          row.page,
          target,
          W - 45 - pageFont.widthOfTextAtSize(target, 10),
          row.y,
          10,
          pageFont
        );
        const bottom = row.y - row.height + 18;
        row.page.drawLine({
          start: { x: 30, y: bottom },
          end: { x: W - 45, y: bottom },
          thickness: 0.4,
          color: rgb(0.8, 0.8, 0.8),
        });
        // translateContent does not move annotations. Match the final binding offset.
        const offset = allPages.indexOf(row.page) % 2 === 0 ? 10 : -10;
        row.page.node.addAnnot(
          doc.context.register(
            doc.context.obj({
              Type: 'Annot',
              Subtype: 'Link',
              Rect: [30 + offset, bottom, W - 45 + offset, row.y + 13],
              Border: [0, 0, 0],
              Dest: [row.entry.target.ref, 'Fit'],
            })
          )
        );
      }
    };
  };
  let finishWorksheetContents = () => {};
  let finishAnswerContents = () => {};
  const notationReferences: { page: PDFPage; top: number }[] = [];
  const contactPhone = footer.phone
    .trim()
    .replace(/^(0\d{3})(\d{3})(\d{3})$/, '$1 $2 $3');
  const drawDocumentInfo = (
    doc: PDFDocument,
    pageFont: PDFFont,
    position?: { page: PDFPage; cursor: number }
  ) => {
    if (!book) return;
    const info = book.compilation;
    const version = info?.version?.trim();
    const date = info?.date?.split('-').reverse().join('/');
    const details = [version && `Phiên bản ${version}`, date]
      .filter(Boolean)
      .join(' · ');
    const copy = [
      'Biên soạn · Trung tâm Cờ vua LIMA Chess',
      details,
      info?.internalOnly ? 'Lưu hành nội bộ' : '',
    ]
      .filter(Boolean)
      .flatMap((line) => lines(line, pageFont, 10, W - 80));
    const labelFont = doc === sheet ? boldFont : answerBoldFont;
    const address = footer.address.trim();
    const contactHeading = contactPhone || address ? 'Liên hệ' : '';
    const addressLines = lines(address, pageFont, 10, W - 80);
    const contactGap = contactHeading ? 8 : 0;
    const bodyLineCount =
      copy.length + Number(!!contactHeading) + addressLines.length;
    let page = position?.page;
    let top = (position?.cursor ?? 0) - 12;
    if (!page || top - 36 - (bodyLineCount - 1) * 14 - contactGap < 56) {
      page = doc.addPage([W, H]);
      drawWatermark(page, pageFont);
      top = H - 48;
    }
    page.drawLine({
      start: { x: 30, y: top },
      end: { x: W - 50, y: top },
      thickness: 0.5,
      color: rgb(0.6, 0.6, 0.6),
    });
    draw(page, 'Thông tin tài liệu', 30, top - 18, 11, labelFont);
    copy.forEach((line, i) =>
      draw(page, line, 30, top - 36 - i * 14, 10, pageFont)
    );
    if (contactHeading) {
      const y = top - 36 - copy.length * 14 - contactGap;
      draw(page, contactHeading, 30, y, 10, labelFont);
      if (contactPhone) {
        const x = 30 + labelFont.widthOfTextAtSize(contactHeading, 10);
        draw(page, ` · ${contactPhone}`, x, y, 10, pageFont);
      }
      addressLines.forEach((line, i) =>
        draw(page, line, 30, y - (i + 1) * 14, 10, pageFont)
      );
    }
  };
  const textSection = (
    doc: PDFDocument,
    pageFont: PDFFont,
    section: { title: string; body: string },
    colorOpening = false,
    guide?: 'introduction' | 'closing'
  ) => {
    if (!section.body.trim()) return;
    let page: PDFPage;
    let cursor = 0;
    let firstPage = true;
    const openingWithLevels = guide === 'introduction' && book?.showLevelGuide;
    let sectionHeading = openingWithLevels
      ? 'Hệ thống cấp độ'
      : section.title || heading;
    const drawSectionHeading = () => {
      for (const line of lines(sectionHeading, pageFont, 17, W - 80)) {
        draw(
          page!,
          line,
          30,
          cursor,
          17,
          pageFont,
          colorOpening ? coverGreen : undefined
        );
        cursor -= 24;
      }
      if (colorOpening)
        page!.drawLine({
          start: { x: 30, y: cursor + 5 },
          end: { x: 90, y: cursor + 5 },
          thickness: 2,
          color: coverGold,
        });
      cursor -= 18;
    };
    const start = () => {
      page = doc.addPage([W, H]);
      drawWatermark(page, pageFont);
      cursor = H - 48;
      if (colorOpening && firstPage) {
        const center = (W - 20) / 2;
        drawBrandHeader(page, pageFont, center, 0.8);
        const centered = (text: string, y: number, size: number) =>
          draw(
            page,
            text,
            center - pageFont.widthOfTextAtSize(text, size) / 2,
            y,
            size,
            pageFont
          );
        cursor = H - 174;
        for (const line of lines(heading, pageFont, 11, W - 80)) {
          centered(line, cursor, 11);
          cursor -= 16;
        }
        cursor -= 12;
      }
      firstPage = false;
      drawSectionHeading();
    };
    start();
    const drawBody = () => {
      for (const paragraph of section.body.replace(/\r/g, '').split('\n')) {
        for (const line of lines(
          paragraph,
          pageFont,
          colorOpening ? 10 : 11,
          W - 80
        )) {
          if (cursor < 56) start();
          draw(page!, line, 30, cursor, colorOpening ? 10 : 11, pageFont);
          cursor -= colorOpening ? 14 : 18;
        }
        cursor -= colorOpening ? 4 : 10;
      }
    };
    if (!openingWithLevels) drawBody();
    if (guide === 'introduction' && book?.showLevelGuide) {
      const ensure = (height: number) => {
        if (cursor - height < 50) start();
      };
      const paragraph = (text: string, size = 10) => {
        for (const line of lines(text, pageFont, size, W - 80)) {
          ensure(16);
          draw(page!, line, 30, cursor, size, pageFont);
          cursor -= 16;
        }
      };
      ensure(110);
      paragraph(
        `Cấp độ trong tập này: ${worksheetLevels
          .filter((level) => included.has(level))
          .map((level) =>
            level === 'Beginner' ? 'Nhập môn / Beginner' : level
          )
          .join(' · ')}.`,
        9
      );
      cursor -= 8;
      for (const level of worksheetLevels) {
        const description = lines(
          worksheetLevelGuide[level],
          pageFont,
          9,
          W - 240
        );
        const rowLineHeight = 11.5;
        const height = Math.max(27, description.length * rowLineHeight + 9);
        ensure(height);
        page!.drawRectangle({
          x: 30,
          y: cursor - height,
          width: W - 80,
          height,
          borderColor: rgb(0.65, 0.65, 0.65),
          borderWidth: 0.4,
        });
        draw(
          page!,
          level === 'Beginner'
            ? 'Nhập môn / Beginner'
            : `Cấp độ ${level} / Level ${level}`,
          40,
          cursor - 12,
          colorOpening ? 9.5 : 9,
          included.has(level) ? boldFont : pageFont,
          colorOpening ? coverGreen : undefined
        );
        description.forEach((line, i) =>
          draw(
            page!,
            line,
            180,
            cursor - 12 - i * rowLineHeight,
            9,
            pageFont
          )
        );
        cursor -= height;
      }
      cursor -= 17;
      for (const note of [
        'Thí quân: Chủ động chấp nhận thiệt vật chất để đạt mục đích chiến thuật.',
        'Trong bảng cấp độ, chỉ đếm nước đi của mình, không tính nước đi của đối phương.',
        'Ví dụ: Trắng đi - Đen đi - Trắng đi được tính là 2 nước đi của Trắng.',
      ]) {
        for (const line of lines(note, pageFont, 8.5, W - 80)) {
          ensure(12);
          draw(page!, line, 30, cursor, 8.5, pageFont);
          cursor -= 12;
        }
      }
      cursor -= 2;
    }
    if (guide === 'closing' && book?.showLevelGuide) {
      const ensure = (height: number) => {
        if (cursor - height < 56) start();
      };
      const paragraph = (text: string, size = 10) => {
        for (const line of lines(text, pageFont, size, W - 80)) {
          ensure(15);
          draw(page!, line, 30, cursor, size, pageFont);
          cursor -= 15;
        }
      };
      const subheading = (title: string, height: number) => {
        ensure(height);
        draw(page!, title, 30, cursor, 12, boldFont, coverGreen);
        cursor -= 24;
      };
      const checkbox = (label: string, x: number, y: number) => {
        page!.drawRectangle({
          x,
          y: y - 1,
          width: 8,
          height: 8,
          borderWidth: 0.6,
          borderColor: rgb(0, 0, 0),
        });
        draw(page!, label, x + 16, y, 10, pageFont);
      };
      subheading('Đánh dấu những việc đã làm được', 130);
      for (const skill of worksheetClosingReview.skills) {
        checkbox(skill, 30, cursor);
        cursor -= 25;
      }
      cursor -= 12;
      subheading('Bài cần giải lại', 64);
      paragraph('Ghi số bài để tìm lại khi ôn tập.', 9);
      cursor -= 6;
      page!.drawLine({
        start: { x: 30, y: cursor },
        end: { x: W - 50, y: cursor },
        thickness: 0.5,
        color: rgb(0, 0, 0),
      });
      cursor -= 34;
      subheading('Điểm còn bỏ sót', 100);
      worksheetClosingReview.omissions.forEach((label, i) =>
        checkbox(label, 30 + (i % 2) * 260, cursor - Math.floor(i / 2) * 25)
      );
      cursor -= 61;
      subheading('Tiêu chí chọn cấp độ tiếp theo', 112);
      paragraph(worksheetClosingReview.readiness);
      cursor -= 12;
      subheading('Nội dung luyện tiếp', 106);
      for (const label of ['Chủ đề', 'Cấp độ']) {
        draw(page!, label, 30, cursor, 10, pageFont);
        page!.drawLine({
          start: { x: 90, y: cursor - 2 },
          end: { x: W - 50, y: cursor - 2 },
          thickness: 0.5,
          color: rgb(0, 0, 0),
        });
        cursor -= 29;
      }
    }
    if (openingWithLevels) {
      cursor -= 12;
      sectionHeading = section.title || heading;
      const headingHeight =
        lines(sectionHeading, pageFont, 17, W - 80).length * 24 + 18;
      // Keep the instruction heading with its first lines; custom text may continue.
      if (cursor - headingHeight - 32 < 56) start();
      else drawSectionHeading();
      drawBody();
    }
    if (guide === 'introduction' && (book?.showNotationGuide ?? true)) {
      const height = 46;
      if (cursor - height < 56) start();
      page!.drawRectangle({
        x: 30,
        y: cursor - height,
        width: W - 80,
        height,
        borderWidth: 0.5,
        borderColor: rgb(0.6, 0.65, 0.62),
      });
      draw(
        page!,
        'Tra cứu ký hiệu',
        42,
        cursor - 16,
        10,
        boldFont,
        coverGreen
      );
      notationReferences.push({ page: page!, top: cursor });
      cursor -= height + 18;
    }
    return { page: page!, cursor };
  };
  const notationGuide = (doc: PDFDocument, pageFont: PDFFont) => {
    let page: PDFPage;
    let cursor: number;
    const start = () => {
      page = doc.addPage([W, H]);
      drawWatermark(page, pageFont);
      draw(
        page,
        'Hướng dẫn ký hiệu cờ vua',
        30,
        H - 48,
        19,
        pageFont,
        coverGreen
      );
      draw(
        page,
        'Chess notation - Ký hiệu đại số dùng trong bài tập và lời giải',
        30,
        H - 69,
        9.5,
        pageFont
      );
      cursor = H - 94;
    };
    const ensure = (height: number) => {
      if (cursor - height < 56) start();
    };
    const paragraph = (text: string, size = 9.5) => {
      for (const line of lines(text, pageFont, size, W - 80)) {
        ensure(13);
        draw(page!, line, 30, cursor!, size, pageFont);
        cursor! -= 13;
      }
    };
    start();
    paragraph('Cột / Files: a, b, c, d, e, f, g, h. Hàng / Ranks: 1 đến 8.');
    paragraph(
      'Nhìn từ phía Trắng: Cột a ở bên trái, hàng 1 ở gần nhất. Tên ô = cột + hàng, như e4.'
    );
    paragraph('Tên ô giữ nguyên khi xoay bàn cờ.');
    cursor! -= 12;
    const pieceNames = [
      ['wK', 'K', 'Vua', 'King'],
      ['wQ', 'Q', 'Hậu', 'Queen'],
      ['wR', 'R', 'Xe', 'Rook'],
      ['wB', 'B', 'Tượng', 'Bishop'],
      ['wN', 'N', 'Mã', 'Knight'],
      ['wP', '', 'Tốt', 'Pawn'],
    ];
    const cell = (W - 80) / pieceNames.length;
    pieceNames.forEach(([symbol, letter, vietnamese, english], i) => {
      const x = 30 + cell * i;
      page!.drawImage(pieces[symbols.indexOf(symbol)], {
        x,
        y: cursor! - 29,
        width: 29,
        height: 29,
      });
      draw(
        page!,
        letter || 'không chữ',
        x + 32,
        cursor! - 17,
        letter ? 13 : 7.5,
        pageFont,
        coverGreen
      );
      draw(page!, `${vietnamese} / ${english}`, x, cursor! - 44, 8.5, pageFont);
    });
    cursor! -= 64;
    paragraph(
      'Mã dùng N để phân biệt với K (Vua). Khi ghi nước Tốt, không dùng chữ P.',
      9
    );
    cursor! -= 12;
    for (const row of notationGuideRows) {
      const body = [row.rule, ...row.examples.map(notationExampleText)].flatMap(
        (text) => lines(text, pageFont, 10, W - 222)
      );
      const height = Math.max(43, body.length * 13 + 16);
      ensure(height);
      page!.drawRectangle({
        x: 30,
        y: cursor! - height,
        width: W - 80,
        height,
        borderColor: rgb(0.72, 0.75, 0.73),
        borderWidth: 0.4,
      });
      draw(page!, row.title, 40, cursor! - 17, 10, pageFont, coverGreen);
      const english = lines(row.english, pageFont, 8, 116);
      english.forEach((line, i) =>
        draw(page!, line, 40, cursor! - 31 - i * 11, 8, pageFont)
      );
      body.forEach((line, i) =>
        draw(page!, line, 166, cursor! - 16 - i * 13, 10, pageFont)
      );
      cursor! -= height;
    }
    cursor! -= 19;
    paragraph(
      'Ví dụ số thứ tự: 1. e4 e5 ghi nước Trắng rồi nước Đen; 1... e5 bắt đầu từ nước Đen.',
      8.7
    );
    cursor! -= 7;
    paragraph(
      'Tham khảo: FIDE Laws of Chess, Phụ lục C - Algebraic Notation.',
      8
    );
    paragraph('handbook.fide.com/chapter/E012023', 8);
  };
  const cover = async (
    doc: PDFDocument,
    pageFont: PDFFont,
    isAnswer = false
  ) => {
    const page = doc.addPage([W, H]);
    drawWatermark(page, pageFont);
    const center = W / 2 - 10; // The final binding offset centers the cover on paper.
    const centered = (text: string, y: number, size: number) =>
      draw(
        page,
        text,
        center - pageFont.widthOfTextAtSize(text.normalize('NFC'), size) / 2,
        y,
        size,
        pageFont,
        coverGreen
      );
    const rule = (y: number, width: number, thickness = 0.6) =>
      page.drawLine({
        start: { x: center - width / 2, y },
        end: { x: center + width / 2, y },
        thickness,
        color: coverGold,
      });

    drawBrandHeader(page, pageFont, center);

    let titleBottom = 558;
    let titleSize = 30;
    let titleLines = lines(heading, pageFont, titleSize, 440);
    while (titleLines.length > 3 && titleSize > 18) {
      titleSize -= 1;
      titleLines = lines(heading, pageFont, titleSize, 440);
    }
    // Keep the common Vietnamese title's subject together, with a quieter
    // introductory line. Custom titles still wrap within the reserved area.
    const exerciseTitle = heading
      .normalize('NFC')
      .match(/^(BÀI TẬP)\s+(.+)$/iu);
    if (
      exerciseTitle &&
      pageFont.widthOfTextAtSize(exerciseTitle[2], 30) <= 440
    ) {
      centered(exerciseTitle[1], 603, 21);
      centered(exerciseTitle[2], 558, 30);
    } else {
      // Balance two-line titles to avoid leaving a single short word alone.
      if (titleLines.length === 2) {
        const words = heading.split(/\s+/);
        let bestDifference = Infinity;
        for (let split = 1; split < words.length; split++) {
          const candidate = [
            words.slice(0, split).join(' '),
            words.slice(split).join(' '),
          ];
          const widths = candidate.map((line) =>
            pageFont.widthOfTextAtSize(line, titleSize)
          );
          const difference = Math.abs(widths[0] - widths[1]);
          if (Math.max(...widths) <= 440 && difference < bestDifference) {
            titleLines = candidate;
            bestDifference = difference;
          }
        }
      }
      const titleTop = 568 + ((titleLines.length - 1) * (titleSize + 9)) / 2;
      titleLines.forEach((line, i) =>
        centered(line, titleTop - i * (titleSize + 9), titleSize)
      );
      titleBottom = titleTop - (titleLines.length - 1) * (titleSize + 9);
    }
    const levelCaption =
      includedLevels.length === 1
        ? levelLabel(includedLevels[0])
        : `Cấp độ / Levels: ${includedLevels.map((level) => (level === 'Beginner' ? 'Nhập môn / Beginner' : level)).join(' · ')}`;
    const levelLines = includedLevels.length
      ? lines(levelCaption, pageFont, 11, 440)
      : [];
    const levelTop = Math.min(516, titleBottom - 28);
    levelLines.forEach((line, i) => centered(line, levelTop - i * 15, 11));
    const levelBottom = levelTop - Math.max(0, levelLines.length - 1) * 15;
    if (isAnswer)
      centered('SÁCH LỜI GIẢI', Math.min(480, levelBottom - 24), 12);

    // A decorative piece study, deliberately not a puzzle or a game position.
    // Reuse the licensed high-resolution Cburnett assets already in the PDF.
    const coverPieces = isAnswer
      ? await Promise.all(
          ['wR', 'wN', 'wB'].map((symbol) =>
            doc.embedPng(images[symbols.indexOf(symbol)])
          )
        )
      : ['wR', 'wN', 'wB'].map((symbol) => pieces[symbols.indexOf(symbol)]);
    const sizes = [78, 108, 78];
    const offsets = [-100, 0, 100];
    coverPieces.forEach((piece, i) =>
      page.drawImage(piece, {
        x: center + offsets[i] - sizes[i] / 2,
        y: 342,
        width: sizes[i],
        height: sizes[i],
      })
    );
    rule(337, 310);
    centered(
      isAnswer
        ? 'Phân tích phương án · Nắm vững ý tưởng'
        : 'Quan sát · Tính toán · Kiểm tra',
      305,
      11
    );

    if (!isAnswer) {
      const left = center - 180;
      for (const [label, y] of [
        ['Họ tên', 212],
        ['Ngày bắt đầu', 170],
      ] as const) {
        draw(page, label, left, y, 10, pageFont);
        page.drawLine({
          start: { x: left + 90, y: y - 2 },
          end: { x: center + 180, y: y - 2 },
          thickness: 0.5,
          color: rgb(0, 0, 0),
        });
      }
    } else {
      centered('Phương án tham khảo và phân tích.', 212, 11);
      centered('Một bài tập có thể có nhiều cách giải.', 190, 10);
    }
    // A small checker ornament closes the composition without a large ink fill.
    for (let i = 0; i < 5; i++)
      page.drawRectangle({
        x: center - 25 + i * 10,
        y: 91,
        width: 10,
        height: 10,
        color: i % 2 === 0 ? coverGreen : rgb(1, 1, 1),
        borderColor: rgb(0, 0, 0),
        borderWidth: 0.4,
      });
  };
  if (book) {
    await cover(sheet, font);
    finishWorksheetContents = reserveContents(sheet, font, [
      ...(book.introduction.body.trim() ? [introductionEntry] : []),
      ...(book.introduction.body.trim() && (book.showNotationGuide ?? true)
        ? [notationEntry]
        : []),
      ...chapterEntries,
      ...(book.closing.body.trim() ? [closingEntry] : []),
    ]);
    const introductionStart = sheet.getPageCount();
    textSection(sheet, font, book.introduction, true, 'introduction');
    introductionEntry.target = sheet.getPages()[introductionStart];
    if (book.introduction.body.trim() && (book.showNotationGuide ?? true)) {
      const targetPage = sheet.getPageCount() + 1;
      for (const reference of notationReferences)
        draw(
          reference.page,
          `Xem Hướng dẫn ký hiệu cờ vua ở trang ${targetPage} để đọc và ghi nước đi.`,
          42,
          reference.top - 33,
          9.5,
          font
        );
      notationGuide(sheet, font);
      notationEntry.target = sheet.getPages()[targetPage - 1];
    }
    await cover(answers, answerFont, true);
    finishAnswerContents = reserveContents(
      answers,
      answerFont,
      answerEntries,
      true
    );
  }
  for (const [groupIndex, group] of pages.entries()) {
    const page = sheet.addPage([W, H]);
    chapterEntries[entryByGroup[groupIndex]].target ??= page;
    drawWatermark(page, font);
    const caption = [
      group.title === heading ? '' : group.title,
      group.review ? '' : levelLabel(group.level),
    ]
      .filter(Boolean)
      .join(' · ');
    const headerWidth = W - 60;
    const captionWidth = font.widthOfTextAtSize(caption.normalize('NFC'), 9);
    let headerBottom = H - 24;
    if (
      font.widthOfTextAtSize(heading.normalize('NFC'), 12) +
        16 +
        captionWidth <=
      headerWidth
    ) {
      draw(page, heading, 30, headerBottom, 12);
      draw(page, caption, W - 30 - captionWidth, headerBottom);
    } else {
      const titleSize = Math.min(
        15,
        headerWidth / font.widthOfTextAtSize(heading.normalize('NFC'), 1)
      );
      draw(page, heading, 30, headerBottom, titleSize);
      let captionSize = 9;
      let captionLines = lines(caption, font, captionSize, headerWidth);
      while (captionLines.length > 2 && captionSize > 0.5) {
        captionSize -= 0.25;
        captionLines = lines(caption, font, captionSize, headerWidth);
      }
      headerBottom -= 15;
      captionLines.forEach((line, i) =>
        draw(page, line, 30, headerBottom - i * 11, captionSize)
      );
      headerBottom -= (captionLines.length - 1) * 11;
    }
    if (!book && sheet.getPageCount() === 1) {
      headerBottom -= 15;
      draw(
        page,
        'Họ tên: .....................................................   Ngày: ........................',
        30,
        headerBottom
      );
      headerBottom -= 14;
      draw(
        page,
        'Ghi phương án hoặc vẽ mũi tên. Với bài nhiều nước, ghi cả nước đi của đối phương.',
        30,
        headerBottom,
        8.5
      );
    }
    const promptSize = 9.5;
    const previousSize = 8.5;
    const previousLineHeight = 11;
    const boardGap = 12;
    const writingOffsets = [21, 37] as const;
    const rowGap = 14;
    const firstPromptY = headerBottom - 23;
    const positions = group.exercises.map(({ number, exercise: e }) => {
      const b = new Chess(e.fen);
      const objective = group.review && e.goal ? practiceGoalLabels[e.goal] : '';
      const prompt = [
        { text: `${number}. `, face: font },
        { text: `${b.turn() === 'w' ? 'Trắng' : 'Đen'} đi`, face: boldFont },
        { text: objective ? ` · ${objective}` : '', face: font },
      ].map(({ text, face }) => ({
        text,
        face,
        width: face.widthOfTextAtSize(text, promptSize),
      }));
      const previous = previousMoveLabel(e, 'compact');
      const promptWidth = prompt.reduce((sum, part) => sum + part.width, 0);
      const inline = previous ? ` · ${previous}` : '';
      const fitsInline =
        promptWidth + font.widthOfTextAtSize(inline, previousSize) <= 255;
      return {
        b,
        prompt,
        inline: fitsInline ? inline : '',
        previousLines: fitsInline
          ? []
          : lines(previous, font, previousSize, 255),
      };
    });
    // Both boards in a row share the space needed by its longer caption.
    const rowCaptionHeights: number[] = [];
    for (let i = 0; i < positions.length; i += 2)
      rowCaptionHeights.push(
        Math.max(
          positions[i].previousLines.length,
          positions[i + 1]?.previousLines.length ?? 0
        ) * previousLineHeight
      );
    const rowCount = rowCaptionHeights.length;
    const rowOverhead = boardGap + writingOffsets[1];
    const totalOverhead =
      rowCaptionHeights.reduce((sum, height) => sum + height + rowOverhead, 0) +
      Math.max(0, rowCount - 1) * rowGap;
    const minWritingLineY = book ? bookFooterY + bookFooterFontSize + 12 : 32;
    const boardSize = Math.min(
      194,
      (firstPromptY - minWritingLineY - totalOverhead) / Math.max(1, rowCount)
    );
    let nextPromptY = firstPromptY;
    const rowPromptYs = rowCaptionHeights.map((height) => {
      const y = nextPromptY;
      nextPromptY -= height + rowOverhead + boardSize + rowGap;
      return y;
    });
    for (const [i, position] of positions.entries()) {
      const { b, prompt, inline, previousLines } = position;
      const x = 30 + (i % 2) * 277;
      const rowIndex = Math.floor(i / 2);
      const top = rowPromptYs[rowIndex];
      let captionX = x;
      for (const { text, face, width } of prompt) {
        if (text) draw(page, text, captionX, top, promptSize, face);
        captionX += width;
      }
      if (inline) draw(page, inline, captionX, top, previousSize);
      previousLines.forEach((line, j) =>
        draw(page, line, x, top - (j + 1) * previousLineHeight, previousSize)
      );
      const bx = x + 22 + (194 - boardSize) / 2,
        by = top - rowCaptionHeights[rowIndex] - boardGap - boardSize,
        step = boardSize / 8,
        white = b.turn() === 'w';
      for (let row = 0; row < 8; row++)
        for (let col = 0; col < 8; col++) {
          const file = white ? col : 7 - col,
            rank = white ? 7 - row : row;
          const xx = bx + col * step,
            yy = by + (7 - row) * step;
          page.drawRectangle({
            x: xx,
            y: yy,
            width: step,
            height: step,
            color: rgb(1, 1, 1),
          });
          // Pure black vector hatching survives monochrome printing without
          // relying on pale gray fills or printer halftone settings.
          if ((file + rank) % 2 === 0) {
            const inset = 0.35;
            const span = step - 2 * inset;
            for (let offset = -span; offset < span; offset += 2.6) {
              const x0 = Math.max(0, offset);
              const y0 = Math.max(0, -offset);
              const length = Math.min(span - x0, span - y0);
              if (length <= 0) continue;
              page.drawLine({
                start: { x: xx + inset + x0, y: yy + inset + y0 },
                end: {
                  x: xx + inset + x0 + length,
                  y: yy + inset + y0 + length,
                },
                thickness: 0.3,
                color: rgb(0, 0, 0),
              });
            }
          }
          const piece = b.get(
            `${'abcdefgh'[file]}${rank + 1}` as import('chess.js').Square
          );
          if (piece)
            page.drawImage(
              pieces[symbols.indexOf(piece.color + piece.type.toUpperCase())],
              { x: xx, y: yy, width: step, height: step }
            );
        }
      page.drawRectangle({
        x: bx,
        y: by,
        width: boardSize,
        height: boardSize,
        borderColor: rgb(0, 0, 0),
        borderWidth: 0.6,
      });
      for (let j = 0; j < 8; j++) {
        draw(
          page,
          'abcdefgh'[white ? j : 7 - j],
          bx + (j + 0.5) * step - 2,
          by - 10,
          7
        );
        draw(
          page,
          String(white ? j + 1 : 8 - j),
          bx - 10,
          by + (j + 0.5) * step - 2,
          7
        );
      }
      for (const offset of writingOffsets)
        page.drawLine({
          start: { x: bx, y: by - offset },
          end: { x: bx + boardSize, y: by - offset },
          thickness: 0.4,
          dashArray: [1, 2],
          color: rgb(0.45, 0.45, 0.45),
        });
    }
  }
  if (book) {
    const closingStart = sheet.getPageCount();
    const closingEnd = textSection(sheet, font, book.closing, false, 'closing');
    closingEntry.target = sheet.getPages()[closingStart];
    drawDocumentInfo(sheet, font, closingEnd);
  }
  let ap: PDFPage;
  let y = 0;
  let currentExercise = '';
  const newPage = () => {
    ap = answers.addPage([W, H]);
    drawWatermark(ap, answerFont);
    draw(ap, 'LỜI GIẢI VÀ PHÂN TÍCH', 30, H - 30, 16, answerFont);
    y = H - 52;
    if (currentExercise) {
      for (const line of lines(
        `${currentExercise} (tiếp theo)`,
        answerFont,
        9,
        W - 60
      )) {
        draw(ap, line, 30, y, 9, answerFont);
        y -= 14;
      }
      y -= 4;
    }
  };
  newPage();
  const write = (s: string, size = 9) => {
    for (const line of lines(s, answerFont, size, W - 60)) {
      if (y < 48) newPage();
      draw(ap, line, 30, y, size, answerFont);
      y -= 14;
    }
  };
  write(heading, 11);
  write(
    'Các phương án dưới đây dùng để đối chiếu và phân tích. Một bài có thể có nhiều cách giải; cần kiểm tra nước đi của đối phương và kết quả của từng phương án.'
  );
  write(
    'Với bài trích từ ván đấu, nguồn tư liệu xác định xuất xứ thế cờ; phương án phân tích có thể khác diễn biến thực tế.',
    8
  );
  write(
    'Ký hiệu: K = Vua; Q = Hậu; R = Xe; B = Tượng; N = Mã. Nước Tốt không có chữ cái chỉ tên quân.',
    8
  );
  write(
    'x = bắt quân; + = chiếu; # = chiếu hết; =Q = phong Hậu. O-O = nhập thành cánh Vua; O-O-O = nhập thành cánh Hậu.',
    8
  );
  write(
    'Số nước kèm một dấu chấm chỉ nước của Trắng (1.); ba dấu chấm chỉ nước của Đen (1...).',
    8
  );
  y -= 8;
  for (const [groupIndex, group] of pages.entries())
    for (const { number, exercise: e, topicTitle, level } of group.exercises) {
      currentExercise = '';
      if (y < 150) newPage();
      answerEntries[entryByGroup[groupIndex]].target ??= answers.getPage(
        answers.getPageCount() - 1
      );
      currentExercise = `${number}. ${topicTitle ?? group.title} · ${levelLabel(level ?? group.level)}${group.review ? ' · Ôn tập' : ''}`;
      write(currentExercise, 11);
      explainLine(e.fen, e.moves, true).forEach((s) => write(s));
      if (e.solution || (e.beginner && !e.moves.length))
        write(worksheetSolutionText(e));
      for (const alt of e.moves.length ? (e.alternativeLines ?? []) : []) {
        // Keep the label with at least the first move of its variation.
        if (y < 62) newPage();
        write('Phương án bổ sung:', 8);
        explainLine(e.fen, alt, true).forEach((s) => write(s, 8));
      }
      worksheetSourceLines(e).forEach((source) => write(source, 8));
      y -= 12;
    }
  drawDocumentInfo(answers, answerFont, { page: ap!, cursor: y });
  finishWorksheetContents();
  finishAnswerContents();
  const footerText = worksheetFooterText(
    book
      ? {
          name: bookFooterName(footer.name),
          phone: contactPhone,
          address: book.showAddressOnEveryPage ? footer.address : '',
        }
      : footer
  ).normalize('NFC');
  for (const doc of [sheet, answers]) {
    await doc.attach(artworkNotice, 'Chess-piece-artwork-license.txt', {
      mimeType: 'text/plain',
      description: 'Cburnett artwork attribution and license',
    });
    doc.setTitle(doc === answers ? `${heading} - Lời giải` : heading);
    doc.setAuthor('LIMA Chess');
    doc.setSubject(
      'Chess pieces: Colin M. L. Burnett (Cburnett), BSD. See /chess-print/NOTICE.txt'
    );
    doc.getPages().forEach((p, i) => {
      const footerFont = doc === sheet ? font : answerFont;
      if (book) {
        const leftPage = i % 2 === 1;
        const number = String(i + 1);
        const numberWidth = footerFont.widthOfTextAtSize(
          number,
          bookFooterFontSize
        );
        if (footerText) {
          const size = Math.min(
            bookFooterFontSize,
            (W - 80 - numberWidth) / footerFont.widthOfTextAtSize(footerText, 1)
          );
          const x = leftPage
            ? W - 30 - footerFont.widthOfTextAtSize(footerText, size)
            : 30;
          draw(p, footerText, x, bookFooterY, size, footerFont);
        }
        draw(
          p,
          number,
          leftPage ? 30 : W - 30 - numberWidth,
          bookFooterY,
          bookFooterFontSize,
          footerFont
        );
        // Mirror the binding allowance for long-edge duplex printing.
        p.translateContent(leftPage ? -10 : 10, 0);
        return;
      }
      if (footerText) {
        const size = Math.min(
          7,
          (W - 110) / footerFont.widthOfTextAtSize(footerText, 1)
        );
        draw(p, footerText, 30, 14, size, footerFont);
      }
      draw(
        p,
        `${i + 1} / ${doc.getPageCount()}`,
        W - 55,
        14,
        7,
        doc === sheet ? font : answerFont
      );
    });
  }
  return { worksheet: await sheet.save(), answers: await answers.save() };
}
