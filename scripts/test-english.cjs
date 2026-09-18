const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const compiled = ts.transpileModule(
  fs.readFileSync(
    path.join(__dirname, '../src/lib/english/lessons.ts'),
    'utf8'
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }
).outputText;
const target = { exports: {} };
new Function('exports', 'module', 'crypto', compiled)(
  target.exports,
  target,
  require('node:crypto').webcrypto
);
const {
  scoreAnswer,
  parseLessonPack,
  starterLessons,
  validAttempts,
  fingerprint,
} = target.exports;
const pack = () =>
  JSON.parse(JSON.stringify({ version: 2, lessons: starterLessons }));

test('starter lessons round-trip through the portable JSON schema', () => {
  assert.deepEqual(parseLessonPack(JSON.parse(JSON.stringify(pack()))), pack());
});
test('matching ignores punctuation/case and accepts curated alternatives', () => {
  assert.equal(scoreAnswer('HELLO, Mai!', ['Hello Mai.']).score, 100);
  assert.equal(scoreAnswer('1', ['one', '1']).score, 100);
  assert.equal(scoreAnswer('I’m happy', ["I'm happy"]).score, 100);
});
test('missing, substituted, and extra words are visible and penalized', () => {
  let result = scoreAnswer('I a sister', ['I have a sister']);
  assert.equal(result.score, 75);
  assert.deepEqual(
    result.changes.filter((c) => c.kind === 'missing').map((c) => c.expected),
    ['have']
  );
  result = scoreAnswer('She are my friend', ['She is my friend']);
  assert.equal(result.score, 75);
  assert.equal(result.changes.find((c) => c.kind === 'changed').actual, 'are');
  result = scoreAnswer('I am very very very very happy', ['I am happy']);
  assert.equal(result.score, 0);
  assert.ok(result.changes.some((c) => c.kind === 'extra'));
  assert.equal(scoreAnswer('', ['I am happy']).score, 0);
});
test('word order and repeated tokens are meaningful', () => {
  assert.ok(scoreAnswer('Mai is name My', ['My name is Mai']).score < 100);
  assert.equal(scoreAnswer('very good', ['very very good']).score, 67);
});
test('imports reject unsupported versions, duplicate IDs, and invalid content', () => {
  for (const change of [
    (p) => {
      p.version = 99;
    },
    (p) => {
      p.lessons[1].id = p.lessons[0].id;
    },
    (p) => {
      p.lessons[0].activities[1].id = p.lessons[0].activities[0].id;
    },
    (p) => {
      p.lessons[0].activities[0].kind = 'execute-script';
    },
    (p) => {
      p.lessons[0].activities[0].answers = [];
    },
    (p) => {
      p.lessons[0].activities[0].answers = ['!!!'];
    },
    (p) => {
      p.lessons[0].activities[0].answers = ['different from the spoken source'];
    },
    (p) => {
      p.lessons[0].activities[0].text = '';
    },
    (p) => {
      p.lessons[0].title = 'a'.repeat(121);
    },
  ]) {
    const value = pack();
    change(value);
    assert.throws(() => parseLessonPack(value));
  }
});
test('lesson edits change the progress fingerprint', () => {
  const a = starterLessons[0].activities[0];
  assert.notEqual(
    fingerprint(a),
    fingerprint({ ...a, answers: ['new answer'] })
  );
});
test('corrupt stored scores do not enter progress summaries', () => {
  const good = {
    id: 'a',
    lessonId: 'hello-name',
    activityId: 'hello-listen',
    fingerprint: 'f',
    skill: 'listening',
    score: 75,
    at: '2026-09-15T00:00:00Z',
    assisted: false,
    source: 'typed',
  };
  assert.deepEqual(
    validAttempts([
      good,
      null,
      { ...good, score: 101 },
      { ...good, score: -1 },
      { ...good, at: 'invalid' },
      { ...good, source: 'invented' },
    ]),
    [good]
  );
});

const familyCompiled = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../src/lib/english/family.ts'), 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }
).outputText;
const familyTarget = { exports: {} };
new Function('exports', 'module', 'require', familyCompiled)(
  familyTarget.exports,
  familyTarget,
  () => target.exports
);
const { initialFamily, parseFamily, recordForLearner } = familyTarget.exports;
const familyAttempt = {
  id: 'a',
  lessonId: 'hello-name',
  activityId: 'hello-listen',
  fingerprint: 'f',
  skill: 'listening',
  score: 75,
  at: '2026-09-15T00:00:00Z',
  assisted: false,
  source: 'typed',
};

