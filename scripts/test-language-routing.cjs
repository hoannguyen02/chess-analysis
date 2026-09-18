const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(file, dependencies = {}, document = {}) {
  const code = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, '..', file), 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }
  ).outputText;
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', 'document', code)(
    mod.exports,
    mod,
    (name) => dependencies[name],
    document
  );
  return mod.exports;
}
const { middleware } = load('src/middleware.ts', {
  'next/server': {
    NextResponse: {
      next: () => ({ next: true }),
      redirect: (url) => ({ redirect: url.pathname }),
    },
  },
});
function request(pathname, cookies = {}) {
  return {
    url: `https://limachess.com${pathname}`,
    cookies: {
      get: (key) => (cookies[key] ? { value: cookies[key] } : undefined),
    },
    headers: { get: (key) => (key === 'x-vercel-ip-country' ? 'VN' : null) },
  };
}
test('Vietnam geo detection redirects an unselected English nested route', () => {
  assert.equal(
    middleware(request('/english-practice')).redirect,
    '/vi/english-practice'
  );
});
test('every explicit choice is persisted before navigation and overrides Vietnam geo detection', async () => {
  for (const language of ['en', 'vi']) {
    const cookies = {};
    const document = {
      set cookie(value) {
        const [key, val] = value.split(';')[0].split('=');
        cookies[key] = val;
      },
    };
    const { changeLanguage } = load('src/lib/changeLanguage.ts', {}, document);
    let navigated = false;
    await changeLanguage(
      {
        asPath: '/english-practice/learn?mode=practice#lesson=example',
        replace: (url, as, options) => {
          assert.equal(cookies.NEXT_LOCALE, language);
          assert.equal(cookies.USER_SELECTED_LOCALE, '1');
          assert.equal(
            url,
            '/english-practice/learn?mode=practice#lesson=example'
          );
          assert.equal(options.locale, language);
          for (const route of [
            '/',
            '/english-practice',
            '/setup-board',
            '/analysis',
            '/team-rank',
          ]) {
            const destination =
              language === 'vi' ? `/vi${route === '/' ? '' : route}` : route;
            assert.deepEqual(middleware(request(destination, cookies)), {
              next: true,
            });
          }
          navigated = true;
          return Promise.resolve(true);
        },
      },
      language
    );
    assert.equal(navigated, true);
  }
});
