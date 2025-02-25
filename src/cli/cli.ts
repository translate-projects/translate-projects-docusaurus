#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { Logger } from 'translate-projects-core/utils';
import { pathToFileURL } from 'url';
import { translateProject } from '..';

async function loadConfig(configPath: string): Promise<any> {
  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Configuration file "${path.basename(configPath)}" not found.`
    );
  }

  try {
    const config = (await import(pathToFileURL(configPath).href)).default;
    return config;
  } catch (err) {
    console.error(err);
    throw new Error(`Failed to load config: ${(err as Error).message}`);
  }
}

async function runCLI() {
  const configFile = fs.existsSync('translate.config.js')
    ? 'translate.config.js'
    : 'translate.config.mjs';
  const configPath = path.join(process.cwd(), configFile);
  const isDev = process.argv.includes('--dev');

  try {
    await Logger.info('Starting project translation...');
    const config = await loadConfig(configPath);
    const debug = isDev || config.debug;
    if (debug) {
      await translateProject({
        defaultLocale: config.sourceLang,
        locales: config.targetLangs,
        apiKey: config.apiKey,
        debug: isDev || config.debug,
      });
      return;
    }

    await translateProject({
      defaultLocale: config.sourceLang,
      locales: config.targetLangs,
      apiKey: config.apiKey,
      debug: isDev || config.debug,
    });
  } catch (err: any) {
    await Logger.error(err.message);
    process.exit(1);
  }
}

runCLI();
