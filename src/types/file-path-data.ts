export interface FilePathData {
    path: string;
    cache_hash: string;
    translations: Record<string, { [key: string]: string }>;
    sources: Record<string, string>;
    in_cache?: boolean;
}