import { TypeJson, TypeSimpleJson } from "translate-projects-core/types";
import { generateHashText } from "translate-projects-core/utils";
import { FlattenWriteTranslationJson } from "../types/types";

export const flattenWriteTranslationJson = async (inputJson: FlattenWriteTranslationJson, ignore: string[] = []) => {
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

            const simpleKey = await generateHashText(key);

            if (simpleKey !== await generateHashText(messageObj.message)) {
                simpleKeys[key] = key
                flattened[key] = messageObj.message;
                continue;
            }

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