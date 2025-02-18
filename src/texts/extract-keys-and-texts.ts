import { generateHashText } from 'translate-projects-core/utils';

export const extractKeysAndTexts = async (
  content: string
): Promise<Record<string, string>> => {
  const regex = /{{([\s\S]*?)}}/g;
  let match;
  const result: Record<string, string> = {};

  while ((match = regex.exec(content)) !== null) {
      const text = match[1].trim();
      result[await generateHashText(text)] = text;
  }

  return result;
};
