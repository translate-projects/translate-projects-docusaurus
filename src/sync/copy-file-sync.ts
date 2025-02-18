import fs from 'fs';
import path from 'path';
import { TypeListLang } from 'translate-projects-core/types';

type TypeCopyFile = {
  filePath: string;
  locale: TypeListLang;
  i18nDir: string;
};

export const copyFileSync = ({ filePath, locale, i18nDir }: TypeCopyFile) => {
  if (!filePath) {
    return;
  }
  const folderSave = filePath.split('/');
  const newFilePath = folderSave.slice(2).join('/');
  const base_folder = folderSave.slice(0, 2).join('/');

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

    console.log(`🔄  Copy file ${newFilePath} \n`);

    fs.copyFileSync(filePath, fullFilePath);

    // mover principal folder docs
    const principalLocaleDir = path.join('./docs', path.dirname(newFilePath));

    if (!fs.existsSync(principalLocaleDir)) {
      fs.mkdirSync(principalLocaleDir, { recursive: true });
    }

    const principalFilePath = path.join(
      principalLocaleDir,
      path.basename(newFilePath)
    );
    console.log(`🔄  Copy file ${newFilePath} principal folder. \n`);

    fs.copyFileSync(filePath, principalFilePath);
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

    console.log(`🔄  Copy file ${newFilePath} \n`);

    fs.copyFileSync(filePath, fullFilePath);

    // mover principal folder docs
    const principalLocaleDir = path.join('./blog', path.dirname(newFilePath));

    if (!fs.existsSync(principalLocaleDir)) {
      fs.mkdirSync(principalLocaleDir, { recursive: true });
    }

    const principalFilePath = path.join(
      principalLocaleDir,
      path.basename(newFilePath)
    );
    console.log(`🔄  Copy file ${newFilePath} principal folder. \n`);

    fs.copyFileSync(filePath, principalFilePath);
  }
};
