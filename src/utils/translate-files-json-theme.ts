import fs from 'fs'
import path from 'path'
import { getTranslationsApi } from 'translate-projects-core'
import { TypeListLang } from 'translate-projects-core/types'
import { readJsonFile } from 'translate-projects-core/utils'
import { flattenWriteTranslationJson } from "./flatten-write-translation-json"
import { restructureJson } from './restructure-json'

type TypeProcessJsonFolders = {
    locale: TypeListLang
    defaultLocale: TypeListLang
    apiKey?: string
    ignoreKeys: string[]
}

export const translateFilesJsonTheme = async ({ locale, defaultLocale, apiKey, ignoreKeys }: TypeProcessJsonFolders) => {

    const folderTheme = path.join('i18n', locale, 'docusaurus-theme-classic');

    const filesTheme = fs.readdirSync(folderTheme);

    const promises = filesTheme.map(async (item) => {
        const itemPath = path.join(folderTheme, item);

        if (fs.statSync(itemPath).isDirectory()) {
            await translateFilesJsonTheme({
                locale,
                defaultLocale,
                apiKey,
                ignoreKeys
            })
        }

        if (!fs.statSync(itemPath).isDirectory() && item.endsWith('.json')) {
            const jsonData = readJsonFile(itemPath);

            const { simpleKeys, flattenedJson, ignoredKeys } = await flattenWriteTranslationJson(jsonData, ignoreKeys);

            const result = await getTranslationsApi({
                data: flattenedJson,
                sourceLang: defaultLocale,
                targetLang: locale,
                typeProject: 'docusaurus',
                apiKey,
                route_file: `docusaurus-theme-classic/${item}`
            })
            const filePathSave = path.join('i18n', locale, 'docusaurus-theme-classic', item);

            const restructuredJson = {
                ...ignoredKeys,
                ...restructureJson(result, jsonData, simpleKeys),
            };

            fs.writeFileSync(filePathSave, JSON.stringify(restructuredJson, null, 2));

            console.log(`       📦  Finish Translate json ${locale.toUpperCase()}  ${filePathSave} \n`);

        }
    })

    await Promise.all(promises)

}