import chokidar from 'chokidar';
import fs from 'fs';
import { TypeListLang } from 'translate-projects-core/dist/types/langs';
import { syncContentFile } from './sync-content-file';

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
        .on('add', (filePath: any) => {
            if (filePath.endsWith('.md') || filePath.endsWith('.yml')) {
                console.log(`✅ File added: ${filePath}`);
                syncContentFile({
                    filePath,
                    i18nDir,
                    locale
                });
            }
        })
        .on('change', (filePath: any) => {
            if (filePath.endsWith('.md') || filePath.endsWith('.yml')) {
                console.log(`🔄 Modified file: ${filePath}`);
                syncContentFile({
                    filePath,
                    i18nDir,
                    locale
                });
            }
        })
        .on('unlink', (filePath: any) => {
            if (filePath.endsWith('.md') || filePath.endsWith('.yml')) {
                console.log(`🛑 Deleted file: ${filePath}`);
            }
        });
};