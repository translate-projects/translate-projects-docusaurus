import { TypeJson } from 'translate-projects-core/types';

export const removeItemsFromJson = (
  jsonData: TypeJson,
  itemsDelete: string[]
) => {
  const filteredData: TypeJson = {};

  for (const key in jsonData) {
    if (!itemsDelete.includes(key)) {
      filteredData[key] = jsonData[key];
    }
  }

  return filteredData;
};
