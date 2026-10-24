# Translate Projects Docusaurus

Easily globalize your Docusaurus documentation. **Translate Projects Docusaurus** translates your docs, blog, React pages (`code.json`) and theme strings into multiple languages using the [Translate Projects](https://translateprojects.dev) API, and writes the results into Docusaurus' `i18n` structure.

[See full documentation](https://doc.translateprojects.dev/docs/frameworks-javascript/docusaurus)

## Features

- **Docs & blog translation**: write your source content in `translate/docs` and `translate/blog`, wrap translatable text in `{{ }}`, and get clean files for every locale.
- **React pages & theme**: translates `i18n/<lang>/code.json` and `docusaurus-theme-classic` JSON files.
- **Incremental**: files are hashed and cached; only new or changed files are sent to the API.
- **Assets synced**: non-text files (images, etc.) are copied to every locale folder.
- **Safe on API errors**: a failed or partial translation (invalid token, 4xx/5xx, project without AI key) keeps the source text, never writes broken files, is retried on the next run and exits with code 1.
- **Watch mode**: `--dev` watches `./translate` and syncs changes to the default locale instantly, without calling the API.

## Installation

```bash
npm install -D translate-projects-docusaurus
```

Your Docusaurus project must have the standard `write-translations` script (`docusaurus write-translations`) in `package.json`; the tool runs `npm run write-translations -- --locale <lang>` internally.

## How it works

1. Write your content in the source folders instead of `docs/` and `blog/`:

   ```
   translate/
   ├── docs/
   │   └── intro.md
   └── blog/
       └── 2025-01-01-welcome.md
   ```

2. Wrap every text you want translated in double braces:

   ```md
   ---
   title: { { Getting started } }
   ---

   # {{Welcome to my project}}

   {{This paragraph will be translated.}}
   ```

3. Run the translation. The tool generates:

   | Source                                           | Default locale output | Other locales output                                    |
   | ------------------------------------------------ | --------------------- | ------------------------------------------------------- |
   | `translate/docs/**`                              | `docs/**`             | `i18n/<lang>/docusaurus-plugin-content-docs/current/**` |
   | `translate/blog/**`                              | `blog/**`             | `i18n/<lang>/docusaurus-plugin-content-blog/**`         |
   | `i18n/<default>/code.json`                       | —                     | `i18n/<lang>/code.json`                                 |
   | `i18n/<default>/docusaurus-theme-classic/*.json` | —                     | `i18n/<lang>/docusaurus-theme-classic/*.json`           |

   The `{{ }}` markers are removed from the output files. To write literal braces (e.g. i18next's `{{lng}}` inside a code block) escape them: `\{{lng}}` is written as `{{lng}}` and never sent for translation.

> Edit only files in `translate/`. Files in `docs/`, `blog/` and `i18n/` are generated and will be overwritten.

## Usage

### CLI

Create `translate.config.js` (or `translate.config.mjs`) in your project root:

```js
export default {
  sourceLang: 'en',
  targetLangs: ['es', 'fr', 'pt'],
  apiKey: process.env.TRANSLATE_PROJECTS_API_KEY,
  debug: false,
  // any translateProject option works here too, e.g. theme: { ignoreKeys: [] }
};
```

Add scripts to `package.json`:

```json
{
  "scripts": {
    "translate": "translate-projects-docusaurus",
    "translate:dev": "translate-projects-docusaurus --dev"
  }
}
```

```bash
npm run translate       # translate what changed
npx translate-projects-docusaurus --force  # re-translate everything, ignoring the cache
npm run translate:dev   # watch ./translate and sync the default locale
```

### Programmatic API

For full control (custom folders, disabling sections), call `translateProject` directly:

```js
// translate.js
const { translateProject } = require('translate-projects-docusaurus');

translateProject({
  defaultLocale: 'en',
  locales: ['es', 'fr'],
  apiKey: process.env.TRANSLATE_PROJECTS_API_KEY,
  debug: false,
});
```

```bash
node translate.js
```

## Configuration

Options accepted by `translateProject`:

| Option                 | Type       | Default            | Description                                                           |
| ---------------------- | ---------- | ------------------ | --------------------------------------------------------------------- |
| `defaultLocale`        | `string`   | — (required)       | Source language of your content.                                      |
| `locales`              | `string[]` | — (required)       | Target languages.                                                     |
| `apiKey`               | `string`   | — (required)       | Your Translate Projects API key.                                      |
| `debug`                | `boolean`  | `true`             | `true` runs watch mode only (no API calls). Set `false` to translate. |
| `force`                | `boolean`  | `false`            | Ignore the cache and translate every file again (CLI: `--force`).     |
| `config.outputDir`     | `string`   | `./i18n`           | Docusaurus i18n folder.                                               |
| `config.recreateFiles` | `boolean`  | `false`            | Regenerate `i18n/<lang>` files with `write-translations`.             |
| `docs.enable`          | `boolean`  | `true`             | Translate docs.                                                       |
| `docs.baseDir`         | `string`   | `./translate/docs` | Source docs folder.                                                   |
| `docs.outputDir`       | `string`   | `./docs`           | Generated docs folder (default locale).                               |
| `blog.enable`          | `boolean`  | `true`             | Translate blog.                                                       |
| `blog.baseDir`         | `string`   | `./translate/blog` | Source blog folder.                                                   |
| `blog.outputDir`       | `string`   | `./blog`           | Generated blog folder (default locale).                               |
| `react.enable`         | `boolean`  | `true`             | Translate `code.json` (React pages/components).                       |
| `theme.enable`         | `boolean`  | `true`             | Translate `docusaurus-theme-classic` JSON files.                      |
| `theme.ignoreKeys`     | `string[]` | `[]`               | Theme keys to keep untranslated.                                      |

> The CLI accepts every option below too (`sourceLang`/`targetLangs` are aliases of `defaultLocale`/`locales`).
>
> The API URL defaults to `https://api.translateprojects.dev`; override it with the `TRANSLATE_PROJECTS_API_URL` env var.

Supported source extensions: `.md`, `.mdx`, `.yml`, `.yaml`, `.json`, `.tsx`. Any other file is copied as-is.

## Development

```bash
npm install
npm run build   # compile to dist/
npm test        # build + node:test against a local mock API
npm run lint
```

## Support

If you have any questions, need help, or want to contribute, feel free to reach out:

- **Website**: [neiderruiz.com](https://neiderruiz.com)
- **GitHub**: [@neiderruiz](https://github.com/neiderruiz)
- **Twitter**: [@neiderruiz](https://x.com/neiderruiz_)
- **YouTube**: [Neider Ruiz](https://youtube.com/@neiderruiz)

## Support the Project

If you find this project useful, consider buying me a coffee to help me keep improving it. Your support means a lot! ☕

[![Buy me a coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=☕&slug=neiderruiz&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff)](https://www.buymeacoffee.com/neiderruiz)

## License

MIT
