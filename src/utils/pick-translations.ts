import { TypeJson } from 'translate-projects-core/types';

// The API returns every translation of the project for a language: keep only this file's keys.
// Missing keys = texts the backend did not translate (e.g. MISSING_API_KEY gives a partial result).
export const pickTranslations = (
  all: TypeJson | null | undefined,
  source: TypeJson
) => {
  const translations: TypeJson = {};
  const missing: string[] = [];
  for (const key of Object.keys(source)) {
    if (typeof all?.[key] === 'string') translations[key] = all[key];
    else missing.push(key);
  }
  return { translations, missing };
};
