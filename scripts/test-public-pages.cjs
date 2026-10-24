const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(path) {
  const mod = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    fileName: path,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  function resolve(name) {
    if (name.endsWith('.module.css')) return {};
    if (name === 'next/head') return () => null;
    if (name === 'next/image') return () => null;
    if (name.startsWith('@/lib/server/private-'))
      return load(`src/${name.slice(2)}.ts`);
    // Access wrappers or router dependencies are intentionally unavailable:
    // these pages must render without a browser session or login provider.
    return require(name);
  }
  new Function('module', 'exports', 'require', js)(mod, mod.exports, resolve);
  return mod.exports;
}

for (const [page, content] of [
  ['lich-hoc', ['Lịch học chung', 'Học phí', 'maps.app.goo.gl']],
  ['chien-thuat', ['Chủ đề luyện chiến thuật', 'lichess.org/training/mateIn1']],
]) {
  test(`${page} renders its content without a login session`, () => {
    const Page = load(`src/pages/${page}.tsx`).default;
    const html = renderToStaticMarkup(React.createElement(Page));
    for (const text of content) assert.ok(html.includes(text), text);
    assert.ok(!html.includes('Khu vực riêng'));
    assert.ok(!html.includes('Khóa lại'));
    assert.ok(!html.includes('Đang kiểm tra truy cập'));
  });
}
