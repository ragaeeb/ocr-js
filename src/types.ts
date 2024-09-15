export type Logger = (message: string) => void;

export type Config = {
    bucketUri: string;
    logger?: Logger;
    processorId: string;
    processorVersion: string;
    projectId: string;
    projectLocation: string;
};

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

export interface Page {
    id: number;
    text: string;
}
