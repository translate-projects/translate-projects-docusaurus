// One mock API per process (core reads TRANSLATE_PROJECTS_API_URL once, when first loaded;
// node --test runs each file in its own process), reset for every test with a fresh site and cache.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { startMockApi } = require('./mock-api');
const { createFakeSite } = require('./fake-site');

let api;
require('node:test').after(() => api?.close());

const setup = async (t, mockOpts = {}) => {
  if (!api) {
    api = await startMockApi();
    process.env.TRANSLATE_PROJECTS_API_URL = api.url;
  }
  // fresh behaviour and server state, same port
  for (const k of Object.keys(api.opts)) delete api.opts[k];
  Object.assign(
    api.opts,
    {
      failLangs: [],
      failStatus: {},
      failOnce: {},
      partialLangs: [],
      token: 'test-key',
    },
    mockOpts
  );
  api.state.sources = {};
  api.state.versions = {};
  api.state.requests.length = 0;
  process.env.HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-home-')); // isolated cache.json
  const { translateProject } = require('../../dist');

  const site = createFakeSite();
  const cwd = process.cwd();
  process.chdir(site);
  t.after(() => process.chdir(cwd));

  // Runs translateProject and returns its exit code (then resets it so the test passes)
  const run = async (opts = {}) => {
    process.exitCode = 0;
    await translateProject({
      defaultLocale: 'es',
      locales: ['es', 'en', 'fr'],
      apiKey: 'test-key',
      debug: false,
      ...opts,
    });
    const code = process.exitCode;
    process.exitCode = 0;
    return code;
  };

  const read = (file) => fs.readFileSync(path.join(site, file), 'utf8');
  const exists = (file) => fs.existsSync(path.join(site, file));
  const translateCalls = () =>
    api.state.requests.filter((r) => r.path === '/v1/translations/');

  return { api, site, run, read, exists, translateCalls };
};

const DOC = (lang) =>
  `i18n/${lang}/docusaurus-plugin-content-docs/current/intro.md`;

module.exports = { setup, DOC };
