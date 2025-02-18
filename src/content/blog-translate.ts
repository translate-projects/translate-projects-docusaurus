import fs from 'fs';
import path from 'path';

import { makeTranslations, syncResources } from 'translate-projects-core';
import { TypeJson, TypeListLang } from 'translate-projects-core/types';
import { Logger, updateFileCache } from 'translate-projects-core/utils';
import { copyFilesFolder } from '../sync';
import { extractKeysAndTexts, replaceContentFile } from "../texts";
import { FilePathData } from '../types/file-path-data';
import { generateListFilesSync } from '../utils/generate-files-sync';

type TypeBlogTranslate = {
    dir: string;
    baseBlogDir: string;
    i18nDir: string;
    defaultLocale: TypeListLang;
    locales: TypeListLang[];
    blogDir?: string;
    apiKey: string;
    outputBlogDir: string;
    filesPaths: Record<string, FilePathData>
}


export const blogTranslate = async ({
    dir,
    defaultLocale,
    locales,
    i18nDir = './i18n',
    baseBlogDir,
    outputBlogDir,
    apiKey,
    filesPaths
}: TypeBlogTranslate) => {
    const items = Object.entries(filesPaths);
    for (const [key, item] of items) {

        const itemRelativePath = path.relative(baseBlogDir, item.path);
        const itemPath = path.basename(item.path);

        const content = fs.readFileSync(item.path, 'utf8');
        const keysAndTexts = await extractKeysAndTexts(content);
        const localeArray = defaultLocale ? [defaultLocale, ...locales] : locales;

        for (const locale of localeArray) {
            let translations: TypeJson = {};

            if (defaultLocale === locale) {
                translations = keysAndTexts;
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

                if (!item.translations[locale] || !item.in_cache && Object.keys(keysAndTexts).length) {

                    if (Object.keys(keysAndTexts).length) {

                        await Logger.info(`Translating file ${item.path} blog (${locale})... \n`)

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
            }

            const translatedContent = replaceContentFile({
                contentFile: content,
                keysAndTexts,
                originalTranslations: translations
            });

            const localeDir = path.join(
                i18nDir,
                locale,
                'docusaurus-plugin-content-blog',
                path.dirname(itemRelativePath)
            );

            if (!fs.existsSync(localeDir)) {
                fs.mkdirSync(localeDir, { recursive: true });
            }

            const outputFilePath = path.join(localeDir, itemPath);

            if (defaultLocale === locale) {
                const baseDocsPath = path.join(
                    outputBlogDir,
                    path.dirname(itemRelativePath)
                );

                if (!fs.existsSync(baseDocsPath)) {
                    fs.mkdirSync(baseDocsPath, { recursive: true });
                }

                const routeFileSaveDoc = path.join(
                    outputBlogDir,
                    path.dirname(itemRelativePath),
                    itemPath
                );

                fs.writeFileSync(routeFileSaveDoc, translatedContent);
            }

            fs.writeFileSync(outputFilePath, translatedContent);
        }
    }

    const filesSync = await generateListFilesSync(dir, baseBlogDir);

    if (filesSync.length) {
        await Logger.info(`Syncing ${filesSync.length} files (blog)... \n`)
    }

    filesSync.forEach((item) => {
        copyFilesFolder({
            defaultFolder: outputBlogDir,
            defaultLocale,
            i18nDir,
            item: item.item,
            itemPath: item.itemPath,
            itemRelativePath: item.itemRelativePath,
            locales,
            baseFolderSave: 'docusaurus-plugin-content-blog'
        })
    })
};



export const syncResourcesBlogTranslate = async ({
    defaultLocale,
    apiKey,
    filesPaths,
}: TypeBlogTranslate) => {

    const items = Object.entries(filesPaths);

    for (const [key, item] of items) {
        if (item.in_cache && Object.keys(item.sources).length) {
            continue;
        }
        const content = fs.readFileSync(item.path, 'utf8');

        const keysAndTexts = await extractKeysAndTexts(content);

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