test('legacy results migrate to Me without changing the original data', () => {
  const legacy = [familyAttempt];
  const family = initialFamily(legacy);
  assert.deepEqual(family.profiles[0].attempts, legacy);
  assert.equal(family.activeProfileId, 'me');
  assert.deepEqual(legacy, [familyAttempt]);
});
test('recording and renaming preserve independent learner histories', () => {
  const family = initialFamily([familyAttempt]);
  family.profiles.push({ id: 'second', name: 'Second learner', attempts: [] });
  const next = recordForLearner(family, 'second', {
    ...familyAttempt,
    id: 'b',
    score: 100,
  });
  assert.deepEqual(next.profiles[0].attempts, [familyAttempt]);
  assert.equal(next.profiles[1].attempts[0].score, 100);
  assert.equal(family.profiles[1].attempts.length, 0);
  next.profiles[1].name = 'Renamed';
  assert.deepEqual(parseFamily(JSON.parse(JSON.stringify(next))), next);
  assert.throws(() => recordForLearner(next, 'missing', familyAttempt));
});
test('family storage validates identities and recovers a missing active selection', () => {
  const family = initialFamily([]);
  assert.equal(
    parseFamily({ ...family, activeProfileId: 'missing' }).activeProfileId,
    'me'
  );
  assert.throws(() =>
    parseFamily({
      ...family,
      profiles: [...family.profiles, ...family.profiles],
    })
  );
  assert.throws(() => parseFamily({ ...family, profiles: [] }));
});

const shareCompiled = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../src/lib/english/share.ts'), 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }
).outputText;
const shareTarget = { exports: {} };
new Function('exports', 'module', 'require', 'crypto', shareCompiled)(
  shareTarget.exports,
  shareTarget,
  () => target.exports,
  require('node:crypto').webcrypto
);
const { encodeSharedLesson, decodeSharedLesson, sharedLessonUrl } =
  shareTarget.exports;

test('shared links round-trip Unicode and contain only a frozen lesson copy', async () => {
  const draft = JSON.parse(JSON.stringify(starterLessons[0]));
  draft.profiles = [{ name: 'PRIVATE PROFILE' }];
  draft.attempts = [familyAttempt];
  const token = await encodeSharedLesson(draft);
  draft.title = 'Changed draft';
  const shared = await decodeSharedLesson(token);
  assert.deepEqual(shared, starterLessons[0]);
  assert.equal(shared.profiles, undefined);
  assert.equal(shared.attempts, undefined);
  const url = new URL(sharedLessonUrl('https://example.com', token));
  assert.equal(url.pathname, '/english-practice/learn');
  assert.equal(url.search, '');
  assert.equal(url.hash, '#lesson=' + token);
});
test('incomplete, unsupported, corrupt and oversized lesson links fail safely', async () => {
  for (const token of [
    '',
    'v2.abc',
    'v1.!!!',
    'v1.abc',
    'v1.' + 'a'.repeat(16001),
  ]) {
    await assert.rejects(decodeSharedLesson(token));
  }
  const { gzipSync } = require('node:zlib');
  const compressed = (value) => 'v1.' + gzipSync(value).toString('base64url');
  await assert.rejects(decodeSharedLesson(compressed('a'.repeat(256001))));
  await assert.rejects(decodeSharedLesson(compressed(JSON.stringify(pack()))));
  await assert.rejects(
    decodeSharedLesson(compressed('{"version":1,"lessons":[{}]}'))
  );
});

const voiceCompiled = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../src/lib/english/voices.ts'), 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }
).outputText;
const voiceTarget = { exports: {} };
new Function('exports', 'module', voiceCompiled)(
  voiceTarget.exports,
  voiceTarget
);
const { voiceKey, englishVoices, chooseVoice } = voiceTarget.exports;

