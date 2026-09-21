import { MathLessonData } from './lessons';
import { primaryFractionLessons } from './primary-fraction-lessons';
import { fractionLessons } from './fraction-lessons';

const revisions = [
  {
    "id": "math-fraction-basics-6",
    "before": {
      "title": "Phân số: khái niệm, tính chất và rút gọn",
      "goal": "Nhận biết tử, mẫu; viết phân số bằng nhau và rút gọn.",
      "teacherNotes": "Học sau Số nguyên và Tính chia hết. Bài cộng hai phân số khác mẫu số nằm riêng trong thư viện."
    },
    "after": {
      "title": "Mở rộng phân số: số nguyên, tính chất và rút gọn",
      "goal": "Ôn kiến thức phân số tiểu học. Nhận biết tử, mẫu; viết phân số bằng nhau và rút gọn. Mở rộng với phân số có tử hoặc mẫu là số nguyên âm.",
      "teacherNotes": "Học sau Số nguyên và Tính chia hết. Phân số đã được học từ lớp 4; lớp 6 mở rộng sang tử, mẫu là số nguyên và bài toán tìm số ban đầu. Các câu cơ bản dùng để ôn tập."
    },
    "preId": "math-fraction-basics-6-pre",
    "beforePre": "Ôn phép tính với số nguyên, ước chung lớn nhất và bội chung nhỏ nhất. Khi viết phân số, mẫu số phải khác 0.",
    "afterPre": "Ở tiểu học, em đã học phân số với tử là số tự nhiên, mẫu là số tự nhiên khác 0. Bài này ôn lại kiến thức đó rồi mở rộng. Ôn phép tính với số nguyên; có thể dùng ƯCLN để rút gọn và BCNN để quy đồng."
  },
  {
    "id": "math-fraction-compare-6",
    "before": {
      "title": "Phân số: quy đồng và so sánh",
      "goal": "Quy đồng về mẫu lớn hơn 0 và so sánh các phân số.",
      "teacherNotes": "Học sau Số nguyên và Tính chia hết. Bài cộng hai phân số khác mẫu số nằm riêng trong thư viện."
    },
    "after": {
      "title": "Quy đồng và so sánh phân số có số âm",
      "goal": "Ôn kiến thức phân số tiểu học. Quy đồng về mẫu lớn hơn 0 và so sánh các phân số. Mở rộng với phân số có tử hoặc mẫu là số nguyên âm.",
      "teacherNotes": "Học sau Số nguyên và Tính chia hết. Phân số đã được học từ lớp 4; lớp 6 mở rộng sang tử, mẫu là số nguyên và bài toán tìm số ban đầu. Các câu cơ bản dùng để ôn tập."
    },
    "preId": "math-fraction-compare-6-pre",
    "beforePre": "Ôn phép tính với số nguyên, ước chung lớn nhất và bội chung nhỏ nhất. Khi viết phân số, mẫu số phải khác 0.",
    "afterPre": "Ở tiểu học, em đã học phân số với tử là số tự nhiên, mẫu là số tự nhiên khác 0. Bài này ôn lại kiến thức đó rồi mở rộng. Ôn phép tính với số nguyên; có thể dùng ƯCLN để rút gọn và BCNN để quy đồng."
  },
  {
    "id": "math-fraction-subtract-6",
    "before": {
      "title": "Phép trừ phân số",
      "goal": "Tìm số đối, trừ phân số và tìm thành phần chưa biết.",
      "teacherNotes": "Học sau Số nguyên và Tính chia hết. Bài cộng hai phân số khác mẫu số nằm riêng trong thư viện."
    },
    "after": {
      "title": "Phép trừ phân số và số đối",
      "goal": "Ôn kiến thức phân số tiểu học. Tìm số đối, trừ phân số và tìm thành phần chưa biết. Mở rộng với phân số có tử hoặc mẫu là số nguyên âm.",
      "teacherNotes": "Học sau Số nguyên và Tính chia hết. Phân số đã được học từ lớp 4; lớp 6 mở rộng sang tử, mẫu là số nguyên và bài toán tìm số ban đầu. Các câu cơ bản dùng để ôn tập."
    },
    "preId": "math-fraction-subtract-6-pre",
    "beforePre": "Ôn phép tính với số nguyên, ước chung lớn nhất và bội chung nhỏ nhất. Khi viết phân số, mẫu số phải khác 0.",
    "afterPre": "Ở tiểu học, em đã học phân số với tử là số tự nhiên, mẫu là số tự nhiên khác 0. Bài này ôn lại kiến thức đó rồi mở rộng. Ôn phép tính với số nguyên; có thể dùng ƯCLN để rút gọn và BCNN để quy đồng."
  },
  {
    "id": "math-fraction-multiply-6",
    "before": {
      "title": "Phép nhân và phép chia phân số",
      "goal": "Nhân, chia phân số; rút gọn các thừa số trước khi nhân.",
      "teacherNotes": "Học sau Số nguyên và Tính chia hết. Bài cộng hai phân số khác mẫu số nằm riêng trong thư viện."
    },
    "after": {
      "title": "Nhân và chia phân số có số âm",
      "goal": "Ôn kiến thức phân số tiểu học. Nhân, chia phân số; rút gọn các thừa số trước khi nhân. Mở rộng với phân số có tử hoặc mẫu là số nguyên âm.",
      "teacherNotes": "Học sau Số nguyên và Tính chia hết. Phân số đã được học từ lớp 4; lớp 6 mở rộng sang tử, mẫu là số nguyên và bài toán tìm số ban đầu. Các câu cơ bản dùng để ôn tập."
    },
    "preId": "math-fraction-multiply-6-pre",
    "beforePre": "Ôn phép tính với số nguyên, ước chung lớn nhất và bội chung nhỏ nhất. Khi viết phân số, mẫu số phải khác 0.",
    "afterPre": "Ở tiểu học, em đã học phân số với tử là số tự nhiên, mẫu là số tự nhiên khác 0. Bài này ôn lại kiến thức đó rồi mở rộng. Ôn phép tính với số nguyên; có thể dùng ƯCLN để rút gọn và BCNN để quy đồng."
  },
  {
    "id": "math-fraction-applications-6",
    "before": {
      "title": "Hai bài toán cơ bản về phân số",
      "goal": "Phân biệt tìm giá trị phân số của một số và tìm số khi biết giá trị phân số của nó.",
      "teacherNotes": "Học sau Số nguyên và Tính chia hết. Bài cộng hai phân số khác mẫu số nằm riêng trong thư viện."
    },
    "after": {
      "title": "Hai bài toán cơ bản về phân số",
      "goal": "Ôn kiến thức phân số tiểu học. Phân biệt tìm giá trị phân số của một số và tìm số khi biết giá trị phân số của nó.",
      "teacherNotes": "Học sau Số nguyên và Tính chia hết. Phân số đã được học từ lớp 4; lớp 6 mở rộng sang tử, mẫu là số nguyên và bài toán tìm số ban đầu. Các câu cơ bản dùng để ôn tập."
    },
    "preId": "math-fraction-applications-6-pre",
    "beforePre": "Ôn phép tính với số nguyên, ước chung lớn nhất và bội chung nhỏ nhất. Khi viết phân số, mẫu số phải khác 0.",
    "afterPre": "Ở tiểu học, em đã học phân số với tử là số tự nhiên, mẫu là số tự nhiên khác 0. Bài này ôn lại kiến thức đó rồi mở rộng. Ôn phép tính với số nguyên; có thể dùng ƯCLN để rút gọn và BCNN để quy đồng."
  }
] as const;

