import fs from 'fs';
import path from 'path';
import { Logger } from 'translate-projects-core/utils';

export const deleteJsonFilesFolder = async (folderPath: string) => {
    if (!fs.existsSync(folderPath)) {
        await Logger.error(`The folder does not exist: ${folderPath}`);
        return;
    }

    const items = fs.readdirSync(folderPath);

    for (const item of items) {
        const itemPath = path.join(folderPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
            await deleteJsonFilesFolder(itemPath);
        } else if (stat.isFile() && path.extname(item) === '.json') {
            fs.unlinkSync(itemPath);
        }
    }
};