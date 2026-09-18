export const SKILLS = ['listening', 'speaking', 'writing', 'reading'] as const;
export type Skill = (typeof SKILLS)[number];
export const KINDS = [
  'dictation',
  'repeat',
  'word-order',
  'gap-fill',
  'correction',
  'comprehension',
  'read-aloud',
] as const;
export type Kind = (typeof KINDS)[number];
export const KIND_SKILL: Record<Kind, Skill> = {
  dictation: 'listening',
  repeat: 'speaking',
  'word-order': 'writing',
  'gap-fill': 'writing',
  correction: 'writing',
  comprehension: 'reading',
  'read-aloud': 'reading',
};
export type Activity = {
  id: string;
  kind: Kind;
  prompt: string;
  text: string;
  answers: string[];
  explanation: string;
  tier?: 'core' | 'extra';
};
export const NOTE_LABELS = {
  beforeYouStart: 'Before you start',
  quickCheck: 'Quick check',
  grammar: 'Grammar & sentence patterns',
  phrases: 'Common phrases',
  pronunciation: 'Pronunciation tips',
  pronunciationModel: 'Pronunciation model (English)',
  mistakes: 'Common mistakes',
  dialogue: 'Model conversation',
} as const;
export type LessonNotes = Partial<Record<keyof typeof NOTE_LABELS, string>>;
export type Lesson = {
  id: string;
  title: string;
  topic: string;
  level: string;
  goal: string;
  vocabulary: {
    word: string;
    meaning: string;
    example: string;
    pronunciations?: Partial<
      Record<'UK' | 'US' | 'IPA', { ipa: string; source: string }>
    >;
  }[];
  activities: Activity[];
  notes?: LessonNotes;
  teacherNotes?: string;
  challenge?: string;
  revision?: number;
  reviewLesson?: { title: string; token: string };
};
export const LESSON_VERSION = 2;
export type LessonPack = { version: 2; lessons: Lesson[] };
export type Attempt = {
  id: string;
  lessonId: string;
  activityId: string;
  fingerprint: string;
  skill: Skill;
  score: number;
  at: string;
  assisted: boolean;
  source: 'typed' | 'speech';
};
export const uid = () => crypto.randomUUID();
export const fingerprint = (activity: Activity) => {
  const { tier, ...scoredContent } = activity;
  void tier;
  return JSON.stringify(scoredContent);
};
export const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[’‘]/g, "'")
    .replace(/[^\p{L}\p{N}'\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
export type WordChange = {
  kind: 'correct' | 'missing' | 'extra' | 'changed';
  expected?: string;
  actual?: string;
};

/** Word edit distance penalizes omitted, substituted, and extra words equally. */
export function scoreAnswer(answer: string, accepted: string[]) {
  const actual = normalize(answer).slice(0, 500);
  const results = accepted.map((reference) => {
    const expected = normalize(reference).slice(0, 500);
    const dp = Array.from({ length: expected.length + 1 }, () =>
      Array<number>(actual.length + 1).fill(0)
    );
    for (let i = 0; i <= expected.length; i++) dp[i][0] = i;
    for (let j = 0; j <= actual.length; j++) dp[0][j] = j;
    for (let i = 1; i <= expected.length; i++)
      for (let j = 1; j <= actual.length; j++) {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + (expected[i - 1] === actual[j - 1] ? 0 : 1)
        );
      }
    let i = expected.length,
      j = actual.length;
    const changes: WordChange[] = [];
    while (i || j) {
      if (
        i &&
        j &&
        dp[i][j] ===
          dp[i - 1][j - 1] + (expected[i - 1] === actual[j - 1] ? 0 : 1)
      ) {
        changes.unshift({
          kind: expected[i - 1] === actual[j - 1] ? 'correct' : 'changed',
          expected: expected[--i],
          actual: actual[--j],
        });
      } else if (i && dp[i][j] === dp[i - 1][j] + 1)
        changes.unshift({ kind: 'missing', expected: expected[--i] });
      else changes.unshift({ kind: 'extra', actual: actual[--j] });
    }
    return {
      score: expected.length
        ? Math.max(
            0,
            Math.round(
              100 * (1 - dp[expected.length][actual.length] / expected.length)
            )
          )
        : 0,
      reference,
      changes,
    };
  });
  return results.sort((a, b) => b.score - a.score)[0];
}

export function parseLessonPack(value: unknown): LessonPack {
  const obj = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === 'object' && !Array.isArray(v);
  const text = (
    v: unknown,
    name: string,
    max = 2000,
    optional = false
  ): string => {
    if (typeof v !== 'string' || v.length > max || (!optional && !v.trim()))
      throw new Error(
        `${name} must be ${optional ? 'text' : 'non-empty text'} (up to ${max} characters).`
      );
    return v.trim();
  };
  if (
    !obj(value) ||
    ![1, LESSON_VERSION].includes(value.version as number) ||
    !Array.isArray(value.lessons) ||
    !value.lessons.length ||
    value.lessons.length > 100
  )
    throw new Error(
      'Use a version 1 or 2 lesson file containing 1–100 lessons.'
    );
  const lessonIds = new Set<string>();
  const lessons = value.lessons.map((raw, index): Lesson => {
    const context = `Lesson ${index + 1}`;
    if (!obj(raw)) throw new Error(`${context} is invalid.`);
    const id = text(raw.id, `${context} ID`, 100);
    if (lessonIds.has(id)) throw new Error('Lesson IDs must be unique.');
    lessonIds.add(id);
    if (!Array.isArray(raw.vocabulary) || raw.vocabulary.length > 100)
      throw new Error(
        `${context}: vocabulary must be a list of up to 100 words.`
      );
    if (
      !Array.isArray(raw.activities) ||
      !raw.activities.length ||
      raw.activities.length > 100
    )
      throw new Error(`${context}: add 1–100 activities.`);
    const activityIds = new Set<string>();
    const fields: Partial<Lesson> = {};
    for (const key of ['teacherNotes', 'challenge'] as const) {
      if (raw[key] !== undefined) fields[key] = text(raw[key], key, 4000, true);
    }
    if (raw.reviewLesson !== undefined) {
      const review = raw.reviewLesson;
      if (!review || typeof review !== 'object' || Array.isArray(review))
        throw new Error(`${context}: invalid review lesson.`);
      const data = review as Record<string, unknown>;
      const token = text(data.token, 'Review lesson token', 16000);
      if (!/^v1\.[A-Za-z0-9_-]+$/.test(token))
        throw new Error(`${context}: invalid review lesson link.`);
      fields.reviewLesson = {
        title: text(data.title, 'Review lesson title', 120),
        token,
      };
    }
    if (raw.revision !== undefined) {
      if (!Number.isSafeInteger(raw.revision) || (raw.revision as number) < 1)
        throw new Error(`${context}: revision must be a positive integer.`);
      fields.revision = raw.revision as number;
    }
    let goal = text(raw.goal, 'Goal', 500);
    // Migrate the legacy Week 1 challenge embedded in the learning goal.
    if (
      value.version === 1 &&
      !fields.challenge &&
      goal.includes('Family challenge:')
    ) {
      const split = goal.indexOf('Family challenge:');
      fields.challenge = goal.slice(split + 'Family challenge:'.length).trim();
      goal = goal.slice(0, split).trim() || 'Practise English.';
    }
    let notes: LessonNotes | undefined;
    if (raw.notes !== undefined) {
      if (!obj(raw.notes)) throw new Error(`${context}: invalid lesson notes.`);
      notes = {};
      for (const key of Object.keys(NOTE_LABELS) as (keyof LessonNotes)[]) {
        if (raw.notes[key] !== undefined) {
          const value = text(
            raw.notes[key],
            `${context} ${NOTE_LABELS[key]}`,
            4000,
            true
          );
          if (value) notes[key] = value;
        }
      }
    }
    return {
      id,
      ...fields,
      ...(notes && Object.keys(notes).length ? { notes } : {}),
      title: text(raw.title, `${context} title`, 120),
      topic: text(raw.topic, 'Topic', 120),
      level: text(raw.level, 'Level', 20),
      goal,
      vocabulary: raw.vocabulary.map((v) => {
        if (!obj(v)) throw new Error('Invalid vocabulary entry.');
        const pronunciations: NonNullable<
          Lesson['vocabulary'][number]['pronunciations']
        > = {};
        if (v.pronunciations !== undefined) {
          if (!obj(v.pronunciations))
            throw new Error('Invalid pronunciations.');
          for (const accent of ['UK', 'US', 'IPA'] as const) {
            const entry = v.pronunciations[accent];
            if (entry === undefined) continue;
            if (!obj(entry)) throw new Error('Invalid pronunciation entry.');
            const ipa = text(entry.ipa, 'IPA', 120);
            const source = text(entry.source, 'Pronunciation source', 500);
            let url: URL;
            try {
              url = new URL(source);
            } catch {
              throw new Error('Invalid pronunciation source.');
            }
            if (url.protocol !== 'https:' || url.username || url.password)
              throw new Error('Pronunciation source must use HTTPS.');
            pronunciations[accent] = { ipa, source };
          }
        }
        return {
          ...(Object.keys(pronunciations).length ? { pronunciations } : {}),
          word: text(v.word, 'Word', 100),
          meaning: text(v.meaning, 'Meaning', 300),
          example: text(v.example, 'Example', 500, true),
        };
      }),
      activities: raw.activities.map((a): Activity => {
        if (!obj(a) || !KINDS.includes(a.kind as Kind))
          throw new Error(`${context}: unknown activity type.`);
        const aid = text(a.id, 'Activity ID', 100);
        if (activityIds.has(aid))
          throw new Error(`${context}: activity IDs must be unique.`);
        activityIds.add(aid);
        if (
          !Array.isArray(a.answers) ||
          !a.answers.length ||
          a.answers.length > 10
        )
          throw new Error('Each activity needs 1–10 accepted answers.');
        const answers = a.answers.map((v) => text(v, 'Answer'));
        if (
          answers.some((v) => !normalize(v).length || normalize(v).length > 200)
        )
          throw new Error('Answers must contain 1–200 words.');
        const kind = a.kind as Kind;
        const passage = text(
          a.text,
          'Source text',
          4000,
          !['dictation', 'repeat', 'read-aloud', 'comprehension'].includes(kind)
        );
        if (
          ['dictation', 'repeat', 'read-aloud'].includes(kind) &&
          !answers.some(
            (v) => normalize(v).join(' ') === normalize(passage).join(' ')
          )
        )
          throw new Error(
            'For audio activities, one accepted answer must match the source text.'
          );
        if (kind === 'word-order' && normalize(answers[0]).length > 30)
          throw new Error('Word-order activities support up to 30 words.');
        if (
          a.tier !== undefined &&
          !['core', 'extra'].includes(a.tier as string)
        )
          throw new Error('Practice section must be core or extra.');
        return {
          id: aid,
          kind,
          prompt: text(a.prompt, 'Prompt', 1000),
          text: passage,
          answers,
          explanation: text(a.explanation, 'Explanation', 1000, true),
          ...(a.tier === 'extra' ? { tier: 'extra' as const } : {}),
        };
      }),
    };
  });
  return { version: LESSON_VERSION, lessons };
}

export function validAttempts(value: unknown): Attempt[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (a): a is Attempt =>
        !!a &&
        typeof a === 'object' &&
        ['id', 'lessonId', 'activityId', 'fingerprint', 'at'].every(
          (k) => typeof a[k] === 'string'
        ) &&
        Number.isFinite(Date.parse(a.at)) &&
        SKILLS.includes(a.skill) &&
        typeof a.assisted === 'boolean' &&
        ['typed', 'speech'].includes(a.source) &&
        Number.isFinite(a.score) &&
        a.score >= 0 &&
        a.score <= 100
    )
    .slice(-2000);
}