export function updateFractionLevels(lessons: MathLessonData[]) {
  const updated = lessons.map(lesson => {
    if (lesson.id === 'math-fractions-6') return {
      ...lesson,
      goal: lesson.goal === 'Hiểu vì sao cần quy đồng, cộng phân số và trình bày từng bước.' ? 'Ôn phép cộng phân số đã học ở tiểu học; luyện quy đồng các mẫu bất kì ở lớp 6.' : lesson.goal,
      exercises: lesson.exercises.map(e => e.id === 'f-common' && e.prompt === 'Số nhỏ nhất chia hết cho cả 2 và 3 là?' ? {...e, prompt: 'Số tự nhiên nhỏ nhất khác 0 chia hết cho cả 2 và 3 là?'} : e),
    };
    const revision = revisions.find(item => item.id === lesson.id);
    if (!revision) return lesson;
    const sample = fractionLessons.find(item => item.id === lesson.id)!;
    return {
      ...lesson,
      title: lesson.title === revision.before.title ? revision.after.title : lesson.title,
      goal: lesson.goal === revision.before.goal ? revision.after.goal : lesson.goal,
      teacherNotes: lesson.teacherNotes === revision.before.teacherNotes ? revision.after.teacherNotes : lesson.teacherNotes,
      blocks: lesson.blocks.map(block => {
        if (block.id === revision.preId && block.text === revision.beforePre) return {...block, text: revision.afterPre};
        if (block.id === 'math-fraction-basics-6-k0' && block.text === 'Phân số có dạng a/b với a, b là số nguyên và b khác 0. a là tử số, b là mẫu số. Mỗi số nguyên n có thể viết thành n/1.') return {...block, text: sample.blocks.find(b => b.id === block.id)!.text};
        return block;
      }),
    };
  });
  const missing = primaryFractionLessons.filter(sample => !updated.some(l => l.id === sample.id));
  return updated.length + missing.length <= 100 ? [...updated, ...structuredClone(missing)] : updated;
}


export function updateFractionNames(lessons: MathLessonData[]) {
  const titles: Record<string, string> = {
    'Quy đồng và so sánh phân số cơ bản': 'Quy đồng và so sánh phân số',
    'Cộng và trừ phân số cơ bản': 'Cộng và trừ phân số',
    'Nhân và chia phân số cơ bản': 'Nhân và chia phân số',
  };
  return lessons.map(lesson => {
    if (lesson.grade === 6 && lesson.topic === 'Phân số') return {...lesson, topic: 'Phân số mở rộng'};
    if (lesson.grade !== 4 || lesson.topic !== 'Phân số') return lesson;
    return {
      ...lesson,
      title: titles[lesson.title] ?? lesson.title,
      exercises: lesson.exercises.map(exercise => ({...exercise, ...(exercise.skill && titles[exercise.skill] ? {skill: titles[exercise.skill]} : {})})),
    };
  });
}
