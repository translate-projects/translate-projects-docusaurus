import * as fs from 'fs';
import * as path from 'path';
import { processFileHashCache } from 'translate-projects-core/utils';

// List of allowed extensions
export const ALLOWED_EXTENSIONS = ['.md', '.mdx', '.yml', '.yaml', '.json', '.tsx'];

// Define the type for each file's information in the path cache
export interface FilePathData {
    path: string;
    cache_hash: string;
    translations: Record<string, { [key: string]: string }>;
    sources: Record<string, string>;
    in_cache?: boolean;
}

export const processDirectory = async (dir: string, onlyRoot?: boolean): Promise<{
    filesCache: Record<string, string>;
    filesPath: Record<string, FilePathData>;
}> => {
    // Read directory contents
    const items = fs.readdirSync(dir);

    // Store file hashes
    const filesCache: Record<string, string> = {};
    // Store file information
    const filesPath: Record<string, FilePathData> = {};

    for (const item of items) {
        const itemPath = path.join(dir, item);

        // Check if it's a directory
        if (fs.statSync(itemPath).isDirectory()) {
            if (!onlyRoot) {
                // If it's a directory, process it recursively and merge results
                const { filesCache: subFilesCache, filesPath: subFilesPath } = await processDirectory(itemPath);
                Object.assign(filesCache, subFilesCache);
                Object.assign(filesPath, subFilesPath);
            }
        } else {
            // Get file extension
            const fileExtension = path.extname(itemPath).toLowerCase();

            // Check if the extension is allowed
            if (ALLOWED_EXTENSIONS.includes(fileExtension)) {
                // If the file is allowed, process it
                const { contentHash, nameHash, translations, sources } = await processFileHashCache(itemPath);
                filesCache[nameHash] = contentHash;
                filesPath[nameHash] = {
                    path: itemPath,
                    cache_hash: contentHash,
                    translations: translations,
                    sources: sources,
                };
            }
        }
    }

    return {
        filesCache,
        filesPath,
    };
};