test('voice choices retain distinct accents, filter other languages and fall back to English', () => {
  const us = {
    voiceURI: 'one',
    name: 'Voice A',
    lang: 'en-US',
    default: false,
  };
  const uk = { voiceURI: 'two', name: 'Voice B', lang: 'en-GB', default: true };
  const foreign = {
    voiceURI: 'three',
    name: 'Voice C',
    lang: 'vi-VN',
    default: true,
  };
  const voices = [foreign, us, uk, us];
  assert.equal(englishVoices(voices).length, 2);
  assert.equal(chooseVoice(voices, voiceKey(us)), us);
  assert.equal(chooseVoice(voices, 'unavailable'), uk);
  assert.equal(chooseVoice([foreign], ''), undefined);
  assert.equal(chooseVoice([], ''), undefined);
});
test('learner voice preferences persist independently without changing legacy profiles', () => {
  const family = initialFamily([familyAttempt]);
  family.profiles[0].voice = 'chosen-voice';
  family.profiles.push({
    id: 'second',
    name: 'Second',
    attempts: [],
    voice: 'other-voice',
  });
  const saved = parseFamily(JSON.parse(JSON.stringify(family)));
  assert.equal(saved.profiles[0].voice, 'chosen-voice');
  assert.equal(saved.profiles[1].voice, 'other-voice');
  assert.equal(
    recordForLearner(saved, 'me', familyAttempt).profiles[0].voice,
    'chosen-voice'
  );
  assert.equal(parseFamily(initialFamily([])).profiles[0].voice, undefined);
});

test('automatic voice prefers Google UK English Male while preserving explicit choices', () => {
  const device = {
    voiceURI: 'device',
    name: 'Daniel',
    lang: 'en-GB',
    default: true,
  };
  const male = {
    voiceURI: 'google-male',
    name: 'Google UK English Male',
    lang: 'en-GB',
    default: false,
  };
  const female = {
    voiceURI: 'google-female',
    name: 'Google UK English Female',
    lang: 'en-GB',
    default: false,
  };
  assert.equal(chooseVoice([device, female, male], ''), male);
  assert.equal(chooseVoice([device, female, male], voiceKey(female)), female);
  assert.equal(chooseVoice([device, female], ''), device);
});

const historyCompiled = ts.transpileModule(
  fs.readFileSync(
    path.join(__dirname, '../src/lib/english/shared-history.ts'),
    'utf8'
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }
).outputText;
const historyTarget = { exports: {} };
new Function('exports', 'module', historyCompiled)(
  historyTarget.exports,
  historyTarget
);
const { parseSharedHistory, rememberSharedLesson } = historyTarget.exports;
test('shared bookmarks update by share ID and store only bookmark metadata', () => {
  const first = {
    shareId: 'share-a',
    title: 'Original',
    link: '/english-practice/learn#lesson=v1.abc',
    lastOpened: '2026-09-16T00:00:00Z',
  };
  const other = { ...first, shareId: 'share-b' };
  const updated = {
    ...first,
    title: 'Updated',
    link: '/english-practice/learn#lesson=v1.def',
  };
  const list = rememberSharedLesson([other, first], updated);
  assert.equal(list.length, 2);
  assert.deepEqual(list[0], updated);
  assert.deepEqual(
    parseSharedHistory([{ ...updated, lesson: { secret: true } }]),
    [updated]
  );
  assert.throws(() =>
    parseSharedHistory([{ ...first, link: 'javascript:alert(1)' }])
  );
});
test('shared IDs survive lesson updates and legacy links decode consistently', async () => {
  const { decodeSharedSnapshot } = shareTarget.exports;
  const lesson = starterLessons[0];
  const original = await decodeSharedSnapshot(
    await encodeSharedLesson(lesson, 'teacher-unique-share')
  );
  const updated = await decodeSharedSnapshot(
    await encodeSharedLesson(
      { ...lesson, title: 'Updated title' },
      'teacher-unique-share'
    )
  );
  assert.equal(original.shareId, updated.shareId);
  const legacy = await encodeSharedLesson(lesson);
  assert.equal(
    (await decodeSharedSnapshot(legacy)).shareId,
    (await decodeSharedSnapshot(legacy)).shareId
  );
  assert.notEqual(
    (await decodeSharedSnapshot(legacy)).shareId,
    original.shareId
  );
});

const xlsx = require('xlsx');
const excelModule = { exports: {} };
new Function(
  'exports',
  'module',
  'require',
  ts.transpileModule(
    fs.readFileSync(
      path.join(__dirname, '../src/lib/english/excel-import.ts'),
      'utf8'
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }
  ).outputText
)(excelModule.exports, excelModule, (name) =>
  name === './lessons' ? target.exports : require(name)
);
const { importLessonWorkbook } = excelModule.exports;
const templateBytes = () =>
  fs.readFileSync(path.join(__dirname, 'fixtures/english-lessons-basic.xlsx'));
