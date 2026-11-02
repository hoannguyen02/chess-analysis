const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(path, resolve = require) {
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  new Function('module', 'exports', 'require', code)(mod, mod.exports, resolve);
  return mod.exports;
}
const pages = load('src/lib/server/private-hub.ts').privatePages;
function render(items, query = '', group = '') {
  const state = [query, group];
  const Library = load('src/components/PracticeLibrary.tsx', (name) => {
    if (name === 'react') return { ...React, useState: () => [state.shift(), () => {}] };
    if (name === 'next/link') return ({ children, href }) => React.createElement('a', { href }, children);
    if (name.endsWith('.css')) return {};
    return require(name);
  }).default;
  return renderToStaticMarkup(React.createElement(Library, { pages: items }));
}
test('legacy responses keep current groups and show the total only once', () => {
  const legacy = pages.map(({ group, ...page }) => page);
  const html = render(legacy);
  assert.equal(html, render(pages));
  assert.doesNotMatch(html, /Khác/);
  assert.equal(html.split(`${pages.length} mục`).length - 1, 1);
});
test('accent-free search, group filters, and empty states work', () => {
  assert.match(render(pages, 'don ghim'), /href="\/pin"/);
  assert.doesNotMatch(render(pages, 'don ghim'), /href="\/london"/);
  assert.doesNotMatch(render(pages, '', 'Chiếu hết'), /href="\/pin"/);
  assert.match(render(pages, 'no-matching-topic'), /Chưa tìm thấy nội dung/);
});
test('a single unknown group does not produce redundant navigation or heading', () => {
  const html = render([{ href: '/new', title: 'New', description: '' }]);
  assert.doesNotMatch(html, /<h2>Khác|Nhóm nội dung/);
  assert.match(html, /href="\/new"/);
});
