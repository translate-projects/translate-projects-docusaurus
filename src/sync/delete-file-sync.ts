import fs from 'fs';
import path from 'path';
import { TypeListLang } from "translate-projects-core/types";

type TypeRemoveFile = {
    filePath: string
    i18nDir: string
    locale: TypeListLang
}

export const deleteFileSync = ({
    filePath,
    i18nDir,
    locale,
}: TypeRemoveFile) => {
    const folderSave = filePath.split('/')
    const newFilePath = folderSave.slice(2).join('/');
    const base_folder = folderSave.slice(0, 2).join('/');

    if (base_folder == 'translate/docs') {
        const localeDir = path.join(
            i18nDir,
            locale,
            'docusaurus-plugin-content-docs/current',
            path.dirname(newFilePath)
        );

        fs.unlinkSync(path.join(localeDir, path.basename(newFilePath)));

        console.log(`🛑 Deleted file: ${path.join(localeDir, path.basename(newFilePath))}`);

        // remove principal folder docs

        const principalLocaleDir = path.join(
            './docs',
            path.dirname(newFilePath)
        )

        if (fs.existsSync(principalLocaleDir)) {
            const filePath = path.join(principalLocaleDir, path.basename(newFilePath));

            // Eliminar el archivo si existe
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted file: ${filePath}`);
            }

            // Verificar si la carpeta quedó vacía y eliminarla
            if (fs.readdirSync(principalLocaleDir).length === 0) {
                fs.rmdirSync(principalLocaleDir);
                console.log(`Deleted empty directory: ${principalLocaleDir}`);
            }
        }
    }

    if (base_folder == 'translate/blog') {

        const localeDir = path.join(
            i18nDir,
            locale,
            'docusaurus-plugin-content-blog',
            path.dirname(newFilePath)
        );

        fs.unlinkSync(path.join(localeDir, path.basename(newFilePath)));

        console.log(`🛑 Deleted file: ${path.join(localeDir, path.basename(newFilePath))}`);

        // remove principal folder docs

        const principalLocaleDir = path.join(
            './blog',
            path.dirname(newFilePath)
        )

        if (fs.existsSync(principalLocaleDir)) {
            const filePath = path.join(principalLocaleDir, path.basename(newFilePath));

            // Eliminar el archivo si existe
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted file: ${filePath}`);
            }

            // Verificar si la carpeta quedó vacía y eliminarla
            if (fs.readdirSync(principalLocaleDir).length === 0) {
                fs.rmdirSync(principalLocaleDir);
                console.log(`Deleted empty directory: ${principalLocaleDir}`);
            }
        }
    }

}