const editedTemplate = (edit, bookType = 'xlsx') => {
  const book = xlsx.read(templateBytes(), { type: 'buffer' });
  edit(book);
  return xlsx.write(book, { type: 'array', bookType });
};
test('Excel template imports every lesson with generated unique IDs and all activity types', () => {
  const lessons = importLessonWorkbook(templateBytes());
  assert.equal(lessons.length, 2);
  assert.equal(lessons[0].title, 'Hello, nice to meet you');
  assert.equal(lessons[1].title, 'Meet my family');
  assert.equal(lessons[0].vocabulary[0].meaning, 'xin chào');
  assert.equal(lessons[0].activities.length, 7);
  assert.deepEqual(
    lessons[0].activities.map((a) => a.kind),
    target.exports.KINDS
  );
  const ids = lessons.flatMap((l) => [l.id, ...l.activities.map((a) => a.id)]);
  assert.equal(new Set(ids).size, ids.length);
  const again = importLessonWorkbook(templateBytes());
  assert.ok(again.every((l) => !ids.includes(l.id)));
  assert.deepEqual(lessons[0].activities[0].answers, [
    'Hello. My name is Mai.',
  ]);
  assert.deepEqual(lessons[0].activities[2].answers, ['My name is Mai.']);
  assert.deepEqual(lessons[0].activities[5].answers, [
    'Hanoi',
    'She lives in Hanoi.',
  ]);
});
test('Excel import accepts a duplicated lesson tab, defaults and optional empty vocabulary', () => {
  const data = editedTemplate((book) => {
    const copy = structuredClone(book.Sheets['02 Family']);
    copy.B2.v = 'Third lesson';
    for (const cell of ['B3', 'B4', 'B5', 'A8', 'B8', 'C8', 'A9', 'B9', 'C9'])
      delete copy[cell];
    book.SheetNames.push('My third lesson');
    book.Sheets['My third lesson'] = copy;
  });
  const lessons = importLessonWorkbook(data);
  assert.equal(lessons.length, 3);
  assert.equal(lessons[2].title, 'Third lesson');
  assert.equal(lessons[2].level, 'A1');
  assert.equal(lessons[2].topic, 'General English');
  assert.deepEqual(lessons[2].vocabulary, []);
});
test('Excel import keeps exercise content when custom instructions are supplied', () => {
  const data = editedTemplate((book) => {
    book.Sheets['01 Hello'].C18 = { t: 's', v: 'Complete this greeting.' };
  });
  assert.equal(
    importLessonWorkbook(data)[0].activities[3].prompt,
    'Complete this greeting.\nNice to ___ you.'
  );
});
test('Excel import identifies missing answers, questions, and invalid activity rows', () => {
  for (const [cell, value, row, message] of [
    ['D18', '', 18, 'correct answer'],
    ['C20', '', 20, 'question'],
    ['A15', 'Unknown type', 15, 'dropdown'],
    ['B15', '', 15, 'Content'],
    ['D15', 'Wrong answer', 15, 'match the source text'],
  ]) {
    const data = editedTemplate((book) => {
      book.Sheets['01 Hello'][cell] = { t: 's', v: value };
    });
    assert.throws(
      () => importLessonWorkbook(data),
      (error) =>
        error.message.includes(`01 Hello, row ${row}:`) &&
        error.message.includes(message)
    );
  }
});
test('Excel import supports old XLS files and rejects oversized or unrelated tabs', () => {
  assert.equal(
    importLessonWorkbook(editedTemplate(() => {}, 'biff8')).length,
    2
  );
  for (const [cell, value] of [
    ['A1', 'Wrong layout'],
    ['F30', 'Extra column'],
    ['A1001', 'Too many rows'],
  ]) {
    const data = editedTemplate((book) => {
      xlsx.utils.sheet_add_aoa(book.Sheets['01 Hello'], [[value]], {
        origin: cell,
      });
    });
    assert.throws(() => importLessonWorkbook(data), /01 Hello:/);
  }
});

