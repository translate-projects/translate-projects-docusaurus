import { TypeJson, TypeSimpleJson } from "translate-projects-core/types";
import { generateHashText } from "translate-projects-core/utils";

export const flattenWriteTranslationJson = (inputJson: FlattenWriteTranslationJson, ignore: string[] = []) => {
    const flattened: TypeSimpleJson = {};
    const simpleKeys: TypeSimpleJson = {};
    const ignoredKeys: TypeJson = {};

    for (const key in inputJson) {
        if (inputJson.hasOwnProperty(key)) {
            const messageObj = inputJson[key];
            if (ignore.includes(key)) {
                ignoredKeys[key] = messageObj
                continue
            }
            const simpleKey = generateHashText(key);
            simpleKeys[simpleKey] = key;
            flattened[simpleKey] = messageObj.message;
        }
    }

    return {
        simpleKeys,
        flattenedJson: flattened,
        ignoredKeys
    };
}