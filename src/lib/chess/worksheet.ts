import { Chess } from 'chess.js';
import type { DrawExercise } from './draw-practice';

export type WorksheetTopic = {
  id: string;
  title: string;
  endpoint: string;
  group?: string;
};
export function worksheetTopicsFromLibrary(
  pages: {
    href: string;
    title: string;
    group?: string;
    worksheetEndpoint?: string;
  }[]
): WorksheetTopic[] {
  return pages
    .filter(
      (page) =>
        page.worksheetEndpoint &&
        /^\/api\/[a-z0-9-]+$/.test(page.worksheetEndpoint)
    )
    .map((page) => ({
      id: page.href.replace(/^\//, ''),
      title: page.title,
      endpoint: page.worksheetEndpoint!,
      group: page.group,
    }));
}
export const worksheetLevels = ['Beginner', 'A', 'B', 'C', 'C*', 'D'] as const;
export type WorksheetLevel = (typeof worksheetLevels)[number];
export type WorksheetSection = {
  id: number;
  topic: string;
  level: WorksheetLevel;
  count: number;
};
export type WorksheetPage = {
  title: string;
  level: WorksheetLevel;
  review?: boolean;
  exercises: {
    number: number;
    exercise: DrawExercise;
    topicTitle?: string;
    level?: WorksheetLevel;
  }[];
};
export type WorksheetCatalog = Partial<Record<string, DrawExercise[]>>;
export function positionKey(e: DrawExercise) {
  return e.fen.split(' ').slice(0, 4).join(' ');
}
export function levelExercises(
  exercises: DrawExercise[],
  level: WorksheetLevel
) {
  const seen = new Set<string>();
  return exercises.filter((e) => {
    const matches =
      level === 'Beginner'
        ? e.beginner
        : !e.beginner && e.difficulty?.level === level;
    const key = positionKey(e);
    if (
      !matches ||
      seen.has(key) ||
      !e.moves.length ||
      e.mode === 'recognition'
    )
      return false;
    seen.add(key);
    return true;
  });
}
export function planWorksheet(
  sections: WorksheetSection[],
  catalog: WorksheetCatalog,
  topics: WorksheetTopic[]
): WorksheetPage[] {
  if (!sections.length) throw new Error('Thêm ít nhất một phần bài tập.');
  const seen = new Set<string>();
  const pages: WorksheetPage[] = [];
  let number = 1;
  for (const section of sections) {
    if (!Number.isInteger(section.count) || section.count < 1)
      throw new Error('Số thế cờ phải là số nguyên từ 1 trở lên.');
    if (!catalog[section.topic])
      throw new Error('Chờ tải xong chủ đề trước khi tạo PDF.');
    const topic = topics.find((t) => t.id === section.topic);
    if (!topic) throw new Error('Chủ đề không còn trong thư viện.');
    const pool = levelExercises(catalog[section.topic]!, section.level).filter(
      (e) => !seen.has(positionKey(e))
    );
    if (section.count > pool.length)
      throw new Error(
        `${topic.title} · ${section.level}: còn ${pool.length} thế cờ chưa dùng trong bộ này.`
      );
    const selected = pool.slice(0, section.count);
    selected.forEach((e) => seen.add(positionKey(e)));
    for (let i = 0; i < selected.length; i += 6)
      pages.push({
        title: topic.title,
        level: section.level,
        exercises: selected
          .slice(i, i + 6)
          .map((exercise) => ({ number: number++, exercise })),
      });
  }
  return pages;
}
const names: Record<string, string> = {
  p: 'Tốt',
  n: 'Mã',
  b: 'Tượng',
  r: 'Xe',
  q: 'Hậu',
  k: 'Vua',
};
export function explainLine(fen: string, moves: string[], numbered = false) {
  const board = new Chess(fen);
  return moves.map((san) => {
    const white = board.turn() === 'w';
    const side = white ? 'Trắng' : 'Đen';
    const moveNumber = board.fen().split(' ')[5];
    const move = board.move(san);
    if (!move) throw new Error(`Nước đi không hợp lệ: ${san}`);
    let explanation = `${names[move.piece]} từ ${move.from} ${move.captured ? `bắt ${names[move.captured]} ở` : 'đến'} ${move.to}`;
    if (move.flags.includes('k')) explanation = 'Nhập thành cánh Vua';
    if (move.flags.includes('q')) explanation = 'Nhập thành cánh Hậu';
    if (move.flags.includes('e'))
      explanation = `Tốt từ ${move.from} đến ${move.to}, bắt Tốt qua đường ở ${move.to[0]}${move.from[1]}`;
    if (move.promotion) explanation += `, phong thành ${names[move.promotion]}`;
    if (board.in_checkmate()) explanation += ', chiếu hết';
    else if (board.in_check()) explanation += ', chiếu Vua';
    else if (board.in_stalemate()) explanation += ', hòa do hết nước đi (pat)';
    const notation = numbered
      ? `${moveNumber}${white ? '.' : '...'} ${move.san}`
      : `${side}: ${move.san}`;
    return `${notation} - ${explanation}.`;
  });
}
export function previousMoveLabel(e: DrawExercise) {
  if (!e.previousMove) return '';
  const b = new Chess(e.previousMove.fen);
  if (!b.move(e.previousMove.move) || b.fen() !== new Chess(e.fen).fen())
    throw new Error('Nước đi trước không khớp thế cờ.');
  return explainLine(e.previousMove.fen, [e.previousMove.move])[0].replace(
    ':',
    ' vừa đi:'
  );
}

export type WorksheetFooter = { name: string; phone: string; address: string };
export const defaultWorksheetFooter: WorksheetFooter = {
  name: 'Trung Tâm Cờ Vua - LIMA Chess',
  phone: '0912333224',
  address: '29 Lê Thị Hồng Gấm, xã Đức Trọng, tỉnh Lâm Đồng',
};
export function worksheetFooterText(footer: WorksheetFooter) {
  const clean = (value: string) => value.trim().replace(/\s+/g, ' ');
  return [clean(footer.name), clean(footer.phone), clean(footer.address)]
    .filter(Boolean)
    .join(' · ');
}

export const worksheetLevelGuide: Record<WorksheetLevel, string> = {
  Beginner:
    'Dành cho người mới biết đi quân và bắt quân. Thế cờ ít quân, ý tưởng trực tiếp.',
  A: 'Vận dụng trực tiếp chủ đề; không thí quân hoặc chuẩn bị dài.',
  B: 'Có nước chuẩn bị đơn giản hoặc phối hợp quân trong phương án ngắn.',
  C: 'Thí quân đơn giản với mục đích chiến thuật rõ ràng.',
  'C*': 'Không thí quân; yêu cầu tính sâu hơn cấp B thêm 2-3 nước của bên giải.',
  D: 'Thí quân phức tạp, phối hợp nâng cao; trên 3 nước của bên giải.',
};
export type WorksheetBookOptions = {
  showLevelGuide?: boolean;
  introduction: { title: string; body: string };
  closing: { title: string; body: string };
};
export const defaultBookOptions: WorksheetBookOptions = {
  showLevelGuide: true,
  introduction: {
    title: 'Hướng dẫn luyện tập',
    body: 'Trước khi chọn nước đi, xác định bên đến lượt và xem xét các nước chiếu, bắt quân, đe dọa của cả hai bên. Tính cả phương án phòng thủ tốt nhất của đối phương, không chỉ nước đáp thuận lợi cho mình.\n\nGhi phương án dưới bàn cờ; với bài nhiều nước, ghi cả nước đáp của đối phương. Người mới học có thể vẽ mũi tên. Ví dụ: Nd4 là nước Mã đến ô d4.\n\nTự giải trước khi đối chiếu lời giải. Nếu chọn phương án khác, kiểm tra xem phương án đó có đạt yêu cầu bài tập trước các cách phòng thủ của đối phương hay không.',
  },
  closing: {
    title: 'Tổng kết và định hướng luyện tập',
    body: 'Giải lại các bài còn sai hoặc cần gợi ý trước khi xem lời giải. Với mỗi bài, xác định ý tưởng chính và kiểm tra phương án phòng thủ tốt nhất của đối phương.\n\nChọn cấp độ tiếp theo khi có thể tự giải và giải thích rõ phương án. Nếu còn bỏ sót nước đáp, luyện thêm ở cấp độ hiện tại hoặc bổ sung bài cùng cấp độ thuộc chủ đề khác.',
  },
};

/** Reserve new review positions first; reuse mode draws only from selected chapters.
 * The seed changes ordering, never silently changes the selected position set. */
export function planWorksheetBook(
  sections: WorksheetSection[],
  reviews: WorksheetSection[],
  catalog: WorksheetCatalog,
  topics: WorksheetTopic[],
  reuse = false,
  seed = 1,
  shuffleReview = true
): WorksheetPage[] {
  for (const row of reviews)
    if (!Number.isInteger(row.count) || row.count < 0)
      throw new Error('Số thế ôn tập phải là số nguyên từ 0 trở lên.');
  const active = reviews.filter((r) => r.count > 0);
  let chapters: WorksheetPage[];
  let reviewPages: WorksheetPage[] = [];
  if (reuse) {
    chapters = planWorksheet(sections, catalog, topics);
    const selected = new Set(
      chapters.flatMap((p) => p.exercises.map((e) => positionKey(e.exercise)))
    );
    const reviewCatalog = Object.fromEntries(
      Object.entries(catalog).map(([id, items]) => [
        id,
        items?.filter((e) => selected.has(positionKey(e))),
      ])
    );
    if (active.length)
      reviewPages = planWorksheet(active, reviewCatalog, topics);
  } else {
    if (active.length) reviewPages = planWorksheet(active, catalog, topics);
    const reserved = new Set(
      reviewPages.flatMap((p) =>
        p.exercises.map((e) => positionKey(e.exercise))
      )
    );
    const chapterCatalog = Object.fromEntries(
      Object.entries(catalog).map(([id, items]) => [
        id,
        items?.filter((e) => !reserved.has(positionKey(e))),
      ])
    );
    chapters = planWorksheet(sections, chapterCatalog, topics);
  }
  return renumberWorksheetPages([
    ...chapters,
    ...mixReviewPages(reviewPages, seed, shuffleReview),
  ]);
}

function renumberWorksheetPages(pages: WorksheetPage[]): WorksheetPage[] {
  let number = 1;
  return pages.map((page) => ({
    ...page,
    exercises: page.exercises.map((e) => ({ ...e, number: number++ })),
  }));
}

function mixReviewPages(
  reviewPages: WorksheetPage[],
  seed: number,
  shuffleReview: boolean,
  title = 'Ôn tập tổng hợp'
): WorksheetPage[] {
  // Shuffle within topic/level buckets, then interleave buckets for a balanced review.
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const buckets = new Map<string, WorksheetPage['exercises']>();
  for (const page of reviewPages) {
    const key = `${page.title}|${page.level}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(
      ...page.exercises.map((e) => ({
        ...e,
        topicTitle: page.title,
        level: page.level,
      }))
    );
    buckets.set(key, bucket);
  }
  const queues = [...buckets.values()];
  if (shuffleReview)
    for (const queue of queues)
      for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
      }
  const mixed: WorksheetPage['exercises'] = [];
  if (!shuffleReview) {
    mixed.push(
      ...reviewPages.flatMap((page) =>
        page.exercises.map((e) => ({
          ...e,
          topicTitle: page.title,
          level: page.level,
        }))
      )
    );
  }
  while (shuffleReview && queues.some((q) => q.length))
    for (const queue of queues) {
      const item = queue.shift();
      if (item) mixed.push(item);
    }
  let number = 1;
  const result: WorksheetPage[] = [];
  for (let i = 0; i < mixed.length; i += 6)
    result.push({
      title,
      level: 'Beginner',
      review: true,
      exercises: mixed.slice(i, i + 6).map((e) => ({ ...e, number: number++ })),
    });
  return result;
}

export type WorksheetReviewBlock = {
  id: number;
  afterSectionId: number;
  rows: WorksheetSection[];
};

/** Anchors follow chapter identity when chapters move. Fresh positions are
 * reserved across all blocks; reused positions come only from preceding chapters. */
export function planWorksheetBookBlocks(
  sections: WorksheetSection[],
  blocks: WorksheetReviewBlock[],
  catalog: WorksheetCatalog,
  topics: WorksheetTopic[],
  reuse = false,
  seed = 1,
  shuffle = true
): WorksheetPage[] {
  if (!sections.length) return planWorksheet(sections, catalog, topics);
  const ordered = blocks
    .map((block, order) => {
      const index = sections.findIndex((s) => s.id === block.afterSectionId);
      if (index < 0)
        throw new Error(
          `Ôn tập ${order + 1}: chọn lại vị trí sau khi xóa phần bài tập.`
        );
      for (const row of block.rows) {
        if (!Number.isInteger(row.count) || row.count < 0)
          throw new Error(
            `Ôn tập ${order + 1}: số thế phải là số nguyên từ 0 trở lên.`
          );
        if (
          row.count > 0 &&
          !sections.slice(0, index + 1).some((s) => s.topic === row.topic)
        )
          throw new Error(
            `Ôn tập ${order + 1}: chỉ chọn chủ đề đã xuất hiện trước khối ôn tập.`
          );
      }
      return { block, index, order };
    })
    .sort((a, b) => a.index - b.index || a.order - b.order);
  const filterCatalog = (
    keys: Set<string>,
    include = false
  ): WorksheetCatalog =>
    Object.fromEntries(
      Object.entries(catalog).map(([key, items]) => [
        key,
        items?.filter((e) => keys.has(positionKey(e)) === include),
      ])
    );
  const selectedReviews = new Map<number, WorksheetPage[]>();
  const reserved = new Set<string>();
  if (!reuse)
    for (const { block, order } of ordered) {
      const rows = block.rows.filter((r) => r.count > 0);
      try {
        const chosen = rows.length
          ? planWorksheet(rows, filterCatalog(reserved), topics)
          : [];
        selectedReviews.set(block.id, chosen);
        chosen
          .flatMap((p) => p.exercises)
          .forEach((e) => reserved.add(positionKey(e.exercise)));
      } catch (error) {
        throw new Error(`Ôn tập ${order + 1}: ${(error as Error).message}`);
      }
    }
  const output: WorksheetPage[] = [];
  const used = new Set(reserved);
  const preceding = new Set<string>();
  let reviewNumber = 0;
  sections.forEach((section, index) => {
    const chapter = planWorksheet([section], filterCatalog(used), topics);
    chapter
      .flatMap((p) => p.exercises)
      .forEach((e) => {
        used.add(positionKey(e.exercise));
        preceding.add(positionKey(e.exercise));
      });
    output.push(...chapter);
    for (const { block, order } of ordered.filter((b) => b.index === index)) {
      let chosen = selectedReviews.get(block.id) ?? [];
      if (reuse) {
        const rows = block.rows.filter((r) => r.count > 0);
        try {
          chosen = rows.length
            ? planWorksheet(rows, filterCatalog(preceding, true), topics)
            : [];
        } catch (error) {
          throw new Error(`Ôn tập ${order + 1}: ${(error as Error).message}`);
        }
      }
      if (chosen.length) {
        reviewNumber++;
        output.push(
          ...mixReviewPages(
            chosen,
            seed + reviewNumber - 1,
            shuffle,
            `Ôn tập tổng hợp ${reviewNumber}`
          )
        );
      }
    }
  });
  return renumberWorksheetPages(output);
}

/** PDF editorial layer: retain original exercise evidence and move data.
 * Replacements are limited to reviewed source phrases; no tactical claims
 * are inferred from topic names, game results, or engine scores. */
export function worksheetSolutionText(exercise: DrawExercise): string {
  let text = exercise.solution.normalize('NFC').trim();
  const sameMoves = (value: string) =>
    value.replace(/[ ·\s]/g, '') === exercise.moves.join('');
  const suffix = text.match(/\s*Nhánh mẫu:\s*(.*?)\.\s*$/);
  if (suffix && sameMoves(suffix[1])) text = text.slice(0, suffix.index).trim();
  // Some repetition exercises repeat the entire numbered line before the note.
  const resultAt = text.indexOf('. Kết quả ván đấu:');
  if (resultAt > 0) {
    const prefix = text.slice(0, resultAt).replace(/\d+\.(?:\.\.)?\s*/g, '');
    if (sameMoves(prefix)) text = text.slice(resultAt + 2);
  }
  const replacements: [string, string][] = [
    ['Nhánh mẫu:', 'Phương án minh họa:'],
    ['Hy sinh ', 'Thí '],
    ['chiếu dọc hàng cuối', 'chiếu trên hàng ngang cuối'],
    ['các ô thoát bị khóa', 'Vua không còn ô thoát'],
    ['bị ghim vào quân giá trị cao hơn', 'bị ghim vào quân có giá trị cao hơn'],
    ['Quân chắn đường di chuyển, mở đường', 'Di chuyển quân chắn để mở đường'],
    [
      'Chuỗi đổi loại bỏ các quân còn lại của cả hai bên.',
      'Đổi hết các quân còn lại để chuyển về tàn cuộc Vua và Tốt.',
    ],
    ['chuỗi đổi đưa về thế', 'chuỗi đổi quân đưa về thế cờ'],
    [
      'Ghim Mã, rồi bắt Mã ở lượt tiếp theo.',
      'Ghim Mã, rồi bắt Mã ở nước tiếp theo.',
    ],
    [
      'Đây là bài tập thắng quân, không phải mọi thế cuối đều thắng ván cờ.',
      'Mục tiêu là giành lợi thế vật chất; kết quả ván đấu còn phụ thuộc vào thế cờ sau đó.',
    ],
    ['Trong biến này, bạn lời ', 'Trong phương án này, bên giải thu lợi '],
    ['biến mẫu lời ', 'phương án minh họa thu lợi '],
    ['Trong biến mẫu,', 'Trong phương án minh họa,'],
    [
      ' điểm quân (Tốt 1, Tượng/Mã 3, Xe 5, Hậu 9)',
      ' điểm theo giá trị quy ước (Tốt = 1; Mã/Tượng = 3; Xe = 5; Hậu = 9)',
    ],
    [
      'cũng là ứng viên mạnh; không xem đó là nước sai chỉ vì không phải đòn xiên.',
      'cũng là một nước đáng xét; cần đánh giá kết quả, không loại bỏ chỉ vì nước đó không tạo đòn xiên.',
    ],
    [
      'Hình dạng đòn xiên vẫn còn, nhưng quân hỗ trợ đã thay đổi.',
      'Thế đòn xiên vẫn còn, nhưng khả năng bảo vệ quân tấn công đã thay đổi.',
    ],
    [
      'Chuỗi chiếu trong ván thật đưa đến thế lặp lại ba lần.',
      'Chuỗi nước chiếu trong ván đấu đưa đến thế cờ lặp lại ba lần.',
    ],
    [
      'Giữ nhịp chiếu và theo dõi ô thoát của Vua.',
      'Duy trì các nước chiếu và kiểm tra các ô thoát của Vua.',
    ],
    [
      'Các nước đáp ở đây là diễn biến đã được chơi, không khẳng định tất cả đều bắt buộc.',
      'Đây là các nước đáp đã được chơi trong ván đấu, không nhất thiết là những nước duy nhất.',
    ],
    [
      'Đây là diễn biến thực tế; không khẳng định mọi nước đáp của đối thủ đều bị bắt buộc.',
      'Đây là diễn biến thực tế của ván đấu; đối phương có thể có phương án khác.',
    ],
    ['Thế ở đầu bài', 'Thế cờ ban đầu'],
    [
      'Sau nước đáp đã được chơi, bên đến lượt không bị chiếu nhưng không còn nước hợp lệ: hòa do hết nước đi.',
      'Sau nước đáp trong ván đấu, bên đến lượt không bị chiếu nhưng không có nước đi hợp lệ: hòa do hết nước đi (pat).',
    ],
    [
      'Đây là một bẫy trong ván thật; không khẳng định đối thủ bắt buộc phải mắc bẫy.',
      'Đây là bẫy đã xuất hiện trong ván đấu; đối phương không bắt buộc phải chọn nước đáp này.',
    ],
    [
      'Sau nước này, các quân còn lại không thể tạo chiếu hết bằng bất kỳ chuỗi nước hợp lệ nào. Vì vậy ván cờ hòa ngay. Kết quả này được xác nhận từ vị trí cuối của ván đấu.',
      'Sau nước này, không bên nào có thể chiếu hết bằng bất kỳ chuỗi nước đi hợp lệ nào. Đây là thế cờ chết; ván đấu kết thúc hòa ngay.',
    ],
    [
      'Vua phòng thủ trú ở góc đó và tránh tự rời vùng an toàn.',
      'Vua bên phòng thủ giữ góc phong cấp đó.',
    ],
    [
      'Nguy cơ hết nước đi giúp cản Hậu;',
      'Khả năng hòa do hết nước đi (pat) giúp bên có Tốt phòng thủ trước Hậu;',
    ],
    [
      'Tất cả thế trong đoạn đã chọn được bảng tàn cuộc xác nhận là hòa nếu đi đúng.',
      'Các thế cờ trong phương án đều hòa nếu phòng thủ chính xác, theo cơ sở dữ liệu tàn cuộc.',
    ],
    [
      'Đây là các nước đã chơi; hết đoạn không có nghĩa ván cờ tự động hòa. Mở ván gốc để xem toàn bộ diễn biến.',
      'Phương án trích từ ván đấu minh họa cách phòng thủ; ván đấu không tự động kết thúc hòa ở nước cuối của đoạn trích.',
    ],
  ];
  for (const [before, after] of replacements)
    text = text.split(before).join(after);
  if (
    exercise.outcome === 'repetition' &&
    text.includes('lặp') &&
    !(text.includes('yêu cầu hòa') && /(?:không|chưa) tự động/.test(text))
  )
    text +=
      ' Khi thế cờ xuất hiện lần thứ ba và đáp ứng điều kiện lặp lại theo luật, bên đến lượt có quyền yêu cầu hòa; ván đấu chưa tự động kết thúc.';
  return text;
}

export function worksheetSourceLines(exercise: DrawExercise): string[] {
  const result: string[] = [];
  const players = exercise.players?.map((p) => p.name).join(' - ');
  const caption = [players, exercise.gameCaption].filter(Boolean).join(' · ');
  if (caption) result.push(`Ván đấu: ${caption}`);
  if (exercise.source === 'original-composition')
    result.push('Xuất xứ: thế cờ biên soạn.');
  else if (exercise.source === 'modified-comparison')
    result.push('Xuất xứ: thế cờ điều chỉnh để so sánh.');
  else if (exercise.source) result.push(`Nguồn tư liệu: ${exercise.source}`);
  return result;
}