test('downloadable Week 1 workbook imports seven complete lessons with four-skill practice', () => {
  const lessons = importLessonWorkbook(
    fs.readFileSync(
      path.join(__dirname, '../public/templates/english-lessons.xlsx')
    )
  );
  assert.equal(lessons.length, 14);
  const week = lessons.filter((lesson) => lesson.title.startsWith('Day '));
  assert.equal(week.length, 7);
  assert.equal(
    week.reduce((n, l) => n + l.vocabulary.length, 0),
    133
  );
  assert.equal(
    week.reduce((n, l) => n + l.activities.length, 0),
    309
  );
  for (const [i, lesson] of week.entries()) {
    assert.ok(lesson.title.startsWith(`Day ${i + 1}`));
    assert.ok(lesson.challenge);
    assert.ok(!lesson.goal.includes('Family challenge:'));
    assert.equal(
      new Set(lesson.activities.map((a) => target.exports.KIND_SKILL[a.kind]))
        .size,
      4
    );
    for (const activity of lesson.activities) {
      assert.equal(
        scoreAnswer(activity.answers[0], activity.answers).score,
        100
      );
      if (['dictation', 'repeat', 'read-aloud'].includes(activity.kind)) {
        assert.ok(!activity.text.includes('___'));
        assert.equal(scoreAnswer(activity.text, activity.answers).score, 100);
      }
    }
  }
});

test('optional lesson notes round-trip through JSON and shared links without changing activities', async () => {
  const lesson = {
    ...starterLessons[0],
    notes: {
      grammar: 'I am + name.',
      dialogue: 'A: Hello.\nB: Hi.',
      pronunciationModel: 'Nice to meet you.',
      secret: 'discard',
    },
  };
  const cleaned = parseLessonPack({ version: 1, lessons: [lesson] }).lessons[0];
  assert.equal(cleaned.notes.grammar, 'I am + name.');
  assert.equal(cleaned.notes.secret, undefined);
  assert.deepEqual(cleaned.activities, starterLessons[0].activities);
  const shared = await shareTarget.exports.decodeSharedSnapshot(
    await encodeSharedLesson(cleaned)
  );
  assert.deepEqual(shared.lesson.notes, cleaned.notes);
  for (const notes of [
    null,
    [],
    { grammar: 12 },
    { dialogue: 'a'.repeat(4001) },
  ]) {
    assert.throws(() =>
      parseLessonPack({ version: 1, lessons: [{ ...lesson, notes }] })
    );
  }
});

test('every Week 1 lesson imports all teaching notes and fits in a share link', async () => {
  const lessons = importLessonWorkbook(
    fs.readFileSync(
      path.join(__dirname, '../public/templates/english-lessons.xlsx')
    )
  );
  for (const lesson of lessons) {
    for (const key of Object.keys(target.exports.NOTE_LABELS))
      assert.ok(lesson.notes[key].length > 0);
    const shared = await shareTarget.exports.decodeSharedSnapshot(
      await encodeSharedLesson(lesson)
    );
    const { teacherNotes, ...learnerLesson } = lesson;
    assert.deepEqual(shared.lesson, learnerLesson);
  }
});

const importTarget = { exports: {} };
new Function(
  'exports',
  'module',
  'require',
  ts.transpileModule(
    fs.readFileSync(
      path.join(__dirname, '../src/lib/english/import-plan.ts'),
      'utf8'
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }
  ).outputText
)(importTarget.exports, importTarget, (name) =>
  name === './lessons' ? target.exports : require(name)
);
const { suggestedTarget, applyLessonImport, reviseLesson } =
  importTarget.exports;

test('version 1 migration splits old challenges without changing scoring fingerprints', () => {
  const original = {
    ...starterLessons[0],
    goal: 'Introduce yourself. Family challenge: Talk with a partner.',
  };
  const pack = parseLessonPack({ version: 1, lessons: [original] });
  assert.equal(pack.version, 2);
  assert.equal(pack.lessons[0].goal, 'Introduce yourself.');
  assert.equal(pack.lessons[0].challenge, 'Talk with a partner.');
  assert.equal(
    fingerprint(pack.lessons[0].activities[0]),
    JSON.stringify(original.activities[0])
  );
  assert.equal(
    fingerprint({ ...original.activities[0], tier: 'extra' }),
    fingerprint(original.activities[0])
  );
  assert.deepEqual(parseLessonPack(pack), pack);
});

