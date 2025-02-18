import { TypeJson } from 'translate-projects-core/types';
import { FlattenWriteTranslationJson } from '../types';

export const restructureJson = (
  flattenedJson: TypeJson,
  originalJson: FlattenWriteTranslationJson,
  simpleKeys: TypeJson
) => {
  const restructured: FlattenWriteTranslationJson = {};

  // for to JSON plane
  for (const key in flattenedJson) {
    const originalKey = simpleKeys[key];
    if (flattenedJson.hasOwnProperty(key)) {
      if (
        typeof originalKey === 'object' ||
        typeof flattenedJson[key] === 'object' ||
        flattenedJson[key] === undefined
      ) {
        continue;
      }

      restructured[originalKey] = {
        message: flattenedJson[key] as string,
      };
      // add description
      if (originalJson[originalKey] && originalJson[originalKey].description) {
        restructured[originalKey].description =
          originalJson[originalKey].description;
      }
    }
  }

  return restructured;
};
