// End-to-end translateProject against a local mock API (no real backend calls).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { setup, DOC } = require('./helpers/harness');

test('translates docs, blog, code.json and theme; cache skips what did not change', async (t) => {
  const { api, site, run, read, exists, translateCalls } = await setup(t, {
    failLangs: ['fr'],
  });

  // 1st run: fr fails on the API
  assert.strictEqual(await run(), 1);

  assert.strictEqual(
    read('docs/intro.md'),
    '---\ntitle: Introducción\n---\n\n# Hola mundo\n\nCódigo `npm i` sin marcar.\n'
  );
  assert.match(read(DOC('en')), /title: \[en\] Introducción/);
  assert.match(read(DOC('en')), /# \[en\] Hola mundo/);
  assert.match(read(DOC('en')), /Código `npm i` sin marcar\./);
  assert.ok(
    exists('i18n/en/docusaurus-plugin-content-docs/current/guide/img.png')
  );
  assert.match(
    read('i18n/en/docusaurus-plugin-content-blog/2025-01-01-hola.md'),
    /\[en\] Primer post/
  );
  assert.match(read('blog/2025-01-01-hola.md'), /^# Primer post/);

  const codeEn = JSON.parse(read('i18n/en/code.json'));
  assert.deepStrictEqual(codeEn['home.title'], {
    message: '[en] Bienvenido',
    description: 'Home title',
  });
  const navEn = JSON.parse(
    read('i18n/en/docusaurus-theme-classic/navbar.json')
  );
  assert.strictEqual(navEn['item.label.Docs'].message, '[en] Documentación');

  // failed language: nothing written with "undefined" or empty translations
  assert.ok(!exists(DOC('fr')));
  assert.ok(!read(DOC('en')).includes('undefined'));

  // 2nd run, no changes and fr works now: only fr is translated, en comes from cache
  api.opts.failLangs.length = 0;
  const enBefore = read(DOC('en'));
  api.state.requests.length = 0;
  assert.strictEqual(await run(), 0);
  assert.ok(translateCalls().length > 0);
  assert.ok(translateCalls().every((r) => r.q.target_lang === 'fr'));
  assert.strictEqual(api.count('/v1/translations/load-sources'), 0);
  assert.strictEqual(read(DOC('en')), enBefore);
  assert.match(read(DOC('fr')), /# \[fr\] Hola mundo/);

  // 3rd run, nothing changed: no translation work at all
  api.state.requests.length = 0;
  assert.strictEqual(await run(), 0);
  assert.strictEqual(translateCalls().length, 0);
  assert.strictEqual(api.count('/v1/translations/load-sources'), 0);

  // editing one doc re-syncs and re-translates only that file
  fs.writeFileSync(
    path.join(site, 'translate/docs/intro.md'),
    '# {{Hola de nuevo}}\n'
  );
  api.state.requests.length = 0;
  assert.strictEqual(await run(), 0);
  assert.strictEqual(api.count('/v1/translations/load-sources'), 1);
  assert.ok(translateCalls().every((r) => r.q.route_file.endsWith('intro.md')));
  assert.match(read(DOC('en')), /\[en\] Hola de nuevo/);
});

test('sends each text once with its route_file and cache_hash', async (t) => {
  const { api, run } = await setup(t);
  assert.strictEqual(await run(), 0);

  const loads = api.state.requests.filter(
    (r) => r.path === '/v1/translations/load-sources'
  );
  assert.ok(
    loads.every(
      (r) =>
        r.q.source_lang === 'es' &&
        r.q.type_project === 'docusaurus' &&
        r.q.cache_hash
    )
  );
  assert.ok(loads.some((r) => r.q.route_file === 'translate/docs/intro.md'));
  assert.ok(Object.values(api.state.sources).includes('Hola mundo'));
  assert.ok(!Object.values(api.state.sources).some((v) => v.includes('{{')));
});

test('disabled sections are not sent nor written', async (t) => {
  const { api, run, exists, read } = await setup(t);
  assert.strictEqual(
    await run({
      blog: { enable: false },
      react: { enable: false },
      theme: { enable: false, ignoreKeys: [] },
    }),
    0
  );
  assert.ok(exists(DOC('en')));
  assert.ok(
    !exists('i18n/en/docusaurus-plugin-content-blog/2025-01-01-hola.md')
  );
  assert.ok(
    api.state.requests.every(
      (r) => !String(r.q.route_file || '').includes('code.json')
    )
  );
  // theme left as write-translations generated it
  assert.strictEqual(
    JSON.parse(read('i18n/en/docusaurus-theme-classic/navbar.json'))[
      'item.label.Docs'
    ].message,
    'Documentación'
  );
});

test('blog disabled and without translate/blog does not crash', async (t) => {
  const { site, run, exists } = await setup(t);
  fs.rmSync(path.join(site, 'translate/blog'), { recursive: true });
  assert.strictEqual(await run({ blog: { enable: false } }), 0);
  assert.ok(exists(DOC('en')));
});

test('theme ignoreKeys stay untranslated', async (t) => {
  const { run, read } = await setup(t);
  assert.strictEqual(
    await run({ theme: { enable: true, ignoreKeys: ['logo.alt'] } }),
    0
  );
  const nav = JSON.parse(read('i18n/en/docusaurus-theme-classic/navbar.json'));
  assert.strictEqual(nav['logo.alt'].message, 'Logo');
  assert.strictEqual(nav['item.label.Docs'].message, '[en] Documentación');
});

test('missing defaultLocale or locales: error, no API call', async (t) => {
  const { api, run } = await setup(t);
  await run({ defaultLocale: undefined });
  await run({ locales: [] });
  assert.strictEqual(api.state.requests.length, 0);
});
