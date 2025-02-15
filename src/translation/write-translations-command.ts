import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { Logger, readJsonFile } from 'translate-projects-core/utils';
import { removeItemsFromJson } from '../utils';

export const writeTranslationsCommand = async (lang: any) => {
    try {
        const command = `npm run write-translations -- --locale ${lang}`;

        await Logger.info(`🧪 Running command: ${command} \n`);

        const jsonCompact = await new Promise((resolve, reject) => {
            exec(command, async (error: any, stdout: any, stderr: any) => {
                if (error) {
                    await Logger.error(`Error---: ${error.message}`);
                    reject(error);
                } else if (stderr.includes('[WARNING] Some translation keys looks unknown to us')) {

                    const regex = /-\s+(.*?)(?:\n|$)/g;

                    let match;
                    const itemsDelete = [];

                    while ((match = regex.exec(stderr)) !== null) {
                        itemsDelete.push(match[1]);
                    }

                    const filePath = path.join('i18n', lang, 'code.json');

                    const jsonData = readJsonFile(filePath);

                    const filteredJson = removeItemsFromJson(jsonData, itemsDelete);

                    fs.writeFileSync(filePath, JSON.stringify(filteredJson, null, 2));

                    resolve(filteredJson);
                } else {
                    const filePath = path.join('i18n', lang, 'code.json');

                    const jsonData = readJsonFile(filePath);

                    const filteredJson = removeItemsFromJson(jsonData, []);

                    resolve(filteredJson);
                }
            });
        });

        return jsonCompact;

    } catch (error) {
        await Logger.error(`Failed to execute command: ${error}`);
    }
}