export const starterLessons: Lesson[] = [
  {
    id: 'hello-name',
    title: 'Hello, nice to meet you',
    topic: 'Introductions & me',
    level: 'A1',
    goal: 'Introduce yourself and ask someone their name.',
    vocabulary: [
      { word: 'hello', meaning: 'xin chào', example: 'Hello! My name is Mai.' },
      { word: 'meet', meaning: 'gặp gỡ', example: 'Nice to meet you.' },
      { word: 'friend', meaning: 'bạn bè', example: 'This is my friend, Tom.' },
      {
        word: 'morning',
        meaning: 'buổi sáng',
        example: 'Good morning, everyone.',
      },
    ],
    activities: [
      {
        id: 'hello-listen',
        kind: 'dictation',
        prompt: 'Listen, then write the sentence you hear.',
        text: 'Hello, my name is Mai. Nice to meet you.',
        answers: ['Hello, my name is Mai. Nice to meet you.'],
        explanation: 'Use “My name is…” to introduce yourself.',
      },
      {
        id: 'hello-speak',
        kind: 'repeat',
        prompt:
          'Listen to the model, then record yourself saying the same sentence.',
        text: 'Good morning. How are you today?',
        answers: ['Good morning. How are you today?'],
        explanation: 'Try saying “How are you” as one natural phrase.',
      },
      {
        id: 'hello-order',
        kind: 'word-order',
        prompt: 'Arrange the words to introduce yourself.',
        text: '',
        answers: ['My name is Mai'],
        explanation: 'Use this order: My name + is + your name.',
      },
      {
        id: 'hello-gap',
        kind: 'gap-fill',
        prompt: 'Fill in the missing word: Nice to ___ you.',
        text: '',
        answers: ['meet'],
        explanation:
          '“Nice to meet you” is a greeting when you meet someone for the first time.',
      },
      {
        id: 'hello-grammar',
        kind: 'correction',
        prompt: 'Correct this sentence: She are my friend.',
        text: '',
        answers: ['She is my friend'],
        explanation: 'Use “is” with he, she, and it.',
      },
      {
        id: 'hello-read',
        kind: 'comprehension',
        prompt: 'What is the name of Mai’s friend? Write the name.',
        text: 'Hello! My name is Mai. I live in Hanoi. This is my friend Tom. We are students. We like playing chess after school.',
        answers: ['Tom'],
        explanation: 'The passage says, “This is my friend Tom.”',
      },
      {
        id: 'hello-aloud',
        kind: 'read-aloud',
        prompt:
          'Read this introduction aloud. Then compare your recording with the model.',
        text: 'My name is Mai. I live in Hanoi. I like playing chess.',
        answers: ['My name is Mai. I live in Hanoi. I like playing chess.'],
        explanation: 'Pause briefly at the end of each sentence.',
      },
    ],
  },
  {
    id: 'family-home',
    title: 'My family, my home',
    topic: 'Family & people',
    level: 'A1',
    goal: 'Talk about your family and where you live.',
    vocabulary: [
      {
        word: 'sister',
        meaning: 'chị / em gái',
        example: 'I have one sister.',
      },
      { word: 'parents', meaning: 'bố mẹ', example: 'I live with my parents.' },
      { word: 'house', meaning: 'ngôi nhà', example: 'Our house is small.' },
    ],
    activities: [
      {
        id: 'family-listen',
        kind: 'dictation',
        prompt: 'Listen and write the sentence.',
        text: 'I live with my parents and my sister.',
        answers: ['I live with my parents and my sister.'],
        explanation: '“Live with” tells us who shares your home.',
      },
      {
        id: 'family-speak',
        kind: 'repeat',
        prompt: 'Record yourself saying this sentence.',
        text: 'There are four people in my family.',
        answers: ['There are four people in my family.'],
        explanation: 'Use “There are” when talking about more than one person.',
      },
      {
        id: 'family-order',
        kind: 'word-order',
        prompt: 'Put the words in order.',
        text: '',
        answers: ['I have one younger sister'],
        explanation: '“Younger” comes before “sister”.',
      },
      {
        id: 'family-grammar',
        kind: 'correction',
        prompt: 'Correct this sentence: He live in a small house.',
        text: '',
        answers: ['He lives in a small house'],
        explanation:
          'Add -s to the verb with he, she, and it in the present simple.',
      },
      {
        id: 'family-read',
        kind: 'comprehension',
        prompt: 'How many sisters does Linh have? Write a number or word.',
        text: 'My name is Linh. There are four people in my family: my parents, my sister, and me. My sister is younger than me. We live in a small house.',
        answers: ['one', '1'],
        explanation: 'Linh mentions one sister.',
      },
      {
        id: 'family-aloud',
        kind: 'read-aloud',
        prompt: 'Read the sentences aloud.',
        text: 'This is my family. We live in a small house.',
        answers: ['This is my family. We live in a small house.'],
        explanation: 'Keep the words connected within each sentence.',
      },
    ],
  },
];
