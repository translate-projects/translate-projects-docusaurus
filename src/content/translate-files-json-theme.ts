import * as fs from 'fs';
import * as path from 'path';
import { makeTranslations, syncResources } from 'translate-projects-core';
import { TypeJson, TypeListLang } from 'translate-projects-core/types';
import {
  Logger,
  readJsonFile,
  updateFileCache,
} from 'translate-projects-core/utils';
import { flattenWriteTranslationJson } from '../translation';
import { FilePathData } from '../types/file-path-data';
import { restructureJson } from '../utils';

type TranslateFilesJsonThemeOptions = {
  defaultLocale: TypeListLang;
  apiKey: string;
  ignoreKeys: string[];
  filesPaths: Record<string, FilePathData>;
  locales: TypeListLang[];
  i18nDir: string;
};

export const translateFilesJsonTheme = async ({
  defaultLocale,
  apiKey,
  ignoreKeys,
  filesPaths,
  locales,
  i18nDir,
}: TranslateFilesJsonThemeOptions) => {
  const items = Object.entries(filesPaths);

  for (const [key, item] of items) {
    let translations: TypeJson = {};
    for (const locale of locales) {
      const jsonData = readJsonFile(item.path);

      if (!jsonData || typeof jsonData !== 'object') {
        continue;
      }

      const { flattenedJson, ignoredKeys, simpleKeys } =
        await flattenWriteTranslationJson(jsonData, ignoreKeys);

      if (locale === defaultLocale) {
        translations = flattenedJson;
        await updateFileCache({
          fileHash: key,
          translations: { [locale]: translations },
        });
      }

      if (defaultLocale !== locale) {
        if (item.translations[locale] && item.in_cache) {
          if (Object.keys(item.translations[locale]).length) {
            translations = item.translations[locale];
          }
        }
        if (!item.translations[locale] || !item.in_cache) {
          if (Object.keys(jsonData).length) {
            translations = await makeTranslations({
              sourceLang: defaultLocale,
              targetLang: locale,
              apiKey,
              route_file: item.path,
              cache_hash: item.cache_hash,
            });

            await updateFileCache({
              fileHash: key,
              translations: { [locale]: translations },
            });

            if (!translations) {
              await Logger.error(
                `❌ Don't translate file ${item.path} to ${locale}`
              );
              continue;
            }
          }
        }
      }

      const localeDir = path.join(i18nDir, locale, 'docusaurus-theme-classic');

      const itemPath = path.basename(item.path);

      const outputFilePath = path.join(localeDir, itemPath);

      const restructuredJson = {
        ...ignoredKeys,
        ...restructureJson(translations, jsonData, simpleKeys),
      };

      try {
        fs.writeFileSync(
          outputFilePath,
          JSON.stringify(restructuredJson, null, 2)
        );
        await Logger.success(
          `Translation sync: ${outputFilePath} to ${locale.toUpperCase()}   \n`
        );
      } catch (error: unknown) {
        if (error instanceof Error) {
          await Logger.error(
            `Error saving ${outputFilePath}: ${error.message}`
          );
        } else {
          await Logger.error(
            `Unknown error saving ${outputFilePath}: ${String(error)}`
          );
        }
      }
    }
  }
};

type SyncResourcesJsonFolders = {
  defaultLocale: TypeListLang;
  apiKey?: string;
  ignoreKeys: string[];
  filesPaths: Record<string, FilePathData>;
};

export const syncResourcesFilesJsonTheme = async ({
  defaultLocale,
  apiKey,
  ignoreKeys,
  filesPaths,
}: SyncResourcesJsonFolders) => {
  const items = Object.entries(filesPaths);
  for (const [key, item] of items) {
    // if any file in cache
    if (item.in_cache && Object.keys(item.sources).length) {
      continue;
    }

    const jsonData = readJsonFile(item.path);

    const { flattenedJson } = await flattenWriteTranslationJson(
      jsonData,
      ignoreKeys
    );

    await syncResources({
      data: flattenedJson,
      sourceLang: defaultLocale,
      typeProject: 'docusaurus',
      apiKey,
      route_file: item.path,
      cache_hash: item.cache_hash,
    });

    await updateFileCache({
      fileHash: key,
      sources: flattenedJson,
    });
  }
};
