import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { readJsonFile } from 'translate-projects-core/utils';
import { removeItemsFromJson } from './remove-items-from-json';

export const writeTranslationsCommand = async (lang: any) => {
    try {
        const command = `npm run write-translations -- --locale ${lang}`;

        console.log(`\n     🧪 Running command: ${command} \n`);

        const jsonCompact = await new Promise((resolve, reject) => {
            exec(command, (error: any, stdout: any, stderr: any) => {
                if (error) {
                    console.error(`Error---: ${error.message}`);
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
        console.error(`Failed to execute command: ${error}`);
    }
}