const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const source = ts.transpileModule(
  fs.readFileSync('src/components/PracticeManagement.tsx', 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }
).outputText;
const shared = { exports: {} };
new Function(
  'module',
  'exports',
  ts.transpileModule(
    fs.readFileSync('src/lib/chess/practice-management.ts', 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } }
  ).outputText
)(shared, shared.exports);

const flush = () => new Promise((resolve) => setImmediate(resolve));
const nodes = (node, type) => {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap((child) => nodes(child, type));
  return [
    ...(node.type === type ? [node] : []),
    ...nodes(node.props?.children, type),
  ];
};
const text = (node) =>
  typeof node === 'string'
    ? node
    : Array.isArray(node)
      ? node.map(text).join('')
      : node?.props
        ? text(node.props.children)
        : '';

function harness(overrides = {}) {
  const exercise = {
    title: 'Review example',
    fen: '8/8/8/8/8/4k3/8/4K3 w - - 0 1',
    moves: ['Kf1'],
    goal: 'material',
    difficulty: { level: 'B' },
    management: {
      id: 'review-id',
      scope: '/discovered-attack',
      currentScope: '/discovered-attack',
      baseLevel: 'A',
      updatedAt: '2026-11-05T00:00:00.000Z',
      signature: 'signed-source',
      writable: true,
    },
    ...overrides,
  };
  const before = structuredClone(exercise);
  const state = [],
    effects = [],
    prompts = [],
    writes = [],
    routes = [];
  let cursor = 0,
    accept = false;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', 'window', 'fetch', source)(
    mod,
    mod.exports,
    (name) => {
      if (name.endsWith('.module.css')) return { default: {} };
      if (name === 'react')
        return {
          useId: () => 'management-test',
          useRef(initial) {
            const i = cursor++;
            if (!(i in state)) state[i] = { current: initial };
            return state[i];
          },
          useState(initial) {
            const i = cursor++;
            if (!(i in state)) state[i] = initial;
            return [
              state[i],
              (value) => {
                state[i] = value;
              },
            ];
          },
          useEffect(effect, dependencies) {
            const i = cursor++;
            if (
              !state[i] ||
              dependencies.some((value, n) => value !== state[i][n])
            ) {
              state[i] = dependencies;
              effects.push(effect);
            }
          },
        };
      if (name === 'react/jsx-runtime')
        return {
          jsx: (type, props) => ({ type, props }),
          jsxs: (type, props) => ({ type, props }),
        };
      if (name === 'next/router')
        return {
          useRouter: () => ({
            asPath: '/discovered-attack?level=B',
            replace: async (href) => routes.push(href),
            reload: () => routes.push('reload'),
          }),
        };
      if (name.endsWith('/draw-levels'))
        return { practiceLevels: ['Beginner', 'A', 'B', 'C', 'C*', 'D'] };
      if (name.endsWith('/chess/practice-management')) return shared.exports;
      if (name.endsWith('/practice-access'))
        return { practiceAccessHeaders: () => ({ 'x-test-access': 'access' }) };
      return {};
    },
    {
      confirm: (message) => {
        prompts.push(message);
        return accept;
      },
    },
    async (_url, options) => {
      if (options.method === 'POST') writes.push(JSON.parse(options.body));
      return {
        ok: true,
        json: async () =>
          options.method === 'POST'
            ? { href: '/pin?level=C*' }
            : {
                topics: [
                  {
                    scope: '/discovered-attack',
                    label: 'Chiếu mở và tấn công mở',
                  },
                  { scope: '/pin', label: 'Đòn ghim' },
                ],
              },
      };
    }
  );
  function render() {
    cursor = 0;
    const result = mod.exports.ExerciseManagementControl({ exercise });
    while (effects.length) effects.shift()();
    return result;
  }
  function click(label) {
    const button = nodes(render(), 'button').find(
      (node) => text(node) === label || node.props['aria-label'] === label
    );
    assert.ok(button, label);
    assert.ok(!button.props.disabled, label);
    button.props.onClick();
  }
  return {
    render,
    click,
    prompts,
    writes,
    routes,
    exercise,
    before,
    accept: () => {
      accept = true;
    },
    async open() {
      click('Quản lý bài tập');
      render();
      await flush();
    },
    select(label, value) {
      const field = nodes(render(), 'label').find((node) =>
        text(node).startsWith(label)
      );
      assert.ok(field, label);
      nodes(field, 'select')[0].props.onChange({ target: { value } });
    },
    submit() {
      nodes(render(), 'form')[0].props.onSubmit({ preventDefault() {} });
    },
  };
}

test('cancelled removal leaves the exercise, request state and navigation untouched', async () => {
  const h = harness();
  await h.open();
  h.click('Bỏ khỏi bài tập');
  await flush();
  assert.match(h.prompts[0], /Bỏ bài tập.*Review example/);
  assert.deepEqual(h.writes, []);
  assert.deepEqual(h.routes, []);
  assert.deepEqual(h.exercise, h.before);
  assert.ok(
    !nodes(h.render(), 'button').find(
      (node) => text(node) === 'Bỏ khỏi bài tập'
    ).props.disabled
  );
  h.accept();
  h.click('Bỏ khỏi bài tập');
  await flush();
  assert.equal(h.writes.length, 1);
  assert.equal(h.writes[0].action, 'remove');
  assert.equal(h.writes[0].signature, 'signed-source');
  assert.equal(h.writes[0].expectedUpdatedAt, h.exercise.management.updatedAt);
  assert.deepEqual(h.writes[0].reference.moves, h.before.moves);
  assert.deepEqual(h.routes, ['/pin?level=C*']);
});

test('level changes, topic transfers and resets confirm the selected destination before saving', async () => {
  for (const kind of ['level', 'transfer', 'reset']) {
    const h = harness();
    await h.open();
    h.select('Cấp độ của bài', 'C*');
    if (kind === 'transfer') h.select('Chủ đề đích', '/pin');
    const save = () =>
      kind === 'reset' ? h.click('Trả về cấp độ A') : h.submit();
    save();
    await flush();
    assert.equal(h.prompts.length, 1);
    assert.match(h.prompts[0], kind === 'reset' ? /về cấp độ A/ : /cấp độ C\*/);
    if (kind === 'transfer') assert.match(h.prompts[0], /Đòn ghim/);
    assert.deepEqual(h.writes, []);
    assert.deepEqual(h.routes, []);
    h.accept();
    save();
    await flush();
    assert.equal(h.writes.length, 1);
    assert.equal(h.writes[0].action, kind === 'reset' ? 'reset' : 'move');
    if (kind !== 'reset') assert.equal(h.writes[0].level, 'C*');
    if (kind === 'transfer') assert.equal(h.writes[0].destinationScope, '/pin');
    assert.deepEqual(h.exercise, h.before);
  }
});

test('returning a transferred exercise confirms its original topic and level', async () => {
  const h = harness({
    management: {
      id: 'review-id',
      scope: '/pin',
      currentScope: '/discovered-attack',
      baseLevel: 'A',
      writable: true,
      updatedAt: null,
    },
  });
  await h.open();
  h.click('Trả về chủ đề và cấp độ ban đầu');
  assert.match(h.prompts[0], /chủ đề ban đầu, cấp độ A/);
  assert.deepEqual(h.writes, []);
});
