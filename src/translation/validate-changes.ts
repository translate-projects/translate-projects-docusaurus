import { validateChangesFiles } from "translate-projects-core";
import { FilePathData, processDirectory } from "../cache/processing";

type Options = {
    dir: string;
    apiKey: string;
    onlyRoot?: boolean
}

export const validateChangesServerFiles = async ({ apiKey, dir, onlyRoot }: Options): Promise<Record<string, FilePathData>> => {

    const { filesPath, filesCache } = await processDirectory(dir, onlyRoot);

    const result = await validateChangesFiles({
        apiKey,
        data: filesCache
    })

    if (!result.data) {
        return {};
    }

    for (const fileHash of Object.keys(filesPath)) {
        filesPath[fileHash].in_cache = Boolean(!result.data[fileHash]);
    }

    return filesPath;

}