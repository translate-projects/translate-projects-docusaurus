// Local stand-in for the Translate Projects API: HTTP endpoints + progress WebSocket.
// "Translates" by prefixing each source text with "[lang] ".
const http = require('http');
const { WebSocketServer } = require('ws');

// Behaviour is read on every request, so tests can change it between runs:
//   failLangs: POST /translations/ answers 400 for these languages
//   failStatus: { lang: status } answers that status (e.g. 500) for these languages
//   failOnce: { lang: status } answers that status once, then works (retry path)
//   partialLangs: language-project omits every other text, like MISSING_API_KEY
//   token: only "Token <token>" is accepted, anything else gets 401
const startMockApi = async (opts = {}) => {
  opts.failLangs ??= [];
  opts.failStatus ??= {};
  opts.failOnce ??= {};
  opts.partialLangs ??= [];
  opts.token ??= 'test-key';
  const state = { sources: {}, versions: {}, requests: [] };
  let nextTask = 0;

  const reply = (res, status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };
  const ok = (res, data) =>
    reply(res, 200, { status: 'ok', message: '', data });

  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', async () => {
      const url = new URL(req.url, 'http://x');
      const q = Object.fromEntries(url.searchParams);
      const body = raw ? JSON.parse(raw) : null;
      state.requests.push({ method: req.method, path: url.pathname, q });

      if (req.headers.authorization !== `Token ${opts.token}`)
        return reply(res, 401, { status: 'error', message: 'Token no válido' });

      switch (url.pathname) {
        // like the backend: read-only, compares against hashes stored by load-sources
        case '/v1/translations/validate-changes-files': {
          const changed = {};
          for (const [file, hash] of Object.entries(body || {}))
            if (state.versions[file] !== hash) changed[file] = hash;
          return ok(res, changed);
        }
        case '/v1/translations/load-sources':
          Object.assign(state.sources, body);
          // required lazily: core reads TRANSLATE_PROJECTS_API_URL when first loaded
          const { generateHashText } = require('translate-projects-core/utils');
          state.versions[await generateHashText(q.route_file)] = q.cache_hash;
          return ok(res, { task_id: `t${nextTask++}` });
        case '/v1/translations/':
          if (opts.failLangs.includes(q.target_lang))
            return reply(res, 400, { status: 'error', message: 'mock fails' });
          if (opts.failStatus[q.target_lang])
            return reply(res, opts.failStatus[q.target_lang], {
              status: 'error',
              message: 'mock fails',
            });
          if (opts.failOnce[q.target_lang]) {
            const status = opts.failOnce[q.target_lang];
            delete opts.failOnce[q.target_lang];
            return reply(res, status, {
              status: 'error',
              message: 'mock busy',
            });
          }
          return ok(res, { task_id: `t${nextTask++}` });
        case '/v1/translations/language-project': {
          const data = {};
          const partial = opts.partialLangs.includes(q.target_lang);
          Object.entries(state.sources).forEach(([k, v], i) => {
            if (!(partial && i % 2)) data[k] = `[${q.target_lang}] ${v}`;
          });
          return ok(res, data);
        }
      }
      reply(res, 404, { status: 'error', message: 'not found' });
    });
  });

  const wss = new WebSocketServer({ server });
  wss.on('connection', (socket) => {
    socket.send(JSON.stringify({ progress: '50' }));
    setTimeout(() => socket.send(JSON.stringify({ progress: '100' })), 20);
  });

  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    state,
    opts,
    count: (path) => state.requests.filter((r) => r.path === path).length,
    close: () => {
      wss.clients.forEach((c) => c.terminate());
      server.closeAllConnections();
      return new Promise((r) => server.close(r));
    },
    reopen: () => new Promise((r) => server.listen(port, '127.0.0.1', r)),
  };
};

module.exports = { startMockApi };
