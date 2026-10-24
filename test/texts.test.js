const test = require('node:test');
const assert = require('node:assert');
const { extractKeysAndTexts, replaceContentFile } = require('../dist/texts');

test('extracts {{ }} texts and replaces them with translations', async () => {
  const content = '# {{Hola}}\n\n{{ Adiós }} y {{Hola}}';
  const keys = await extractKeysAndTexts(content);
  assert.deepStrictEqual(Object.values(keys).sort(), ['Adiós', 'Hola']);

  const translations = {};
  for (const [k, v] of Object.entries(keys)) translations[k] = `EN ${v}`;
  const [hola] = Object.keys(keys).filter((k) => keys[k] === 'Hola');
  const out = replaceContentFile({
    contentFile: content,
    keysAndTexts: { [hola]: 'Hola' },
    originalTranslations: translations,
  });
  assert.strictEqual(out, '# EN Hola\n\n{{ Adiós }} y EN Hola');
});

test('missing translations fall back to the source text, never "undefined"', async () => {
  const content = '{{Hola}} {{Mundo}}';
  const keys = await extractKeysAndTexts(content);
  const [hola] = Object.keys(keys).filter((k) => keys[k] === 'Hola');
  const out = replaceContentFile({
    contentFile: content,
    keysAndTexts: keys,
    originalTranslations: { [hola]: 'Hello' },
  });
  assert.strictEqual(out, 'Hello Mundo');
  const none = replaceContentFile({
    contentFile: content,
    keysAndTexts: keys,
    originalTranslations: null,
  });
  assert.strictEqual(none, 'Hola Mundo');
});

test('pickTranslations keeps only the file keys and lists the missing ones', () => {
  const { pickTranslations } = require('../dist/utils');
  const all = { a: 'A', b: 'B', other: 'X', c: null };
  assert.deepStrictEqual(
    pickTranslations(all, { a: 'a', b: 'b', c: 'c', d: 'd' }),
    {
      translations: { a: 'A', b: 'B' },
      missing: ['c', 'd'],
    }
  );
  assert.deepStrictEqual(pickTranslations(null, { a: 'a' }).missing, ['a']);
});
