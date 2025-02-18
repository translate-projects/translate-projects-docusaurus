import * as fs from 'fs';
import * as path from 'path';
import { ALLOWED_EXTENSIONS } from '../cache/processing';

export const generateListFilesSync = async (dir: string, baseDir: string) => {
  const filesSync: Array<{
    item: string; // File name
    itemPath: string; // Absolute file path
    itemRelativePath: string; // Relative file path (based on baseDir)
  }> = [];

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const itemPath = path.join(dir, item);
    const itemRelativePath = path.relative(baseDir, itemPath);

    if (fs.statSync(itemPath).isDirectory()) {
      const subDirFiles = await generateListFilesSync(itemPath, baseDir);
      filesSync.push(...subDirFiles);
    } else {
      const ext = path.extname(item).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        filesSync.push({
          item,
          itemPath,
          itemRelativePath,
        });
      }
    }
  }

  return filesSync;
};
