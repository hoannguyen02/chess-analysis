const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

// Exercise the component's handlers and effects with deterministic hooks and a fake clock.
function timerHarness(AudioContext) {
  const slots = [];
  const intervals = new Map();
  let index = 0,
    intervalId = 0,
    dirty = false,
    effects = [],
    tree;
  let props = { minimal: true, paused: false, resetKey: 'one' };
  const same = (a, b) =>
    a &&
    b &&
    a.length === b.length &&
    a.every((value, i) => Object.is(value, b[i]));
  const react = {
    useState(initial) {
      const i = index++;
      if (!(i in slots))
        slots[i] = typeof initial === 'function' ? initial() : initial;
      return [
        slots[i],
        (update) => {
          const next = typeof update === 'function' ? update(slots[i]) : update;
          if (!Object.is(next, slots[i])) {
            slots[i] = next;
            dirty = true;
          }
        },
      ];
    },
    useRef(initial) {
      const i = index++;
      return (slots[i] ??= { current: initial });
    },
    useMemo(fn, deps) {
      const i = index++;
      if (!same(slots[i]?.deps, deps)) slots[i] = { value: fn(), deps };
      return slots[i].value;
    },
    useCallback(fn, deps) {
      return react.useMemo(() => fn, deps);
    },
    useEffect(fn, deps) {
      const i = index++;
      if (!same(slots[i]?.deps, deps))
        effects.push(() => {
          slots[i]?.cleanup?.();
          slots[i] = { deps, cleanup: fn() };
        });
    },
  };
  const win = {
    AudioContext,
    setInterval(fn) {
      intervals.set(++intervalId, fn);
      return intervalId;
    },
    clearInterval(id) {
      intervals.delete(id);
    },
  };
  const mod = { exports: {} };
  new Function(
    'module',
    'exports',
    'require',
    'window',
    ts.transpileModule(
      fs.readFileSync('src/components/TeachingTimer.tsx', 'utf8'),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
        },
      }
    ).outputText
  )(
    mod,
    mod.exports,
    (name) => {
      if (name === 'react') return react;
      if (name === 'next-intl') return { useTranslations: () => (key) => key };
      if (name === 'flowbite-react')
        return { Button: 'button', Tooltip: 'tooltip' };
      if (name === 'react-icons/vsc')
        return new Proxy({}, { get: (_, key) => key });
      return require(name);
    },
    win
  );
  function render() {
    let iterations = 0;
    do {
      assert.ok(iterations++ < 20, 'render should settle');
      dirty = false;
      index = 0;
      effects = [];
      tree = mod.exports.TeachingTimer(props);
      effects.forEach((effect) => effect());
    } while (dirty);
  }
  function nodes(node = tree) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    return [node, ...nodes(node.props?.children ?? null)];
  }
  render();
  return {
    update(next) {
      props = { ...props, ...next };
      render();
    },
    click(action) {
      const button = nodes().find(
        (node) =>
          node.type === 'button' &&
          node.props['aria-label'] === `common.timer.${action}`
      );
      assert.ok(button, `${action} button exists`);
      assert.ok(!button.props.disabled, `${action} is enabled`);
      button.props.onClick();
      render();
    },
    preset(seconds) {
      const settings = nodes().find(
        (node) =>
          node.type === 'button' && node.props['aria-expanded'] !== undefined
      );
      settings.props.onClick();
      render();
      const key = seconds === 30 ? 'thirty-seconds' : 'fifteen-seconds';
      nodes()
        .find(
          (node) =>
            node.type === 'button' &&
            node.props.children === `common.timer.${key}`
        )
        .props.onClick();
      render();
    },
    tick(count = 1) {
      for (let i = 0; i < count; i++) {
        [...intervals.values()].forEach((fn) => fn());
        render();
      }
    },
    time() {
      return nodes().find((node) => node.type === 'output').props.children;
    },
    running() {
      return intervals.size > 0;
    },
  };
}

test('auto-pause never prevents manual start/reset in review or exploration', () => {
  const timer = timerHarness();
  timer.click('start');
  timer.tick(2);
  assert.equal(timer.time(), '00:13');
  timer.update({ paused: true });
  assert.equal(timer.running(), false);
  timer.click('start');
  timer.tick();
  assert.equal(timer.time(), '00:12');
  timer.click('reset');
  assert.equal(timer.time(), '00:15');
  assert.equal(timer.running(), false);
  timer.click('start');
  timer.tick(15);
  assert.equal(timer.time(), '00:00');
  timer.click('restart');
  timer.tick();
  assert.equal(timer.time(), '00:14');
});

test('preset and exercise changes reset the timer and allow starting again', () => {
  const timer = timerHarness();
  timer.preset(30);
  timer.click('start');
  timer.tick(5);
  timer.click('reset');
  assert.equal(timer.time(), '00:30');
  timer.click('start');
  timer.tick();
  timer.update({ resetKey: 'two', paused: true });
  assert.equal(timer.time(), '00:30');
  assert.equal(timer.running(), false);
  timer.click('start');
  timer.tick();
  assert.equal(timer.time(), '00:29');
});

test('blocked, rejected or unavailable audio never delays start or reset', async () => {
  const variants = [
    class {
      constructor() {
        throw new Error('Unavailable audio');
      }
    },
    class {
      state = 'suspended';
      resume() {
        return Promise.reject(new Error('Blocked audio'));
      }
    },
    class {
      state = 'suspended';
      resume() {
        return new Promise(() => {});
      }
    },
  ];
  for (const AudioContext of variants) {
    const timer = timerHarness(AudioContext);
    timer.update({ paused: true });
    timer.click('start');
    timer.tick();
    assert.equal(timer.time(), '00:14');
    timer.click('pause');
    timer.tick();
    assert.equal(timer.time(), '00:14');
    timer.click('reset');
    assert.equal(timer.time(), '00:15');
    await new Promise((resolve) => setImmediate(resolve));
  }
});
