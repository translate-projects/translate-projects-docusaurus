// API failures must never crash the run nor lose or corrupt generated files.
const test = require('node:test');
const assert = require('node:assert');
const { setup, DOC } = require('./helpers/harness');

test('invalid token: exit code 1, previous translations untouched', async (t) => {
  const { api, run, read } = await setup(t);
  assert.strictEqual(await run(), 0);
  const before = read(DOC('en'));
  const codeBefore = read('i18n/en/code.json');

  api.opts.token = 'rotated-key';
  api.state.requests.length = 0;
  assert.strictEqual(await run(), 1);
  assert.strictEqual(read(DOC('en')), before);
  assert.strictEqual(read('i18n/en/code.json'), codeBefore);
  assert.ok(
    api.state.requests.every(
      (r) => r.path === '/v1/translations/validate-changes-files'
    )
  );
});

test('500 on one language: others are written, that one is retried next run', async (t) => {
  const { api, run, read, exists, translateCalls } = await setup(t, {
    failStatus: { fr: 500 },
  });
  assert.strictEqual(await run(), 1);
  assert.match(read(DOC('en')), /\[en\] Hola mundo/);
  assert.ok(!exists(DOC('fr')));

  delete api.opts.failStatus.fr;
  api.state.requests.length = 0;
  assert.strictEqual(await run(), 0);
  assert.ok(translateCalls().every((r) => r.q.target_lang === 'fr'));
  assert.match(read(DOC('fr')), /\[fr\] Hola mundo/);
});

test('503 once is retried within the same run', async (t) => {
  const { run, read } = await setup(t, { failOnce: { en: 503 } });
  assert.strictEqual(await run({ locales: ['en'] }), 0);
  assert.match(read(DOC('en')), /\[en\] Hola mundo/);
});

test('partial response (MISSING_API_KEY): source text kept, missing texts requested again', async (t) => {
  const { api, run, read, translateCalls } = await setup(t, {
    partialLangs: ['en'],
  });
  assert.strictEqual(await run({ locales: ['en'] }), 1);
  const partial = read(DOC('en'));
  assert.ok(!partial.includes('undefined') && !partial.includes('{{'));
  // one of the two texts came back translated, the other one stays in Spanish
  assert.match(partial, /\[en\] /);
  assert.ok(
    /Introducción/.test(partial.replace('[en] Introducción', '')) ||
      /Hola mundo/.test(partial.replace('[en] Hola mundo', ''))
  );

  // key configured on the backend: next run asks again even though the file did not change
  api.opts.partialLangs.length = 0;
  api.state.requests.length = 0;
  assert.strictEqual(await run({ locales: ['en'] }), 0);
  assert.ok(translateCalls().length > 0);
  assert.match(read(DOC('en')), /title: \[en\] Introducción/);
  assert.match(read(DOC('en')), /# \[en\] Hola mundo/);

  // and once complete, it is not requested anymore
  api.state.requests.length = 0;
  assert.strictEqual(await run({ locales: ['en'] }), 0);
  assert.strictEqual(translateCalls().length, 0);
});

test('API down (connection refused): exit code 1, no crash', async (t) => {
  const { api, run, read } = await setup(t);
  assert.strictEqual(await run({ locales: ['en'] }), 0);
  const before = read(DOC('en'));
  await api.close();
  t.after(() => api.reopen());
  assert.strictEqual(await run({ locales: ['en'] }), 1);
  assert.strictEqual(read(DOC('en')), before);
});

test('no apiKey (MISSING_API_KEY): exit code 1 and no request is sent', async (t) => {
  const { api, run, exists } = await setup(t);
  assert.strictEqual(await run({ apiKey: undefined }), 1);
  assert.strictEqual(api.state.requests.length, 0);
  assert.ok(!exists(DOC('en')));
});
