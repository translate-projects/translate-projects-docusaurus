import { validateChangesFiles } from "translate-projects-core";
import { processDirectory } from "../cache/processing";
import { FilePathData } from "../types/file-path-data";

type ValidateChangesServerFilesOptions = {
    dir: string;
    apiKey: string;
    onlyRoot?: boolean
    allowedExtensions?: string[];
}

export const validateChangesServerFiles = async ({
    apiKey,
    dir,
    onlyRoot,
    allowedExtensions
}: ValidateChangesServerFilesOptions): Promise<Record<string, FilePathData>> => {

    const { filesPath, filesCache } = await processDirectory({
        dir,
        onlyRoot,
        allowedExtensions,
    });

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