export type BlogConfig = {
  baseDir: string;
  outputDir: string;
  enable: boolean;
};

export type DocsConfig = {
  baseDir: string;
  outputDir: string;
  enable: boolean;
};

export type ThemeConfig = {
  enable: boolean;
  ignoreKeys: string[];
};

export type ReactConfig = {
  enable: boolean;
};

export type GeneralConfig = {
  outputDir: string;
  recreateFiles?: boolean;
};
