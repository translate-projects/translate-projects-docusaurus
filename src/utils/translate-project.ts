import fs from 'fs';
import path from 'path';
import { TypeListLang } from 'translate-projects-core/types';
import { BlogConfig, DocsConfig, GeneralConfig, ReactConfig, ThemeConfig } from '../types/types-translate-project';
import { blogTranslate } from './blog-translate';
import { deleteJsonFilesFolder } from './delete-json-files-folder';
import { detectChangeFiles } from './detect-change-files';
import { docsTranslate } from './docs-translate';
import { generateWriteTranslations } from './generate-write-translations';
import { translateFilesJsonTheme } from './translate-files-json-theme';
import { writeTranslationsCommand } from './write-translations-command';

export type ConfigOptions = {
    config?: GeneralConfig;
    locales: TypeListLang[];
    defaultLocale?: TypeListLang;
    apiKey?: string;
    debug?: boolean;
    blog?: BlogConfig;
    docs?: DocsConfig;
    react?: ReactConfig;
    theme?: ThemeConfig;
};

const blogConfigDefault: BlogConfig = {
    baseDir: './translate/blog',
    outputDir: './blog',
    enable: true,
};

const docsConfigDefault: DocsConfig = {
    baseDir: './translate/docs',
    outputDir: './docs',
    enable: true,
};

const configDefault: GeneralConfig = {
    outputDir: './i18n',
};

const themeConfigDefault: ThemeConfig = {
    enable: true,
    ignoreKeys: [],
};

export async function translateProject({
    defaultLocale,
    locales = [],
    apiKey,
    debug = true,
    config = configDefault,
    blog = blogConfigDefault,
    docs = docsConfigDefault,
    react = {
        enable: false
    },
    theme = themeConfigDefault

}: ConfigOptions): Promise<void> {

    const blog_config = {
        ...blogConfigDefault,
        ...blog,
    }

    const docs_config = {
        ...docsConfigDefault,
        ...docs
    }

    const config_base = {
        ...configDefault,
        ...config
    }

    const theme_config = {
        ...themeConfigDefault,
        ...theme
    }

    if (!defaultLocale) {
        console.log(`🛑 required param { config: { defaultLocale: 'es'} } \n`)
        return;
    }

    if (!locales?.length) {
        console.log(`🛑 required param { config: { locales: ['en','fr']} } \n`)
        return;
    }

    const locales_config = [defaultLocale, ...locales]

    if (debug) {
        detectChangeFiles({
            folder: './translate',
            i18nDir: config_base.outputDir,
            locale: defaultLocale
        })
        return;
    }

    if (!blog_config.enable) {
        console.log('\n 🚫 Not translate blog \n');
    }

    if (!docs_config.enable) {
        console.log('\n 🚫 Not translate docs \n');
    }

    if (!react.enable) {
        console.log('\n 🚫 Not translate react files \n');
    }

    if (blog?.enable) {
        if (!fs.existsSync(blog_config.baseDir)) {
            console.error(`El directorio ${blog_config.baseDir} no existe.`);
            process.exit(1);
        }

        await blogTranslate({
            dir: blog_config.baseDir,
            locales: locales_config,
            defaultLocale: defaultLocale,
            outputBlogDir: blog_config.outputDir,
            i18nDir: config_base.outputDir,
            apiKey,
            baseBlogDir: blog_config.baseDir,
        })
        console.log('\n Finish translated blog 🎫')
    }


    if (docs_config.enable) {
        if (!fs.existsSync(docs_config.baseDir)) {
            console.error(`El directorio ${docs_config.baseDir} no existe.`);
            process.exit(1);
        }
        await docsTranslate({
            dir: docs_config.baseDir,
            locales: locales_config,
            defaultLocale: defaultLocale,
            baseDocsDir: docs_config.baseDir,
            i18nDir: config_base.outputDir,
            outputDocDir: docs_config.outputDir,
            apiKey
        });

        console.log('\n Finish translated documents 📋')
    }

    if (react.enable) {
        await generateWriteTranslations({
            locales: locales_config,
            defaultLocale: defaultLocale,
            apiKey
        })
    }

    if (theme_config.enable) {
        for (const locale of locales_config) {

            // check exist file
            const filePath = path.join('i18n', locale, 'code.json');

            if (!fs.existsSync(filePath) || theme_config.recreateFiles) {

                console.log(`🧑🏽‍💻 recreating translations: ${locale} \n`)

                const folderTheme = path.join('i18n', locale, 'docusaurus-theme-classic');

                deleteJsonFilesFolder(folderTheme);

                await writeTranslationsCommand(locale)
            }

            await translateFilesJsonTheme({
                locale,
                defaultLocale: defaultLocale,
                apiKey,
                ignoreKeys: theme_config.ignoreKeys
            })
        }
    }

    console.log('✅ Finish success \n');
}