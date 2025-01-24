import fs from 'fs';
import path from 'path';
import { TypeListLang } from 'translate-projects-core/types';

type Options = {
    locales: TypeListLang[];
    i18nDir: string;
    itemRelativePath: string;
    itemPath: string;
    item: string;
    defaultLocale: TypeListLang;
    defaultFolder: string;
    baseFolderSave: string;
}

export const copyFilesFolder = ({
    locales,
    i18nDir,
    itemRelativePath,
    itemPath,
    item,
    defaultLocale,
    defaultFolder,
    baseFolderSave
}: Options) => {
    // move file to all locales
    locales.forEach((locale) => {
        const localeDir = path.join(
            i18nDir,
            locale,
            baseFolderSave,
            path.dirname(itemRelativePath)
        );

        if (!fs.existsSync(localeDir)) {
            fs.mkdirSync(localeDir, { recursive: true });
        }

        const outputFilePath = path.join(localeDir, item);
        fs.copyFileSync(itemPath, outputFilePath);

        const routeOutputLog = path.join(
            locale,
            baseFolderSave,
            path.dirname(itemRelativePath),
            item
        );

        if (defaultLocale == locale) {
            const routeFilesDoc = path.join(
                defaultFolder,
                path.dirname(itemRelativePath),
            );

            if (!fs.existsSync(routeFilesDoc)) {
                fs.mkdirSync(routeFilesDoc, { recursive: true });
            }

            const outputFileDoc = path.join(routeFilesDoc, item);
            fs.copyFileSync(itemPath, outputFileDoc);
        }

        console.log(`🔄 (File - Copied): ${routeOutputLog}`);
    });
}