test('imports update explicit targets and retain progress identities for unchanged and reordered activities', () => {
  const previous = starterLessons[0];
  const incoming = structuredClone(previous);
  incoming.id = 'imported-id';
  incoming.title = 'Renamed lesson';
  incoming.activities.reverse();
  incoming.activities.forEach((a, i) => {
    a.id = 'incoming-' + i;
    a.tier = 'extra';
  });
  incoming.activities[0].prompt = 'A changed prompt';
  const [updated] = applyLessonImport([previous], [incoming], {
    [incoming.id]: previous.id,
  });
  assert.equal(updated.id, previous.id);
  assert.equal(updated.revision, 2);
  assert.equal(updated.title, 'Renamed lesson');
  assert.ok(
    !previous.activities.some((a) => a.id === updated.activities[0].id)
  );
  assert.equal(updated.activities[1].id, previous.activities.at(-2).id);
  assert.equal(
    fingerprint(updated.activities[1]),
    fingerprint(previous.activities.at(-2))
  );
  const again = reviseLesson(updated, updated);
  assert.equal(again.revision, 3);
  assert.deepEqual(again.activities, updated.activities);
});

test('new copies get new identities, ambiguous titles are not matched, and duplicate update targets fail atomically', () => {
  const old = starterLessons[0];
  const incoming = { ...old, id: 'new-file-id' };
  assert.equal(suggestedTarget([old], incoming), old.id);
  assert.equal(suggestedTarget([old, { ...old, id: 'another' }], incoming), '');
  const result = applyLessonImport([old], [incoming], {});
  assert.equal(result.length, 2);
  assert.notEqual(result[1].id, old.id);
  assert.equal(result[1].revision, 1);
  assert.ok(
    result[1].activities.every(
      (a) => !old.activities.some((b) => a.id === b.id)
    )
  );
  const snapshot = JSON.stringify(old);
  assert.throws(() =>
    applyLessonImport([old], [incoming, { ...incoming, id: 'two' }], {
      'new-file-id': old.id,
      two: old.id,
    })
  );
  assert.equal(JSON.stringify(old), snapshot);
});

test('teacher notes stay in backups but not in shared snapshots', async () => {
  const lesson = {
    ...starterLessons[0],
    teacherNotes: 'PRIVATE TEACHER NOTES',
    challenge: 'Talk about your day.',
    revision: 3,
  };
  assert.equal(
    parseLessonPack({ version: 2, lessons: [lesson] }).lessons[0].teacherNotes,
    lesson.teacherNotes
  );
  const shared = await shareTarget.exports.decodeSharedSnapshot(
    await encodeSharedLesson(lesson)
  );
  assert.equal(shared.lesson.teacherNotes, undefined);
  assert.equal(shared.lesson.challenge, lesson.challenge);
  assert.equal(shared.lesson.revision, 3);
});

test('old shared bookmarks retain their legacy identity through format migration', async () => {
  const oldPack = { version: 1, lessons: [starterLessons[0]] };
  const token =
    'v1.' +
    require('node:zlib')
      .gzipSync(JSON.stringify(oldPack))
      .toString('base64url');
  const expected =
    'legacy-' +
    require('node:crypto')
      .createHash('sha256')
      .update(JSON.stringify(oldPack))
      .digest('hex');
  assert.equal(
    (await shareTarget.exports.decodeSharedSnapshot(token)).shareId,
    expected
  );
});

test('revised template has content-driven core practice and separate teaching fields', () => {
  const lessons = importLessonWorkbook(
    fs.readFileSync(
      path.join(__dirname, '../public/templates/english-lessons.xlsx')
    )
  );
  for (const l of lessons.filter((l) => !l.title.startsWith('Start '))) {
    assert.ok(l.activities.filter((a) => a.tier !== 'extra').length >= 30);
    assert.equal(
      l.activities.filter((a) => a.prompt.includes('Understanding check'))
        .length,
      4
    );
    assert.ok(l.activities.some((a) => a.tier === 'extra'));
    assert.ok(l.teacherNotes && l.challenge);
    assert.ok(!l.goal.includes('Family challenge:'));
  }
});

