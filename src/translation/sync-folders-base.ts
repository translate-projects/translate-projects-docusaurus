import * as fs from 'fs';
import * as path from 'path';
import { TypeJson, TypeListLang } from 'translate-projects-core/types';
import { updateFileCache } from 'translate-projects-core/utils';
import { extractKeysAndTexts, replaceContentFile } from '../texts';
import { generateListFilesSync } from '../utils/generate-files-sync';
import { validateChangesServerFiles } from './validate-changes';

type SyncFoldersBaseOptions = {
  sourceLang: TypeListLang;
  apiKey: string;
  outputDir: string;
  baseDir: string;
};

export const syncFoldersBase = async ({
  sourceLang,
  apiKey,
  outputDir,
  baseDir,
}: SyncFoldersBaseOptions) => {
  const filesPath = await validateChangesServerFiles({
    apiKey,
    dir: baseDir,
  });

  const items = Object.entries(filesPath);

  for (const [key, item] of items) {
    const itemRelativePath = path.relative(baseDir, item.path);
    const content = fs.readFileSync(item.path, 'utf8');
    const keysAndTexts = await extractKeysAndTexts(content);

    let translations: TypeJson = {};
    translations = keysAndTexts;

    await updateFileCache({
      fileHash: key,
      translations: { [sourceLang]: translations },
    });

    const translatedContent = replaceContentFile({
      contentFile: content,
      keysAndTexts,
      originalTranslations: translations,
    });

    // outpout dir save
    const localeDir = path.join(outputDir, path.dirname(itemRelativePath));

    if (!fs.existsSync(localeDir)) {
      fs.mkdirSync(localeDir, { recursive: true });
    }

    const routeFileSaveDoc = path.join(outputDir, itemRelativePath);

    fs.writeFileSync(routeFileSaveDoc, translatedContent);
  }

  const filesSync = await generateListFilesSync(baseDir, baseDir);

  filesSync.forEach((item) => {
    const localeDir = path.join(outputDir, path.dirname(item.itemRelativePath));
    const outputFilePath = path.join(localeDir, item.item);

    if (!fs.existsSync(localeDir)) {
      fs.mkdirSync(localeDir, { recursive: true });
    }
    fs.copyFileSync(item.itemPath, outputFilePath);
  });
};
