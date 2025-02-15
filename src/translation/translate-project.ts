import fs from 'fs';
import path from 'path';
import { TypeListLang } from 'translate-projects-core/types';
import { logExecutionTime, Logger } from 'translate-projects-core/utils';
import { blogTranslate, docsTranslate, generateWriteTranslations, syncResourcesBlogTranslate, syncResourcesDocsTranslate, syncResourcesFilesJsonTheme, translateFilesJsonTheme } from '../content';
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
        await Logger.info('Not translate blog \n');
    }

    if (!docs_config.enable) {
        await Logger.info('Not translate docs \n');
    }

    if (!react_config.enable) {
        await Logger.info('Not translate react files \n');
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

        await generateWriteTranslations({
            locales: locales_config,
            defaultLocale: defaultLocale,
            apiKey
        })
        await Logger.success('😎 Finish translated React Pages 📋 \n')
    }

    if (theme_config.enable) {


        await Logger.success('🚀 Start translations Theme \n')

        await Logger.info('Syncing files theme... \n')

        const filesPath = await validateChangesServerFiles({
            apiKey,
            dir: docs_config.baseDir
        })

        await syncResourcesFilesJsonTheme({
            defaultLocale: defaultLocale,
            apiKey,
            ignoreKeys: theme_config.ignoreKeys
        })

        for (const locale of locales_config) {

            if (locale === defaultLocale) continue;

            // check exist file
            const filePath = path.join('i18n', locale, 'code.json');

            if (!fs.existsSync(filePath) || theme_config.recreateFiles) {

                await Logger.info(`🔄 Recreating translations: ${locale} \n`)

                const folderTheme = path.join('i18n', locale, 'docusaurus-theme-classic');

                await deleteJsonFilesFolder(folderTheme);

                await writeTranslationsCommand(locale)
            }

            await Logger.info(`Translating files theme (${locale})... \n`)

            await translateFilesJsonTheme({
                target_lang: locale,
                defaultLocale: defaultLocale,
                apiKey,
                ignoreKeys: theme_config.ignoreKeys
            })
        }

        await Logger.success('😎 Finish translated Theme \n')
    }

    await Logger.success('✅ Finish translated All 📋 \n')

    await logExecutionTime(time_start);

    process.exit(0);
}