test('preparation and review snapshots survive export, sharing and lesson updates', async () => {
  const review = {
    ...starterLessons[0],
    teacherNotes: 'Private teaching plan',
  };
  const token = await encodeSharedLesson(review);
  const lesson = {
    ...starterLessons[1],
    notes: {
      beforeYouStart: 'Know numbers 1–20.',
      quickCheck: 'Say 8, 12 and 15.',
    },
    reviewLesson: { title: review.title, token },
  };
  const parsed = parseLessonPack({ version: 2, lessons: [lesson] }).lessons[0];
  assert.deepEqual(parsed.notes, lesson.notes);
  assert.deepEqual(parsed.reviewLesson, lesson.reviewLesson);
  const decoded = await decodeSharedLesson(await encodeSharedLesson(parsed));
  assert.deepEqual(decoded.reviewLesson, parsed.reviewLesson);
  const reviewDecoded = await decodeSharedLesson(decoded.reviewLesson.token);
  assert.equal(reviewDecoded.teacherNotes, undefined);
  assert.equal(
    fingerprint(parsed.activities[0]),
    fingerprint(starterLessons[1].activities[0])
  );
  for (const invalid of [
    'javascript:alert(1)',
    'https://example.com',
    'v1.bad#fragment',
  ]) {
    assert.throws(() =>
      parseLessonPack({
        version: 2,
        lessons: [
          { ...lesson, reviewLesson: { title: 'Review', token: invalid } },
        ],
      })
    );
  }
});

test('all template lessons include optional preparation and quick checks', () => {
  const lessons = importLessonWorkbook(
    fs.readFileSync(
      path.join(__dirname, '../public/templates/english-lessons.xlsx')
    )
  );
  for (const lesson of lessons) {
    assert.ok(lesson.notes.beforeYouStart);
    assert.ok(lesson.notes.quickCheck);
  }
  assert.match(
    lessons.find((l) => l.title.startsWith('Day 1')).notes.beforeYouStart,
    /letter names/
  );
  assert.match(
    lessons.find((l) => l.title.startsWith('Day 2')).notes.beforeYouStart,
    /1–20/
  );
});

test('foundation lessons cover alphabet, numbers and calendar with reusable short practice', () => {
  const lessons = importLessonWorkbook(
    fs.readFileSync(
      path.join(__dirname, '../public/templates/english-lessons.xlsx')
    )
  );
  const foundations = lessons.filter((l) => l.title.startsWith('Foundation '));
  assert.equal(foundations.length, 3);
  assert.equal(
    lessons
      .filter((l) => !l.title.startsWith('Start '))
      .reduce((n, l) => n + l.vocabulary.length, 0),
    215
  );
  assert.equal(
    lessons
      .filter((l) => !l.title.startsWith('Start '))
      .reduce((n, l) => n + l.activities.length, 0),
    451
  );
  for (const l of foundations) {
    assert.ok(l.activities.length >= 35);
    assert.equal(
      new Set(l.activities.map((a) => target.exports.KIND_SKILL[a.kind])).size,
      4
    );
    assert.ok(l.challenge && l.teacherNotes && l.notes.quickCheck);
    for (const a of l.activities)
      assert.equal(scoreAnswer(a.answers[0], a.answers).score, 100);
  }
  for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    assert.ok(foundations[0].vocabulary.some((v) => v.word === letter));
  for (const number of ['zero', 'eleven', 'twelve', 'twenty', 'thirty-one'])
    assert.ok(foundations[1].vocabulary.some((v) => v.word === number));
  for (const month of [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ])
    assert.ok(foundations[2].vocabulary.some((v) => v.word === month));
  assert.match(foundations[2].notes.grammar, /thirty-first/);
});

test('template core practice includes retrieval for every vocabulary entry and fresh checks', () => {
  const lessons = importLessonWorkbook(
    fs.readFileSync(
      path.join(__dirname, '../public/templates/english-lessons.xlsx')
    )
  );
  for (const lesson of lessons) {
    const core = lesson.activities.filter((a) => a.tier !== 'extra');
    for (const word of lesson.vocabulary) {
      assert.ok(
        core.some(
          (a) => a.kind === 'gap-fill' && a.answers.includes(word.word)
        ),
        `${lesson.title}: missing retrieval for ${word.word}`
      );
    }
    const checks = core.filter((a) =>
      a.prompt.includes(
        lesson.title.startsWith('Start ')
          ? 'Try yourself:'
          : 'Understanding check'
      )
    );
    assert.equal(checks.length, 4);
    for (const check of checks)
      assert.equal(scoreAnswer(check.answers[0], check.answers).score, 100);
    assert.ok(lesson.activities.length <= 100);
  }
});

