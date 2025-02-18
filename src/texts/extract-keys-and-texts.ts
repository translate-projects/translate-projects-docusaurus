import { generateHashText } from 'translate-projects-core/utils';

export const extractKeysAndTexts = async (
  content: string
): Promise<Record<string, string>> => {
  const regex = /{{([\s\S]*?)}}/g;
  let match;
  const result: Record<string, string> = {};

  while ((match = regex.exec(content)) !== null) {
    result[await generateHashText(match[1])] = match[1];
  }

  return result;
};
