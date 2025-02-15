import fs from "fs";
import path from "path";

import { makeTranslations, syncResources } from "translate-projects-core";
import { TypeListLang } from "translate-projects-core/types";
import { Logger, readJsonFile } from "translate-projects-core/utils";
import { flattenWriteTranslationJson, writeTranslationsCommand } from "../translation";
import { restructureJson } from "../utils";

type ConfigOptions = {
    locales: TypeListLang[];
    defaultLocale: TypeListLang;
    apiKey: string;
}

export const generateWriteTranslations = async ({ defaultLocale, locales, apiKey }: ConfigOptions) => {

    await Logger.info('Default lang')
    await writeTranslationsCommand(defaultLocale);

    const filePath = path.join('i18n', defaultLocale, 'code.json');

    const jsonData = readJsonFile(filePath);

    const { flattenedJson, simpleKeys } = await flattenWriteTranslationJson(jsonData);

    await syncResources({
        data: flattenedJson,
        sourceLang: defaultLocale,
        typeProject: 'docusaurus',
        apiKey,
        route_file: filePath
    });

    if (jsonData) {
        for (const locale of locales) {
            if (locale === defaultLocale) continue;

            await Logger.info(`📚 Running translations (${locale}) ... \n`);

            await writeTranslationsCommand(locale);

            const filePathSave = path.join('i18n', locale, 'code.json');

            const response = await makeTranslations({
                sourceLang: defaultLocale,
                targetLang: locale,
                apiKey,
                route_file: filePath
            })

            if (!response) {
                await Logger.error(`Don't translate file ${filePath} to ${locale}`);
                continue;
            }

            const restructuredJson = restructureJson(response, jsonData, simpleKeys);

            fs.writeFileSync(filePathSave, JSON.stringify(restructuredJson, null, 2));

            await Logger.success(`Finish translate ${filePathSave} to language ${locale.toUpperCase()}   \n`);
        }
    } else {
        await Logger.error('Don\'t read JSON file.');
    }

}