test('start lessons teach instructions, questions, help and app practice with Vietnamese scaffolding', async () => {
  const lessons = importLessonWorkbook(
    fs.readFileSync(
      path.join(__dirname, '../public/templates/english-lessons.xlsx')
    )
  );
  const start = lessons.filter((l) => l.title.startsWith('Start '));
  assert.equal(start.length, 4);
  assert.deepEqual(
    lessons.slice(0, 4).map((l) => l.id),
    start.map((l) => l.id)
  );
  assert.equal(
    lessons.reduce((sum, l) => sum + l.activities.length, 0),
    565
  );
  for (const lesson of start) {
    assert.ok(lesson.goal.includes('/'));
    assert.ok(
      lesson.notes.beforeYouStart &&
        lesson.notes.quickCheck &&
        lesson.teacherNotes &&
        lesson.challenge
    );
    for (const a of lesson.activities) {
      assert.match(
        a.prompt,
        /[À-ỹ]/u,
        `${lesson.title}: instructions need Vietnamese support`
      );
      if (['dictation', 'repeat', 'read-aloud'].includes(a.kind))
        assert.ok(!/[À-ỹ]/u.test(a.text), 'Audio model must stay in English');
      assert.equal(scoreAnswer(a.answers[0], a.answers).score, 100);
    }
    assert.equal(
      (await decodeSharedLesson(await encodeSharedLesson(lesson))).teacherNotes,
      undefined
    );
  }
  assert.equal(new Set(start[3].activities.map((a) => a.kind)).size, 7);
  for (const word of [
    'listen',
    'repeat',
    'read',
    'write',
    'choose',
    'match',
    'arrange',
    'complete',
    'check',
    'try again',
  ])
    assert.ok(start[0].vocabulary.some((v) => v.word === word));
  for (const word of [
    'what',
    'who',
    'where',
    'when',
    'why',
    'which',
    'how',
    'how old',
    'how many',
    'how much',
    'what time',
  ])
    assert.ok(start[1].vocabulary.some((v) => v.word === word));
});

test('reviewed template uses clear instructions, constrained blanks and relevant answer variants', () => {
  const lessons = importLessonWorkbook(
    fs.readFileSync(
      path.join(__dirname, '../public/templates/english-lessons.xlsx')
    )
  );
  const find = (prefix) => lessons.find((l) => l.title.startsWith(prefix));
  assert.match(
    find('Start 1').notes.mistakes,
    /Listen = nghe\. Write = viết\./
  );
  assert.doesNotMatch(
    find('Start 1').notes.mistakes,
    /không có nghĩa là viết|dùng mắt/
  );
  const lan = find('Start 2').activities.find((a) =>
    a.prompt.includes('Where does Lan live?')
  );
  assert.equal(scoreAnswer('Lan lives in Hue.', lan.answers).score, 100);
  assert.ok(!lan.answers.includes('I live in Hue.'));
  const help = find('Start 3').activities.find((a) =>
    a.prompt.includes('Ask using example')
  );
  assert.equal(
    scoreAnswer('Can you give me an example?', help.answers).score,
    100
  );
  const repeat = find('Start 1').activities.find(
    (a) => a.kind === 'gap-fill' && a.prompt.includes('Listen and ___.')
  );
  assert.match(repeat.prompt, /nhắc lại/);
  const readingBlanks = find('Day 4').activities.filter((a) =>
    a.prompt.includes('I enjoy ___ books.')
  );
  assert.equal(readingBlanks.length, 2);
  for (const activity of readingBlanks) {
    assert.match(activity.prompt, /read/);
    assert.equal(scoreAnswer('reading', activity.answers).score, 100);
  }
  assert.match(
    find('Day 2').activities.find((a) => a.kind === 'dictation').prompt,
    /ten as a word/
  );
  assert.match(find('Day 3').notes.grammar, /in a house/);
  assert.match(find('Day 4').notes.grammar, /like to read/);
  assert.match(find('Foundation 3').notes.mistakes, /Thursday/);
  for (const lesson of lessons) {
    for (const activity of lesson.activities) {
      assert.ok(activity.answers.length >= 1 && activity.answers.length <= 10);
      if (['dictation', 'repeat', 'read-aloud'].includes(activity.kind)) {
        assert.doesNotMatch(activity.text, /___|[À-ỹ]/u);
      }
    }
  }
});
