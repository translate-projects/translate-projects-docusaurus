// Minimal Docusaurus-like site: sources in translate/ and a fake write-translations script.
const fs = require('fs');
const os = require('os');
const path = require('path');

const write = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

const createFakeSite = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-docusaurus-'));
  write(
    path.join(dir, 'package.json'),
    JSON.stringify({ scripts: { 'write-translations': 'node write.js' } })
  );
  // docusaurus write-translations --locale X: code.json + theme json files
  write(
    path.join(dir, 'write.js'),
    `const fs = require('fs');
const locale = process.argv[process.argv.indexOf('--locale') + 1];
fs.mkdirSync('i18n/' + locale + '/docusaurus-theme-classic', { recursive: true });
fs.writeFileSync('i18n/' + locale + '/code.json', JSON.stringify({
  'home.title': { message: 'Bienvenido', description: 'Home title' },
}));
fs.writeFileSync('i18n/' + locale + '/docusaurus-theme-classic/navbar.json', JSON.stringify({
  'item.label.Docs': { message: 'Documentación' },
  'logo.alt': { message: 'Logo' },
}));
`
  );
  write(
    path.join(dir, 'translate/docs/intro.md'),
    '---\ntitle: {{Introducción}}\n---\n\n# {{Hola mundo}}\n\nCódigo `npm i` sin marcar.\n'
  );
  write(path.join(dir, 'translate/docs/guide/img.png'), 'png');
  write(
    path.join(dir, 'translate/blog/2025-01-01-hola.md'),
    '# {{Primer post}}\n'
  );
  return dir;
};

module.exports = { createFakeSite };
