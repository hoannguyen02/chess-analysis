const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function load(path, resolve = require) {
  const mod = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  new Function('module', 'exports', 'require', js)(mod, mod.exports, resolve);
  return mod.exports;
}
function response() {
  return {
    code: 200,
    headers: {},
    body: undefined,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    end() {},
  };
}

test('private practice access', async (t) => {
  process.env.PRACTICE_PASSWORD = 'test-only-teacher-password';
  const auth = load('src/lib/server/practice-access.ts');
  const now = Date.now();
  const token = auth.issueAccessToken(now);
  await t.test('password, signature, expiry and password rotation', () => {
    assert.equal(auth.passwordMatches('wrong'), false);
    assert.equal(auth.passwordMatches({ password: 'anything' }), false);
    assert.equal(auth.passwordMatches(process.env.PRACTICE_PASSWORD), true);
    assert.equal(auth.validAccessToken(token, now), true);
    assert.equal(auth.validAccessToken(token, now + 30 * 86400000), false);
    assert.equal(auth.validAccessToken(token.replace(/^\d/, '9'), now), false);
    assert.equal(auth.validAccessToken(token.slice(0, -2) + 'zz', now), false);
    assert.equal(auth.validAccessToken('true', now), false);
    process.env.PRACTICE_PASSWORD = 'rotated';
    assert.equal(auth.validAccessToken(token, now), false);
    delete process.env.PRACTICE_PASSWORD;
    assert.equal(auth.validAccessToken(token, now), false);
    assert.equal(auth.passwordMatches(''), false);
    assert.throws(() => auth.issueAccessToken());
    process.env.PRACTICE_PASSWORD = 'test-only-teacher-password';
  });
  await t.test(
    'both data APIs deny requests before loading private files',
    async () => {
      for (const path of ['skewer-exercises', 'skewer-game-sources']) {
        let privateReads = 0;
        const handler = load(`src/pages/api/${path}.ts`, (name) => {
          if (name === '@/lib/server/practice-access') return auth;
          if (name === '@/lib/server/private-hub')
            return { privateHubPath: () => '/workspace-test123' };
          privateReads++;
          if (name.includes('queen-skewer-pilot')) return [];
          if (name.includes('queen-skewer-intro')) return [];
          if (name.includes('skewer-beginner-exercises')) return [];
          if (name.includes('skewer-exercises'))
            return [{ title: 'Private', gameReference: {} }];
          if (name.includes('practice-game-caption'))
            return {
              practiceGameCaption: () => '2004 · Test',
              practicePlayers: () => [],
              practicePlayerTitle: () => 'GM Test (2500) — IM Example (2400)',
            };
          return { privateGame: {} };
        }).default;
        for (const authorization of [
          undefined,
          'Bearer true',
          `Bearer ${token}modified`,
        ]) {
          const res = response();
          await handler({ method: 'GET', headers: { authorization } }, res);
          assert.equal(res.code, 401);
          assert.equal(res.headers['Cache-Control'], 'private, no-store');
        }
        assert.equal(privateReads, 0);
        const res = response();
        await handler(
          { method: 'GET', headers: { authorization: `Bearer ${token}` } },
          res
        );
        assert.equal(res.code, 200);
        assert.ok(privateReads > 0);
      }
    }
  );
  await t.test('login issues tokens and throttles repeated failures', () => {
    const handler = load('src/pages/api/practice-access.ts', (name) => {
      if (name.endsWith('private-navigation'))
        return load('src/lib/private-navigation.ts');
      if (name.endsWith('private-hub'))
        return {
          privateHubPath: () => '/workspace-test123',
          privatePages: [{ href: '/skewer' }],
        };
      return auth;
    }).default;
    const request = (password, ip = '127.0.0.1') => ({
      method: 'POST',
      socket: { remoteAddress: ip },
      body: { password, next: '/skewer?level=B', locale: 'vi' },
    });
    const good = response();
    handler(request(process.env.PRACTICE_PASSWORD), good);
    assert.equal(good.code, 200);
    assert.ok(auth.validAccessToken(good.body.token));
    assert.equal(good.body.redirectTo, '/vi/skewer?level=B');
    for (let i = 0; i < 10; i++) {
      const bad = response();
      handler(request('wrong'), bad);
      assert.equal(bad.code, 401);
    }
    const limited = response();
    handler(request('wrong'), limited);
    assert.equal(limited.code, 429);
    const other = response();
    handler(request(process.env.PRACTICE_PASSWORD, '127.0.0.2'), other);
    assert.equal(other.code, 200);
  });
});

