// End-to-end translateProject against a local mock API (no real backend calls).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { startMockApi } = require('./helpers/mock-api');
const { createFakeSite } = require('./helpers/fake-site');

const read = (dir, file) => fs.readFileSync(path.join(dir, file), 'utf8');
const TRANSLATE = '/v1/translations/';

test('translates docs, blog, code.json and theme; second run reuses cache', async (t) => {
  const failLangs = ['fr'];
  const api = await startMockApi({ failLangs });
  t.after(() => api.close());
  process.env.TRANSLATE_PROJECTS_API_URL = api.url;
  process.env.HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-home-')); // isolated cache.json
  const { translateProject } = require('../dist');

  const site = createFakeSite();
  const cwd = process.cwd();
  process.chdir(site);
  t.after(() => process.chdir(cwd));

  const run = async () => {
    process.exitCode = 0;
    await translateProject({
      defaultLocale: 'es',
      locales: ['es', 'en', 'fr'],
      apiKey: 'test-key',
      debug: false,
    });
    const code = process.exitCode;
    process.exitCode = 0;
    return code;
  };

  // 1st run: fr fails on the API
  assert.strictEqual(await run(), 1);

  assert.strictEqual(
    read(site, 'docs/intro.md'),
    '---\ntitle: Introducción\n---\n\n# Hola mundo\n\nCódigo `npm i` sin marcar.\n'
  );
  const docEn = 'i18n/en/docusaurus-plugin-content-docs/current/intro.md';
  assert.match(read(site, docEn), /title: \[en\] Introducción/);
  assert.match(read(site, docEn), /# \[en\] Hola mundo/);
  assert.ok(
    fs.existsSync(
      path.join(
        site,
        'i18n/en/docusaurus-plugin-content-docs/current/guide/img.png'
      )
    )
  );
  assert.match(
    read(site, 'i18n/en/docusaurus-plugin-content-blog/2025-01-01-hola.md'),
    /\[en\] Primer post/
  );
  assert.match(read(site, 'blog/2025-01-01-hola.md'), /^# Primer post/);

  const codeEn = JSON.parse(read(site, 'i18n/en/code.json'));
  assert.deepStrictEqual(codeEn['home.title'], {
    message: '[en] Bienvenido',
    description: 'Home title',
  });
  const navEn = JSON.parse(
    read(site, 'i18n/en/docusaurus-theme-classic/navbar.json')
  );
  assert.strictEqual(navEn['item.label.Docs'].message, '[en] Documentación');

  // failed language: nothing written with "undefined" or empty translations
  assert.ok(
    !fs.existsSync(
      path.join(site, 'i18n/fr/docusaurus-plugin-content-docs/current/intro.md')
    )
  );
  assert.ok(!read(site, docEn).includes('undefined'));

  // 2nd run, no changes and fr works now: only fr is translated, en comes from cache
  failLangs.length = 0;
  const enBefore = read(site, docEn);
  api.state.requests.length = 0;
  assert.strictEqual(await run(), 0);
  const translated = api.state.requests.filter((r) => r.path === TRANSLATE);
  assert.ok(translated.length > 0);
  assert.ok(translated.every((r) => r.q.target_lang === 'fr'));
  assert.strictEqual(api.count('/v1/translations/load-sources'), 0);
  assert.strictEqual(read(site, docEn), enBefore);
  assert.match(
    read(site, 'i18n/fr/docusaurus-plugin-content-docs/current/intro.md'),
    /# \[fr\] Hola mundo/
  );

  // 3rd run, nothing changed: no translation work at all
  api.state.requests.length = 0;
  assert.strictEqual(await run(), 0);
  assert.strictEqual(api.count(TRANSLATE), 0);
  assert.strictEqual(api.count('/v1/translations/load-sources'), 0);

  // editing one doc re-syncs and re-translates only that file
  fs.writeFileSync(
    path.join(site, 'translate/docs/intro.md'),
    '# {{Hola de nuevo}}\n'
  );
  api.state.requests.length = 0;
  assert.strictEqual(await run(), 0);
  assert.strictEqual(api.count('/v1/translations/load-sources'), 1);
  assert.ok(
    api.state.requests
      .filter((r) => r.path === TRANSLATE)
      .every((r) => r.q.route_file.endsWith('intro.md'))
  );
  assert.match(read(site, docEn), /\[en\] Hola de nuevo/);
});
