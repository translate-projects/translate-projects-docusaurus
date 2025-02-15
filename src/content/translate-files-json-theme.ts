import * as fs from 'fs'
import * as path from 'path'
import { makeTranslations, syncResources } from 'translate-projects-core'
import { TypeListLang } from 'translate-projects-core/types'
import { Logger, readJsonFile } from 'translate-projects-core/utils'
import { flattenWriteTranslationJson } from "../translation"
import { restructureJson } from '../utils'

type TypeProcessJsonFolders = {
    target_lang: TypeListLang
    defaultLocale: TypeListLang
    apiKey: string
    ignoreKeys: string[]
}

export const translateFilesJsonTheme = async ({ target_lang, defaultLocale, apiKey, ignoreKeys }: TypeProcessJsonFolders) => {
    const folderTheme = path.join('i18n', target_lang, 'docusaurus-theme-classic');

    let filesTheme: string[];
    try {
        filesTheme = fs.readdirSync(folderTheme);
    } catch (error: any) {
        await Logger.error(`❌ Errror read folder ${folderTheme}: ${error.message}`);
        return;
    }

    for (const item of filesTheme) {
        const itemPath = path.join(folderTheme, item);

        let stats;
        try {
            stats = fs.statSync(itemPath);
        } catch (error: any) {
            await Logger.error(`❌ Don't read ${itemPath}: ${error.message}`);
            continue;
        }

        if (stats.isDirectory()) {
            await translateFilesJsonTheme({
                target_lang,
                defaultLocale,
                apiKey,
                ignoreKeys
            });
            continue;
        }

        if (item.endsWith('.json')) {
            let jsonData;
            try {
                jsonData = readJsonFile(itemPath);
                if (!jsonData || typeof jsonData !== "object") {
                    throw new Error("JSON invalid or empty.");
                }
            } catch (error: any) {
                await Logger.error(`❌ Error al leer el JSON ${itemPath}: ${error.message}`);
                continue;
            }

            await Logger.info(`🔄 Translating ${itemPath}... \n`);
            const { simpleKeys, ignoredKeys } = await flattenWriteTranslationJson(jsonData, ignoreKeys);

            const result = await makeTranslations({
                sourceLang: defaultLocale,
                targetLang: target_lang,
                apiKey,
                route_file: `docusaurus-theme-classic/${item}`
            });

            if (!result) {
                await Logger.error(`❌ Don't translate file ${itemPath} to ${target_lang}`);
                continue;
            }

            const filePathSave = path.join(folderTheme, item);
            const restructuredJson = {
                ...ignoredKeys,
                ...restructureJson(result, jsonData, simpleKeys),
            };

            try {
                fs.writeFileSync(filePathSave, JSON.stringify(restructuredJson, null, 2));
                await Logger.success(`✅ Translation finished: ${filePathSave} to ${target_lang.toUpperCase()}   \n`);
            } catch (error: any) {
                await Logger.error(`❌ Error save ${filePathSave}: ${error.message}`);
            }
        }
    }
};



type SyncResourcesJsonFolders = {
    defaultLocale: TypeListLang,
    apiKey?: string,
    ignoreKeys: string[]
}

export const syncResourcesFilesJsonTheme = async ({ defaultLocale, apiKey, ignoreKeys }: SyncResourcesJsonFolders) => {

    const folderTheme = path.join('i18n', defaultLocale, 'docusaurus-theme-classic');

    const filesTheme = fs.readdirSync(folderTheme);

    const promises = filesTheme.map(async (item) => {
        const itemPath = path.join(folderTheme, item);

        if (fs.statSync(itemPath).isDirectory()) {
            await syncResourcesFilesJsonTheme({
                defaultLocale,
                apiKey,
                ignoreKeys
            })
        }

        if (!fs.statSync(itemPath).isDirectory() && item.endsWith('.json')) {
            const jsonData = readJsonFile(itemPath);

            const { flattenedJson } = await flattenWriteTranslationJson(jsonData, ignoreKeys);

            await syncResources({
                data: flattenedJson,
                sourceLang: defaultLocale,
                typeProject: 'docusaurus',
                apiKey,
                route_file: `docusaurus-theme-classic/${item}`
            })
        }
    })

    await Promise.all(promises)

}