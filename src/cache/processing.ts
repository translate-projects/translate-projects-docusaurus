import * as fs from 'fs';
import * as path from 'path';
import { processFileHashCache } from 'translate-projects-core/utils';
import { FilePathData } from '../types/file-path-data';

// List of allowed extensions
export const ALLOWED_EXTENSIONS = [
  '.md',
  '.mdx',
  '.yml',
  '.yaml',
  '.json',
  '.tsx',
];

export type ProcessDirectoryOptions = {
  dir: string;
  onlyRoot?: boolean;
  allowedExtensions?: string[];
};

export const processDirectory = async ({
  dir,
  onlyRoot = false,
  allowedExtensions = ALLOWED_EXTENSIONS,
}: ProcessDirectoryOptions): Promise<{
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
        const { filesCache: subFilesCache, filesPath: subFilesPath } =
          await processDirectory({
            dir: itemPath,
            allowedExtensions,
            onlyRoot,
          });
        Object.assign(filesCache, subFilesCache);
        Object.assign(filesPath, subFilesPath);
      }
    } else {
      // Get file extension
      const fileExtension = path.extname(itemPath).toLowerCase();

      // Check if the extension is allowed
      if (allowedExtensions.includes(fileExtension)) {
        // If the file is allowed, process it
        const { contentHash, nameHash, translations, sources } =
          await processFileHashCache({
            filePath: itemPath,
          });
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
