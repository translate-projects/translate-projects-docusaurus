import chokidar from 'chokidar';
import fs from 'fs';
import { TypeListLang } from 'translate-projects-core/types';
import { contentFileSync } from './content-file-sync';
import { copyFileSync } from './copy-file-sync';
import { deleteFileSync } from './delete-file-sync';

type ReadChangeFiles = {
    folder: string
    locale: TypeListLang
    i18nDir: string
}

export const detectChangeFiles = ({ folder, locale, i18nDir }: ReadChangeFiles) => {
    if (!fs.existsSync(folder)) {
        console.error(`The folder "${folder}" does not exist.`);
        return;
    }

    console.log(`👀 Monitoring changes in the folder: ${folder}`);

    const watcher: any = chokidar.watch(folder, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 1000,
            pollInterval: 100
        }
    });

    // listening
    watcher
        .on('add', async (filePath: any) => {
            if (filePath.endsWith('.md') || filePath.endsWith('.yml') || filePath.endsWith('.mdx')) {
                console.log(`✅ File added: ${filePath}`);
                await contentFileSync({
                    filePath,
                    i18nDir,
                    locale
                });

                return;
            }

            copyFileSync({
                filePath,
                i18nDir,
                locale
            })
        })
        .on('change', async (filePath: any) => {
            if (filePath.endsWith('.md') || filePath.endsWith('.yml') || filePath.endsWith('.mdx')) {
                console.log(`🔄 Modified file: ${filePath}`);
                await contentFileSync({
                    filePath,
                    i18nDir,
                    locale
                });
                return;
            }

            copyFileSync({
                filePath,
                i18nDir,
                locale
            })
        })
        .on('unlink', async (filePath: any) => {
            deleteFileSync({
                filePath,
                i18nDir,
                locale,
            })
            console.log(`🛑 Deleted file: ${filePath}`);
        });
};