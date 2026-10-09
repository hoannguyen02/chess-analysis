import type { MathBlock, MathExercise, MathLessonData } from './lessons';
import type { ParallelFigure } from './parallel-geometry';
export const parallelFigures: Record<string, ParallelFigure> = {};
const b = (
  id: string,
  section: MathBlock['section'],
  title: string,
  text: string,
  figure?: ParallelFigure
): MathBlock => {
  if (figure) parallelFigures[`parallel-${id}`] = figure;
  return {
    id: `parallel-${id}`,
    section,
    title,
    text,
    visual: 'none',
    values: [],
  };
};
const q = (
  id: string,
  section: MathExercise['section'],
  prompt: string,
  answer: string,
  solution: string,
  options: string[] = [],
  figure?: ParallelFigure,
  extra: Partial<MathExercise> = {}
): MathExercise => {
  if (figure) parallelFigures[`parallel-${id}`] = figure;
  return {
    id: `parallel-${id}`,
    section,
    prompt,
    answer,
    solution,
    options,
    kind: options.length ? 'choice' : 'number',
    unit: '',
    simplified: false,
    tolerance: 0,
    mistakes: [],
    hint: 'Xác định điều đã biết và điều cần tìm. Chọn tính chất hoặc dấu hiệu phù hợp; không kết luận chỉ từ hình vẽ.',
    ...(section === 'extra'
      ? {
          group: 'skills' as const,
          task: 'Tính góc và nhận biết song song',
          skill: 'Hai đường thẳng song song',
          difficulty: 'medium' as const,
          workspace: 'medium' as const,
        }
      : {}),
    ...extra,
  };
};
const standard: ParallelFigure = { parallel: true };
const exercises: MathExercise[] = [
  q(
    'f1',
    'foundation',
    'Hai góc kề bù, một góc bằng 68°. Góc còn lại bằng bao nhiêu độ?',
    '112',
    'Hai góc kề bù có tổng số đo 180°.\nGóc còn lại bằng 180° − 68° = 112°.'
  ),
  q(
    'f2',
    'foundation',
    'Trong hình, góc 1 và góc 3 là cặp góc nào?',
    'Đối đỉnh',
    'Góc 1 và góc 3 có các cạnh tương ứng là các tia đối nhau nên là hai góc đối đỉnh.',
    ['Đối đỉnh', 'Kề bù'],
    { mode: 'intersection' }
  ),
  q(
    'g0',
    'guided',
    'Trong hình, A4 và B2 là cặp góc nào?',
    'So le trong',
    'A4 và B2 nằm giữa a, b và ở hai phía của c, nên là hai góc so le trong.',
    ['So le trong', 'Đồng vị', 'Đối đỉnh'],
    {}
  ),
  q(
    'g1',
    'guided',
    'Cho a ∥ b, A1 = 72°. Tính B1 (độ).',
    '72',
    'Vì a ∥ b nên hai góc đồng vị A1 và B1 bằng nhau.\nB1 = A1 = 72°.\nVậy B1 = 72°.',
    [],
    { parallel: true, labels: { A1: '72°', B1: '?' }, answers: { B1: '72°' } }
  ),
  q(
    'g2',
    'guided',
    'Cho a ∥ b, A4 = 107°. Tính B1 (độ).',
    '73',
    'Vì a ∥ b nên A4 và B1 là hai góc trong cùng phía bù nhau.\nB1 = 180° − 107° = 73°.\nVậy B1 = 73°.',
    [],
    { parallel: true, labels: { A4: '107°', B1: '?' }, answers: { B1: '73°' } }
  ),
  q(
    'g3',
    'guided',
    'A3 = B1 = 58°. Có thể kết luận a ∥ b vì lí do nào?',
    'Hai góc so le trong bằng nhau',
    'A3 và B1 là hai góc so le trong bằng nhau. Theo dấu hiệu nhận biết, a ∥ b.',
    [
      'Hai góc so le trong bằng nhau',
      'Hai góc đối đỉnh bằng nhau',
      'Hình vẽ trông song song',
    ],
    { labels: { A3: '58°', B1: '58°' } }
  ),
  q(
    'g4',
    'guided',
    'Định lí: Nếu a ∥ b và c ⊥ a thì c ⊥ b. Kết luận của định lí là gì?',
    'c ⊥ b',
    'Giả thiết: a ∥ b và c ⊥ a.\nKết luận: c ⊥ b.',
    ['c ⊥ b', 'a ∥ b', 'c ⊥ a'],
    {
      angle: 90,
      parallel: true,
      labels: { A1: '90°', B1: '?' },
      answers: { B1: '90°' },
    }
  ),
  q(
    'p1',
    'practice',
    'Qua M nằm ngoài a có bao nhiêu đường thẳng song song với a?',
    '1',
    'Theo tiên đề Euclid, qua M nằm ngoài a có duy nhất một đường thẳng song song với a.',
    [],
    { mode: 'euclid' }
  ),
  q(
    'p2',
    'practice',
    'Cho a ∥ b, A3 = 83°. Tính B1 (độ).',
    '83',
    'Vì a ∥ b nên A3 = B1 (hai góc so le trong).\nVậy B1 = 83°.',
    [],
    { parallel: true, labels: { A3: '83°', B1: '?' }, answers: { B1: '83°' } }
  ),
  q(
    'p3',
    'practice',
    'A4 = 121°, B1 = 59°. Hai đường thẳng a và b có song song không?',
    'Có',
    'A4 + B1 = 121° + 59° = 180°.\nĐây là hai góc trong cùng phía, nên a ∥ b.',
    ['Có', 'Không'],
    { labels: { A4: '121°', B1: '59°' } }
  ),
  q(
    'p4',
    'practice',
    'Cách nào chứng minh được một định lí?',
    'Lập luận từ giả thiết và các điều đúng đã biết',
    'Chứng minh phải có lập luận dẫn từ giả thiết đến kết luận. Đo một hình hay kiểm tra vài trường hợp không thay thế chứng minh.',
    [
      'Lập luận từ giả thiết và các điều đúng đã biết',
      'Đo một hình thấy đúng',
      'Kiểm tra ba hình thấy đúng',
    ]
  ),
];
for (const [id, prompt, answer, solution, options, figure] of [
  [
    'e1',
    'Trong hình, A2 và B2 là cặp góc nào?',
    'Đồng vị',
    'A2 và B2 ở cùng vị trí tương ứng tại hai giao điểm nên là hai góc đồng vị.',
    ['Đồng vị', 'So le trong', 'Kề bù'],
    {},
  ],
  [
    'e2',
    'Trong hình, A3 và B2 là cặp góc nào?',
    'Trong cùng phía',
    'A3 và B2 nằm giữa a, b và cùng phía của c.',
    ['Trong cùng phía', 'So le trong', 'Đối đỉnh'],
    {},
  ],
  [
    'e3',
    'Hai đường thẳng phân biệt không cắt nhau trong cùng một mặt phẳng được gọi là gì?',
    'Song song',
    'Đó là hai đường thẳng song song, kí hiệu a ∥ b.',
    ['Song song', 'Vuông góc', 'Trùng nhau'],
    { parallel: true },
  ],
  [
    'e4',
    'M thuộc đường thẳng a. Có áp dụng phát biểu tiên đề Euclid về đường song song qua điểm ngoài a cho M không?',
    'Không',
    'Điều kiện M nằm ngoài a không được thỏa mãn. Không áp dụng phát biểu này cho M thuộc a.',
    ['Không', 'Có'],
    undefined,
  ],
  [
    'e5',
    'Tiên đề khác định lí ở điểm nào?',
    'Tiên đề được thừa nhận; định lí cần chứng minh',
    'Tiên đề là điều được thừa nhận. Định lí được suy ra bằng lập luận từ những điều đúng đã biết.',
    [
      'Tiên đề được thừa nhận; định lí cần chứng minh',
      'Cả hai chỉ cần đo hình',
      'Định lí luôn là một phép tính',
    ],
    undefined,
  ],
] as [string, string, string, string, string[], ParallelFigure | undefined][]) {
  exercises.push(
    q(id, 'extra', prompt, answer, solution, options, figure, {
      task: 'Nhận biết và tiên đề Euclid',
      group: 'foundation',
      difficulty: 'easy',
    })
  );
}
for (const [id, given, target, value, supplement, reason] of [
  ['n1', 'A1', 'B1', 64, false, 'đồng vị'],
  ['n2', 'A3', 'B1', 76, false, 'so le trong'],
  ['n3', 'A4', 'B1', 112, true, 'trong cùng phía'],
  ['n4', 'A1', 'B2', 57, true, 'kề bù tại B sau khi dùng góc đồng vị'],
  ['n5', 'A2', 'B4', 125, false, 'đồng vị rồi đối đỉnh'],
] as [string, string, string, number, boolean, string][]) {
  const answer = supplement ? 180 - value : value;
  exercises.push(
    q(
      id,
      'extra',
      `Cho a ∥ b, ${given} = ${value}°. Tính ${target} (độ).`,
      String(answer),
      `Vì a ∥ b, dùng quan hệ ${reason}.\n${id === 'n4' ? `B1 = A1 = ${value}°; B1 + B2 = 180°.\n` : id === 'n5' ? `B2 = A2 = ${value}°; B4 = B2 (đối đỉnh).\n` : ''}${target} = ${supplement ? `180° − ${value}° = ` : ''}${answer}°.\nVậy ${target} = ${answer}°.`,
      [],
      {
        parallel: true,
        labels: { [given]: `${value}°`, [target]: '?' },
        answers: { [target]: `${answer}°` },
      }
    )
  );
}
exercises.push(
  q(
    'd1',
    'extra',
    'Biết A1 = B1 = 69°. Có thể kết luận a ∥ b không?',
    'Có',
    'A1 và B1 là hai góc đồng vị bằng nhau, nên a ∥ b.',
    ['Có', 'Không'],
    { labels: { A1: '69°', B1: '69°' } }
  ),
  q(
    'd2',
    'extra',
    'Biết A3 = 71°, B1 = 74°. a và b có song song không?',
    'Không',
    'Nếu a ∥ b thì A3 = B1 (so le trong). Nhưng 71° ≠ 74°, nên a và b không song song.',
    ['Có', 'Không'],
    { labels: { A3: '71°', B1: '74°' } }
  ),
  q(
    'd3',
    'extra',
    'Chỉ biết A1 = A3. Có đủ cơ sở kết luận a ∥ b không?',
    'Không',
    'A1 và A3 là hai góc đối đỉnh tại A, luôn bằng nhau. Điều này không cho biết quan hệ giữa a và b.',
    ['Có', 'Không'],
    { labels: { A1: 'α', A3: 'α' } }
  ),
  q(
    'h1',
    'extra',
    'Cho a ∥ b, A4 = 2x°, B1 = (x + 30)°. Tìm x.',
    '50',
    'Vì a ∥ b, A4 và B1 là hai góc trong cùng phía bù nhau.\n2x + x + 30 = 180\n3x = 150\nx = 50.\nKhi đó A4 = 100°, B1 = 80°, tổng bằng 180°.',
    [],
    {
      parallel: true,
      labels: { A4: '2x°', B1: '(x + 30)°' },
      answers: { A4: '100°', B1: '80°' },
    },
    { task: 'Lập luận và chứng minh', group: 'challenge', difficulty: 'hard' }
  ),
  q(
    'h2',
    'extra',
    'Cho a ∥ b, A3 = (3x − 10)°, B1 = (x + 40)°. Tìm x.',
    '25',
    'Vì a ∥ b nên hai góc so le trong bằng nhau.\n3x − 10 = x + 40\n2x = 50\nx = 25.\nHai góc đều bằng 65°.',
    [],
    {
      parallel: true,
      labels: { A3: '(3x − 10)°', B1: '(x + 40)°' },
      answers: { A3: '65°', B1: '65°' },
    },
    { task: 'Lập luận và chứng minh', group: 'challenge', difficulty: 'hard' }
  )
);
for (const [id, prompt, solution, figure] of [
  [
    'w1',
    'Cho a ∥ b, c ⊥ a. Chứng minh c ⊥ b.',
    'Giả thiết: a ∥ b, c ⊥ a.\nKết luận: c ⊥ b.\nGọi A, B lần lượt là giao điểm của c với a, b.\nVì c ⊥ a nên A1 = 90°.\nVì a ∥ b nên B1 = A1 = 90° (hai góc đồng vị).\nVậy c ⊥ b.',
    {
      angle: 90,
      parallel: true,
      labels: { A1: '90°', B1: '?' },
      answers: { B1: '90°' },
    },
  ],
  [
    'w2',
    'Hai đường thẳng phân biệt a, b cùng vuông góc với c. Chứng minh a ∥ b.',
    'Giả thiết: a ≠ b, a ⊥ c, b ⊥ c.\nKết luận: a ∥ b.\nGọi A, B là giao điểm của c với a, b.\nTa có A1 = B1 = 90° do giả thiết vuông góc.\nĐây là hai góc đồng vị bằng nhau, nên a ∥ b.',
    { angle: 90, labels: { A1: '90°', B1: '90°' } },
  ],
  [
    'w3',
    'Hai đường thẳng phân biệt a, b cùng song song với d. Chứng minh a ∥ b bằng tiên đề Euclid.',
    'Giả thiết: a ≠ b, a ∥ d, b ∥ d.\nKết luận: a ∥ b.\nGiả sử a và b cắt nhau tại M. Vì a ∥ d nên M không thuộc d.\nQua M có hai đường thẳng phân biệt a và b cùng song song với d, trái với tiên đề Euclid.\nVậy a và b không cắt nhau, tức a ∥ b.',
    undefined,
  ],
  [
    'w4',
    'A4 và B1 là hai góc trong cùng phía, A4 + B1 = 180°. Chứng minh a ∥ b bằng dấu hiệu góc đồng vị.',
    'Giả thiết: A4 + B1 = 180°.\nKết luận: a ∥ b.\nA1 + A4 = 180° vì hai góc kề bù.\nSuy ra A1 = 180° − A4 = B1.\nA1 và B1 là hai góc đồng vị bằng nhau.\nVậy a ∥ b.',
    { labels: { A4: 'α', B1: '180° − α' } },
  ],
] as [string, string, string, ParallelFigure | undefined][]) {
  exercises.push(
    q(
      id,
      'extra',
      prompt,
      'Xem kết luận trong bài giải.',
      solution,
      [],
      figure,
      {
        kind: 'written',
        task: 'Lập luận và chứng minh',
        group: 'challenge',
        difficulty: 'hard',
        workspace: 'large',
        criteria: [
          'Nêu đúng giả thiết và kết luận.',
          'Mỗi suy luận có căn cứ phù hợp.',
          'Kết luận đúng điều cần chứng minh.',
        ],
      }
    )
  );
}
export const parallelLesson: MathLessonData = {
  id: 'math-parallel-lines-7',
  title: 'Hai đường thẳng song song',
  grade: 7,
  semester: '1',
  topic: 'Hình học',
  interactiveLab: 'parallel',
  goal: 'Nhận biết các cặp góc; vận dụng tiên đề Euclid, tính chất và dấu hiệu song song; xác định giả thiết, kết luận và trình bày chứng minh.',
  textbook:
    'Nội dung tự biên soạn, đối chiếu Toán 7 tập 1: Kết nối tri thức, Bài 9–11; Cánh Diều, Hai đường thẳng song song.',
  teacherNotes:
    'Phân biệt tính chất (đã biết song song) với dấu hiệu (cần chứng minh song song). Tiên đề Euclid được thừa nhận, không yêu cầu chứng minh. Đo hoặc kéo hình chỉ giúp khám phá, không thay thế chứng minh. Các bài chứng minh tự luận dùng bảng tiêu chí tự đối chiếu, không tự chấm văn bản.',
  knowledgeSummary:
    'Hai đường thẳng phân biệt trong một mặt phẳng không cắt nhau là hai đường thẳng song song, kí hiệu a ∥ b.\nKhi c cắt a tại A và b tại B: đồng vị ở vị trí tương ứng; so le trong ở giữa a, b và khác phía c; trong cùng phía ở giữa a, b và cùng phía c.\nTiên đề Euclid: qua một điểm nằm ngoài một đường thẳng có duy nhất một đường thẳng song song với đường thẳng đó.\nNếu a ∥ b thì các góc đồng vị bằng nhau, các góc so le trong bằng nhau, các góc trong cùng phía bù nhau. Ngược lại, mỗi điều kiện góc này là một dấu hiệu nhận biết song song.\nHai đường thẳng phân biệt cùng vuông góc với một đường thẳng thì song song. Một đường thẳng vuông góc với một trong hai đường thẳng song song cũng vuông góc với đường còn lại. Hai đường thẳng phân biệt cùng song song với đường thứ ba thì song song với nhau.\nĐịnh lí được suy ra từ những điều đúng đã biết. Giả thiết là điều đã cho; kết luận là điều phải chứng minh. Trình bày: giả thiết, kết luận, lập luận có lí do, rồi kết luận. Ví dụ: a ∥ b, A1 = 70° thì B1 = 70° (đồng vị); B2 = 180° − 70° = 110° (kề bù).\nLưu ý: Đo hình hoặc kiểm tra vài trường hợp không phải là chứng minh.',
  blocks: [
    b(
      'pre',
      'foundation',
      'Ôn góc đối đỉnh và kề bù',
      'Hai đường thẳng a và c cắt nhau tại O. Góc 1 và góc 3 đối đỉnh nên bằng nhau. Góc 1 và góc 2 kề bù nên có tổng 180°. Ta sẽ dùng hai tính chất này khi học về đường thẳng song song.',
      { mode: 'intersection' }
    ),
    b(
      'definition',
      'explore',
      'Thế nào là hai đường thẳng song song?',
      'Hai đường thẳng phân biệt trong cùng một mặt phẳng, không cắt nhau, được gọi là hai đường thẳng song song. Kí hiệu: a ∥ b. Hai đường thẳng kéo dài vô hạn: không thấy giao điểm trên hình chưa đủ kết luận song song. Cần dựa vào điều đã cho hoặc dấu hiệu nhận biết.',
      { mode: 'parallel-lines' }
    ),
    b(
      'positions',
      'explore',
      'Nhận biết vị trí trước khi tính',
      'Trong hình: A1 và B1 đồng vị; A3 và B1 so le trong; A4 và B1 trong cùng phía. Tên cặp góc chỉ vị trí, chưa khẳng định số đo bằng nhau.',
      {}
    ),
    b(
      'euclid',
      'explore',
      'Tiên đề Euclid',
      'Qua M nằm ngoài a có duy nhất một đường thẳng b song song với a. Đây là một tiên đề được thừa nhận. Kéo hình giúp quan sát, không phải chứng minh tiên đề.',
      { mode: 'euclid' }
    ),
    b(
      'properties',
      'explore',
      'Tính chất và dấu hiệu nhận biết',
      'Đã biết a ∥ b: dùng các góc đồng vị hoặc so le trong bằng nhau; hai góc trong cùng phía có tổng 180°.\nMuốn chứng minh a ∥ b: chỉ cần tìm một cặp đồng vị bằng nhau, một cặp so le trong bằng nhau hoặc một cặp trong cùng phía bù nhau.',
      standard
    ),
    b(
      'theorem',
      'explore',
      'Định lí, giả thiết, kết luận',
      'Định lí là khẳng định được suy ra từ những điều đúng đã biết.\nVí dụ: Nếu a ∥ b và c ⊥ a thì c ⊥ b.\nGiả thiết: a ∥ b, c ⊥ a. Kết luận: c ⊥ b.\nChứng minh cần nêu lí do cho mỗi bước, không chỉ viết “nhìn hình thấy đúng”.',
      { angle: 90, parallel: true, labels: { A1: '90°', B1: '?' } }
    ),
    b(
      'ex1',
      'example',
      'Ví dụ 1: tính góc khi biết song song',
      'Cho a ∥ b, A1 = 67°. Tính B1 và B2.\nBài giải\nVì a ∥ b nên B1 = A1 = 67° (đồng vị).\nVì B1 và B2 kề bù nên B2 = 180° − 67° = 113°.\nVậy B1 = 67°, B2 = 113°.',
      { parallel: true, labels: { A1: '67°', B1: '67°', B2: '113°' } }
    ),
    b(
      'ex2',
      'example',
      'Ví dụ 2: chứng minh song song',
      'Biết A3 = B1 = 62°. Chứng minh a ∥ b.\nBài giải\nGiả thiết: c cắt a, b; A3 = B1 = 62°.\nKết luận: a ∥ b.\nA3 và B1 là hai góc so le trong bằng nhau.\nTheo dấu hiệu nhận biết, a ∥ b.',
      { labels: { A3: '62°', B1: '62°' } }
    ),
    b(
      'ex3',
      'example',
      'Ví dụ 3: chứng minh một định lí',
      'Chứng minh: Nếu a ∥ b và c ⊥ a thì c ⊥ b.\nBài giải\nGiả thiết: a ∥ b, c ⊥ a. Kết luận: c ⊥ b.\nGọi A, B là giao điểm của c với a, b.\nA1 = 90° vì c ⊥ a.\nB1 = A1 = 90° vì a ∥ b và đây là hai góc đồng vị.\nVậy c ⊥ b.',
      { angle: 90, parallel: true, labels: { A1: '90°', B1: '90°' } }
    ),
    b(
      'ex4',
      'example',
      'Ví dụ 4: dùng tiên đề Euclid để lập luận',
      'Hai đường thẳng phân biệt a, b cùng song song với d. Chứng minh a ∥ b.\nBài giải\nGiả sử a, b cắt nhau tại M. Vì a ∥ d nên M nằm ngoài d. Khi đó qua M có hai đường thẳng phân biệt cùng song song với d, trái với tiên đề Euclid.\nVậy a, b không cắt nhau, suy ra a ∥ b.'
    ),
    b(
      'guide',
      'guided',
      'Chọn đúng hướng suy luận',
      'Bước 1: đọc điều đã cho. Bước 2: xác định vị trí cặp góc. Bước 3: chọn tính chất hoặc dấu hiệu. Bước 4: viết kết quả kèm lí do.'
    ),
  ],
  exercises,
};
parallelFigures['parallel-w3'] = { mode: 'triple' };
parallelFigures['parallel-ex4'] = { mode: 'triple' };

export function parallelFigureFor(item: MathExercise | MathBlock) {
  const source = [...parallelLesson.blocks, ...parallelLesson.exercises].find(
    (s) => s.id === item.id
  );
  if (!source) return null;
  if (
    'prompt' in item &&
    (!('prompt' in source) ||
      item.prompt !== source.prompt ||
      item.answer !== source.answer)
  )
    return null;
  if ('text' in item && (!('text' in source) || item.text !== source.text))
    return null;
  return parallelFigures[item.id] ?? null;
}
