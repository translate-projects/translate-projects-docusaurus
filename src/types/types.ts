
type TranslationsOrder = {
  [key: string]: { [key: string]: string };
};

type ObjectWithStringKeys = { [key: string]: any };

type FlattenWriteTranslationJson = {
  [key: string]: {
    message: string;
    description?: string;
  };
}