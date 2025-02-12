export type Config = {
    bucketUri: string;
    logger?: Logger;
    processorId: string;
    processorVersion: string;
    projectId: string;
    projectLocation: string;
};

export type DebugHandler = (element: RawPage) => void;

export type DownloadOCROptions = {
    concurrency?: number;
    outputFolder?: string;
};

export type Logger = (message: string) => void;

export type OCRDataToPagesParams =
    | { debug?: DebugHandler; directory: string; files?: never }
    | { debug?: DebugHandler; directory?: never; files: string[] };

export interface Page {
    id: number;
    text: string;
}

export interface RawPage extends Page {
    tokens: unknown[];
}

export type RequestOCROptions = {
    language: string;
    requestId?: string;
};

export type RequestOCRResult = {
    name: string;
    processorVersionDisplayName?: string;
    processorVersionName?: string;
    requestId: string;
};
