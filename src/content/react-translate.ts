import fs from "fs";
import path from "path";

import { makeTranslations, syncResources } from "translate-projects-core";
import { TypeListLang } from "translate-projects-core/types";
import { Logger, readJsonFile, updateFileCache } from "translate-projects-core/utils";
import { FilePathData } from "../cache/processing";
import { flattenWriteTranslationJson, writeTranslationsCommand } from "../translation";
import { restructureJson } from "../utils";

type ConfigOptions = {
    locales: TypeListLang[];
    defaultLocale: TypeListLang;
    apiKey: string;
    filesPaths: Record<string, FilePathData>
}

type Options = {
    defaultLocale: TypeListLang;
    apiKey: string;
    filesPaths: Record<string, FilePathData>
}

export const syncResourcesReactTranslate = async ({
    filesPaths,
    defaultLocale,
    apiKey
}: Options) => {

    const items = Object.entries(filesPaths);

    for (const [key, item] of items) {
        // if any file in cache
        if (item.in_cache && Object.keys(item.sources).length) {
            continue;
        }

        const jsonData = readJsonFile(item.path);

        const { flattenedJson } = await flattenWriteTranslationJson(jsonData);

        if (!Object.keys(flattenedJson).length) {
            await Logger.info(`❌ No se encontraron claves en ${item.path}. \n`)
            continue;
        }

        await Logger.info(`🔄 Syncing (${Object.keys(flattenedJson).length}) - ${item.path}... \n`);

        await syncResources({
            sourceLang: defaultLocale!,
            data: flattenedJson,
            typeProject: 'docusaurus',
            apiKey,
            route_file: item.path,
            cache_hash: item.cache_hash
        });

        await updateFileCache({
            fileHash: key,
            sources: flattenedJson,
        });
    }
}

export const reactTranslate = async ({ defaultLocale, locales, apiKey, filesPaths }: ConfigOptions) => {

    await Logger.info('Default lang')

    const filePath = path.join('i18n', defaultLocale, 'code.json');

    // react translations in JSON file
    const jsonData = readJsonFile(filePath);

    const { simpleKeys, flattenedJson } = await flattenWriteTranslationJson(jsonData);

    const items = Object.entries(filesPaths);

    for (const [key, item] of items) {
        for (const locale of locales) {

            const filePathSave = path.join('i18n', locale, 'code.json');

            let translations: any = {};

            if (locale === defaultLocale) {

                translations = flattenedJson;

                await updateFileCache({
                    fileHash: key,
                    translations: { [locale]: translations },
                });
            };

            if (defaultLocale !== locale) {

                if (item.translations[locale] && item.in_cache) {
                    if (Object.keys(item.translations[locale]).length) {
                        translations = item.translations[locale];
                    }
                }

                if (!item.translations[locale] || !item.in_cache) {
                    if (Object.keys(jsonData).length) {

                        await Logger.info(`📚 Running translations (${locale}) ... \n`);

                        await writeTranslationsCommand(locale);

                        translations = await makeTranslations({
                            sourceLang: defaultLocale,
                            targetLang: locale,
                            apiKey,
                            route_file: filePath
                        })

                        await updateFileCache({
                            fileHash: key,
                            translations: { [locale]: translations },
                        });

                    }
                }

            }

            if (!translations) {
                await Logger.error(`Don't translate file ${filePath} to ${locale}`);
                continue;
            }

            const restructuredJson = restructureJson(translations, jsonData, simpleKeys);

            fs.writeFileSync(filePathSave, JSON.stringify(restructuredJson, null, 2));

            if (locale !== defaultLocale) {
                await Logger.success(`Finish translate ${filePathSave} to language ${locale.toUpperCase()}   \n`);
            }
        }
    }
}