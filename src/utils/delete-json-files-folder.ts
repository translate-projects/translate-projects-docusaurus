import fs from 'fs';
import path from 'path';

export const deleteJsonFilesFolder = (folderPath: string) => {
    if (!fs.existsSync(folderPath)) {
        console.error(`The folder does not exist: ${folderPath}`);
        return;
    }

    const items = fs.readdirSync(folderPath);

    for (const item of items) {
        const itemPath = path.join(folderPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
            deleteJsonFilesFolder(itemPath);
        } else if (stat.isFile() && path.extname(item) === '.json') {
            fs.unlinkSync(itemPath);
            console.log(`🛑 Recreate Files: ${itemPath} \n`);
        }
    }
};