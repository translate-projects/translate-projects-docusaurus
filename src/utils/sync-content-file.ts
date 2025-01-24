import fs from 'fs';
import path from 'path';
import { TypeListLang } from 'translate-projects-core/types';
import { extractKeysAndTexts } from './extract-keys-and-texts';

type ReadFileType = {
    filePath: string
    locale: TypeListLang
    i18nDir: string
}

export const syncContentFile = ({
    filePath,
    locale,
    i18nDir
}: ReadFileType) => {

    if (!filePath) {
        return
    }

    const folderSave = filePath.split('/')
    const newFilePath = folderSave.slice(2).join('/');

    const base_folder = folderSave.slice(0, 2).join('/');

    const content = fs.readFileSync(filePath, 'utf8');
    const keysAndTexts = extractKeysAndTexts(content);

    let translatedContent = content;

    for (const [key, value] of Object.entries(keysAndTexts)) {
        translatedContent = translatedContent.replace(new RegExp(`{{${value}\\.*?}}`, 'g'), value as any);
    }

    // is folder doc
    if (base_folder == 'translate/docs') {
        const localeDir = path.join(
            i18nDir,
            locale,
            'docusaurus-plugin-content-docs/current',
            path.dirname(newFilePath)
        );

        if (!fs.existsSync(localeDir)) {
            fs.mkdirSync(localeDir, { recursive: true });
        }

        const fullFilePath = path.join(localeDir, path.basename(newFilePath));

        fs.writeFileSync(fullFilePath, translatedContent)

        // sync principal folder docs

        const principalLocaleDir = path.join(
            './docs',
            path.dirname(newFilePath)
        )

        if (!fs.existsSync(principalLocaleDir)) {
            fs.mkdirSync(principalLocaleDir, { recursive: true });
        }

        const principalFilePath = path.join(principalLocaleDir, path.basename(newFilePath));

        fs.writeFileSync(principalFilePath, translatedContent)
    }

    if (base_folder == 'translate/blog') {

        const localeDir = path.join(
            i18nDir,
            locale,
            'docusaurus-plugin-content-blog',
            path.dirname(newFilePath)
        );

        if (!fs.existsSync(localeDir)) {
            fs.mkdirSync(localeDir, { recursive: true });
        }

        const fullFilePath = path.join(localeDir, path.basename(newFilePath));

        fs.writeFileSync(fullFilePath, translatedContent)

        // sync principal folder blog

        const principalLocaleDir = path.join(
            './blog',
            path.dirname(newFilePath)
        )

        if (!fs.existsSync(principalLocaleDir)) {
            fs.mkdirSync(principalLocaleDir, { recursive: true });
        }

        const principalFilePath = path.join(principalLocaleDir, path.basename(newFilePath));

        fs.writeFileSync(principalFilePath, translatedContent)
    }

};