test('private hub path rotation and protected directory', () => {
  const hub = load('src/lib/server/private-hub.ts');
  delete process.env.PRIVATE_HUB_PATH;
  assert.equal(hub.matchesPrivateHub('private'), false);
  for (const value of ['/a/b', 'https://example.com', '/../workspace', '']) {
    process.env.PRIVATE_HUB_PATH = value;
    assert.equal(hub.privateHubPath(), '');
  }
  process.env.PRIVATE_HUB_PATH = '/tactics';
  assert.equal(hub.privateHubPath(), '/tactics');
  assert.equal(hub.matchesPrivateHub('tactics'), true);
  process.env.PRIVATE_HUB_PATH = '/workspace-old123';
  assert.equal(hub.matchesPrivateHub('workspace-old123'), true);
  process.env.PRIVATE_HUB_PATH = '/workspace-new123';
  assert.equal(hub.matchesPrivateHub('workspace-old123'), false);
  assert.equal(hub.matchesPrivateHub('workspace-new123'), true);
  assert.equal(hub.matchesPrivateHub('private'), false);
  process.env.PRACTICE_PASSWORD = 'test-only-password';
  const auth = load('src/lib/server/practice-access.ts');
  const handler = load('src/pages/api/private-pages.ts', (name) =>
    name.endsWith('private-hub') ? hub : auth
  ).default;
  const denied = response();
  handler({ method: 'GET', headers: {} }, denied);
  assert.equal(denied.code, 401);
  assert.equal(denied.body.pages, undefined);
  assert.equal(denied.body.hubPath, undefined);
  const allowed = response();
  handler(
    {
      method: 'GET',
      headers: { authorization: `Bearer ${auth.issueAccessToken()}` },
    },
    allowed
  );
  assert.equal(allowed.code, 200);
  assert.equal(allowed.body.hubPath, '/workspace-new123');
  assert.ok(allowed.body.pages.some((page) => page.href === '/skewer'));
  assert.equal(allowed.headers['Cache-Control'], 'private, no-store');
});

test('login returns only to known private routes and preserves locale', () => {
  const { privateReturnPath } = load('src/lib/private-navigation.ts');
  const allowed = ['/skewer', '/workspace-new123'];
  const destination = (value, locale = 'vi') =>
    privateReturnPath(value, locale, allowed, '/workspace-new123');
  assert.equal(
    destination('/vi/skewer?level=B#board'),
    '/vi/skewer?level=B#board'
  );
  assert.equal(destination('/skewer', 'en'), '/en/skewer');
  assert.equal(destination('/workspace-new123'), '/vi/workspace-new123');
  for (const value of [
    undefined,
    ['skewer'],
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/access',
    '/api/private-pages',
    '/workspace-old123',
    '/skewer/../access',
    '/%2f%2fevil.example',
    '/skewer\n',
  ]) {
    assert.equal(destination(value), '/vi/workspace-new123');
  }
});

test('additional private pages protect their data and support login return paths', async () => {
  process.env.PRACTICE_PASSWORD = 'test-only-password';
  const auth = load('src/lib/server/practice-access.ts');
  const hub = load('src/lib/server/private-hub.ts');
  const { privateReturnPath } = load('src/lib/private-navigation.ts');
  const paths = hub.privatePages.map((page) => page.href);
  for (const path of ['/skewer', '/hoa-co', '/chien-thuat', '/lich-hoc']) {
    assert.ok(paths.includes(path));
    assert.equal(privateReturnPath(path, 'vi', paths, '/skewer'), `/vi${path}`);
  }
  for (const endpoint of [
    'draw-exercises',
    'draw-game-sources',
    'private-tactics',
    'private-schedule',
  ]) {
    let reads = 0;
    const handler = load(`src/pages/api/${endpoint}.ts`, (name) => {
      if (name.endsWith('/practice-access')) return auth;
      if (name.endsWith('/private-hub')) return hub;
      reads++;
      if (name.endsWith('/draw-practice'))
        return { drawCategories: [{ id: 'test', exercises: [] }] };
      if (name.endsWith('/draw-game-reference'))
        return { gameReference: () => undefined };
      if (name.endsWith('/practice-game-caption')) return {};
      if (name.endsWith('/private-tactics'))
        return { topicGroups: [{ title: 'test', topics: [] }] };
      if (name.endsWith('/private-schedule'))
        return { scheduleData: { sessions: [] } };
      return { game: {} };
    }).default;
    const denied = response();
    await handler({ method: 'GET', headers: {} }, denied);
    assert.equal(denied.code, 401);
    assert.equal(reads, 0);
    const allowed = response();
    await handler(
      {
        method: 'GET',
        headers: { authorization: `Bearer ${auth.issueAccessToken()}` },
      },
      allowed
    );
    assert.equal(allowed.code, 200);
    assert.equal(allowed.headers['Cache-Control'], 'private, no-store');
    assert.ok(reads > 0);
  }
});
