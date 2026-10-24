import { TypeJson } from 'translate-projects-core/types';
import { escapeCharactersRegExp } from './escape-characters';

type TypeReplaceContent = {
  keysAndTexts: TypeJson;
  originalTranslations: TypeJson;
  contentFile: string;
};
export const replaceContentFile = ({
  keysAndTexts,
  originalTranslations,
  contentFile,
}: TypeReplaceContent): string => {
  let translatedContent = contentFile;

  for (const [key, value] of Object.entries(keysAndTexts)) {
    // Missing translation (API failure or new text): keep the source text
    const showValue = originalTranslations?.[key] ?? value;
    const escapedValue = escapeCharactersRegExp(value as string);
    const regex = new RegExp(`{{${escapedValue}}}`, 'g');
    translatedContent = translatedContent.replace(regex, showValue);
  }

  return translatedContent;
};
