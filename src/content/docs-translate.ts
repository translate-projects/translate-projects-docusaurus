import fs from 'fs';
import path from 'path';
import { makeTranslations, syncResources } from 'translate-projects-core';
import { TypeListLang } from 'translate-projects-core/types';
import { Logger, updateFileCache } from 'translate-projects-core/utils';
import { FilePathData } from '../cache/processing';
import { copyFilesFolder } from '../sync';
import { extractKeysAndTexts, replaceContentFile } from "../texts";
import { generateListFilesSync } from '../utils/generate-files-sync';

type Options = {
    dir: string;
    baseDocsDir: string;
    i18nDir: string;
    defaultLocale: TypeListLang;
    locales: TypeListLang[];
    outputDocDir: string;
    apiKey: string;
    filesPaths: Record<string, FilePathData>
}

export const docsTranslate = async ({
    filesPaths,
    dir,
    baseDocsDir,
    defaultLocale,
    locales,
    i18nDir,
    outputDocDir,
    apiKey
}: Options) => {

    const items = Object.entries(filesPaths);

    for (const [key, item] of items) {

        const itemRelativePath = path.relative(baseDocsDir, item.path);
        const itemPath = path.basename(item.path);

        const content = fs.readFileSync(item.path, 'utf8');
        const keysAndTexts = await extractKeysAndTexts(content);
        const localeArray = defaultLocale ? [defaultLocale, ...locales] : locales;

        for (const locale of localeArray) {
            let translations: any = {};
            if (defaultLocale === locale) {
                translations = keysAndTexts;
                await updateFileCache({
                    fileHash: key,
                    translations: { [locale]: translations },
                });
            }
            if (defaultLocale !== locale) {

                if (item.translations[defaultLocale] && item.in_cache) {
                    if (Object.keys(item.translations[defaultLocale]).length) {
                        translations = item.translations[defaultLocale];
                    }
                }
                if (!item.translations[defaultLocale] || !item.in_cache && Object.keys(keysAndTexts).length) {
                    await Logger.info(`Translating file ${item.path} documentation (${locale})... \n`)
                    translations = await makeTranslations({
                        sourceLang: defaultLocale!,
                        targetLang: locale,
                        apiKey,
                        route_file: item.path,
                        cache_hash: item.cache_hash
                    });

                    await updateFileCache({
                        fileHash: key,
                        translations: { [locale]: translations },
                    });
                }
            }

            const localeDir = path.join(
                i18nDir,
                locale,
                'docusaurus-plugin-content-docs/current',
                path.dirname(itemRelativePath)
            );

            if (!fs.existsSync(localeDir)) {
                fs.mkdirSync(localeDir, { recursive: true });
            }

            const outputFilePath = path.join(localeDir, itemPath);

            const translatedContent = replaceContentFile({
                contentFile: content,
                keysAndTexts,
                originalTranslations: translations
            });

            if (defaultLocale === locale) {
                const baseDocsPath = path.join(
                    outputDocDir,
                    path.dirname(itemRelativePath)
                );

                if (!fs.existsSync(baseDocsPath)) {
                    fs.mkdirSync(baseDocsPath, { recursive: true });
                }

                const routeFileSaveDoc = path.join(
                    outputDocDir,
                    path.dirname(itemRelativePath),
                    itemPath
                );

                fs.writeFileSync(routeFileSaveDoc, translatedContent);
            }

            fs.writeFileSync(outputFilePath, translatedContent);
        }

    }
    const filesSync = await generateListFilesSync(dir, baseDocsDir);

    if (filesSync.length) {
        await Logger.info(`🗂️  Syncing ${filesSync.length} files (docs)... \n`)
    }

    filesSync.forEach((item) => {
        copyFilesFolder({
            defaultFolder: outputDocDir,
            defaultLocale,
            i18nDir,
            item: item.item,
            itemPath: item.itemPath,
            itemRelativePath: item.itemRelativePath,
            locales,
            baseFolderSave: 'docusaurus-plugin-content-docs/current'
        })
    })
};


export const syncResourcesDocsTranslate = async ({
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

        const content = fs.readFileSync(item.path, 'utf8');
        const keysAndTexts = await extractKeysAndTexts(content);

        if (!Object.keys(keysAndTexts).length) {
            await Logger.info(`❌ No se encontraron claves en ${item.path}. \n`)
            continue;
        }

        await Logger.info(`🔄 Syncing (${Object.keys(keysAndTexts).length}) - ${item.path}... \n`);

        await syncResources({
            sourceLang: defaultLocale!,
            data: keysAndTexts,
            typeProject: 'docusaurus',
            apiKey,
            route_file: item.path,
            cache_hash: item.cache_hash
        });

        await updateFileCache({
            fileHash: key,
            sources: keysAndTexts,
        });
    }

};