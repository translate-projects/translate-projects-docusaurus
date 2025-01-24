export const removeItemsFromJson = (jsonData: any, itemsDelete: string[]) => {

    const filteredData: any = {};

    for (const key in jsonData) {
        if (!itemsDelete.includes(key)) {
            filteredData[key] = jsonData[key];
        }
    }

    return filteredData;
}