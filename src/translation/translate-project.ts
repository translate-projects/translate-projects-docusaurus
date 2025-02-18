import fs from 'fs';
import path from 'path';
import { TypeListLang } from 'translate-projects-core/types';
import { logExecutionTime, Logger } from 'translate-projects-core/utils';
import { blogTranslate, docsTranslate, reactTranslate, syncResourcesBlogTranslate, syncResourcesDocsTranslate, syncResourcesFilesJsonTheme, syncResourcesReactTranslate, translateFilesJsonTheme } from '../content';
import { detectChangeFiles } from '../sync';
import { BlogConfig, DocsConfig, GeneralConfig, ReactConfig, ThemeConfig } from '../types';
import { deleteJsonFilesFolder } from '../utils';
import { validateChangesServerFiles } from './validate-changes';
import { writeTranslationsCommand } from './write-translations-command';

export type ConfigOptions = {
    config?: GeneralConfig;
    locales: TypeListLang[];
    defaultLocale?: TypeListLang;
    apiKey: string;
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

const reactConfigDefault: ReactConfig = {
    enable: true,
};

export async function translateProject({
    defaultLocale,
    locales = [],
    apiKey,
    debug = true,
    config = configDefault,
    blog = blogConfigDefault,
    docs = docsConfigDefault,
    react = reactConfigDefault,
    theme = themeConfigDefault

}: ConfigOptions): Promise<void> {

    const time_start = new Date();

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

    const react_config = {
        ...reactConfigDefault,
        ...react
    }

    if (!defaultLocale) {
        await Logger.error(`🛑 required param { config: { defaultLocale: 'es'} } \n`)
        return;
    }

    if (!locales?.length) {
        await Logger.error(`🛑 required param { config: { locales: ['en','fr']} } \n`)
        return;
    }

    if (debug) {
        detectChangeFiles({
            folder: './translate',
            i18nDir: config_base.outputDir,
            locale: defaultLocale
        })
        return;
    }

    const dirFiles = path.join('i18n', defaultLocale)

    // refhesh folder base
    await writeTranslationsCommand(defaultLocale);

    if (!fs.existsSync(dirFiles) || config_base.recreateFiles) {

        await Logger.info(`🔄 Recreating translations: ${defaultLocale} \n`)

        for (const locale of locales) {
            if (locale === defaultLocale) continue;
            const folder_lang = path.join(config_base.outputDir, locale);
            if (!fs.existsSync(folder_lang) || config_base.recreateFiles) {
                await deleteJsonFilesFolder(folder_lang);
                await writeTranslationsCommand(locale);
                await Logger.info(`🔄 Recreating translations: ${locale} \n`)
            }
        }
    }

    const locales_config = [defaultLocale, ...locales]

    if (!blog_config.enable) {
        await Logger.info('Not translate blog \n');
    }

    if (!docs_config.enable) {
        await Logger.info('Not translate docs \n');
    }

    if (!react_config.enable) {
        await Logger.info('Not translate react files \n');
    }

    if (!theme_config.enable) {
        await Logger.info('Not translate theme files \n');
    }

    if (blog_config.enable) {
        if (!fs.existsSync(blog_config.baseDir)) {
            await Logger.error(`The directory ${blog_config.baseDir} doesn't exist.`);
            process.exit(1);
        }

        await Logger.success(` Syncing files blog... \n`)

        const filesPath = await validateChangesServerFiles({
            apiKey,
            dir: blog_config.baseDir
        })

        await syncResourcesBlogTranslate({
            filesPaths: filesPath,
            dir: blog_config.baseDir,
            locales: locales_config,
            defaultLocale: defaultLocale,
            outputBlogDir: blog_config.outputDir,
            i18nDir: config_base.outputDir,
            apiKey,
            baseBlogDir: blog_config.baseDir,
        })

        await blogTranslate({
            filesPaths: filesPath,
            dir: blog_config.baseDir,
            locales: locales_config,
            defaultLocale: defaultLocale,
            outputBlogDir: blog_config.outputDir,
            i18nDir: config_base.outputDir,
            apiKey,
            baseBlogDir: blog_config.baseDir,
        })
        await Logger.success('😎 Finish translated blog 🎫 \n')
    }


    if (docs_config.enable) {
        await Logger.success('🚀 Start translations documentation \n')
        if (!fs.existsSync(docs_config.baseDir)) {
            Logger.error(`The directory ${docs_config.baseDir} doesn't exist.`);
            process.exit(1);
        }

        await Logger.info(`Syncing files documentation... \n`)

        const filesPath = await validateChangesServerFiles({
            apiKey,
            dir: docs_config.baseDir
        })

        await syncResourcesDocsTranslate({
            filesPaths: filesPath,
            dir: docs_config.baseDir,
            locales: locales_config,
            defaultLocale: defaultLocale,
            baseDocsDir: docs_config.baseDir,
            i18nDir: config_base.outputDir,
            outputDocDir: docs_config.outputDir,
            apiKey
        });

        await docsTranslate({
            filesPaths: filesPath,
            dir: docs_config.baseDir,
            locales: locales_config,
            defaultLocale: defaultLocale,
            baseDocsDir: docs_config.baseDir,
            i18nDir: config_base.outputDir,
            outputDocDir: docs_config.outputDir,
            apiKey
        });

        await Logger.success('😎 Finish translated documentation 📋 \n')
    }

    if (react_config.enable) {

        await Logger.success('🚀 Start translations React \n')

        const dirFiles = path.join('i18n', defaultLocale)

        const filesPath = await validateChangesServerFiles({
            apiKey,
            dir: dirFiles,
            onlyRoot: true,
            allowedExtensions: ['.json']
        })

        await syncResourcesReactTranslate({
            filesPaths: filesPath,
            defaultLocale,
            apiKey,
        })

        await reactTranslate({
            locales: locales_config,
            defaultLocale: defaultLocale,
            apiKey,
            filesPaths: filesPath
        })

        await Logger.success('😎 Finish translated React Pages 📋 \n')
    }

    if (theme_config.enable) {

        await Logger.success('🚀 Start translations Theme \n')

        await Logger.info('Syncing files theme... \n')

        const folderTheme = path.join(config_base.outputDir, defaultLocale, 'docusaurus-theme-classic');

        const filesPath = await validateChangesServerFiles({
            apiKey,
            dir: folderTheme,
            allowedExtensions: ['.json']
        })

        await syncResourcesFilesJsonTheme({
            defaultLocale: defaultLocale,
            apiKey,
            ignoreKeys: theme_config.ignoreKeys,
            filesPaths: filesPath
        })

        await translateFilesJsonTheme({
            defaultLocale: defaultLocale,
            apiKey,
            ignoreKeys: theme_config.ignoreKeys,
            locales: locales_config,
            filesPaths: filesPath,
            i18nDir: config_base.outputDir,
        })

        await Logger.success('😎 Finish translated Theme \n')
    }

    await Logger.success('✅ Finish translated All 📋 \n')

    await logExecutionTime(time_start);

    process.exit(0);
}