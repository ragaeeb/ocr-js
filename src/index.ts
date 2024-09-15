import { DocumentProcessorServiceClient, protos } from '@google-cloud/documentai';
import { Storage } from '@google-cloud/storage';
import PQueue from 'p-queue';

import { mapDocumentPage, stringToHash } from './textUtils';
import { Config, Page, RequestOCROptions, RequestOCRResult } from './types';

let config: Config;

export const init = (options: Config) => {
    config = options;
};

export const generateRequestId = (pdfFile: string): string => {
    if (!config) {
        throw new Error(`Config not set, please call init() method first.`);
    }

    return `${stringToHash(pdfFile).toString()}_${Date.now().toString()}`;
};

export const getOCRResult = async (requestId: string): Promise<Page[]> => {
    const [files] = await new Storage().bucket(config.bucketUri).getFiles({
        prefix: `${requestId}/`,
    });
    const queue = new PQueue({ concurrency: 15 });

    const allPages: Page[] = [];
    const tasks = files.map((fileInfo, index) => async () => {
        const [file] = await fileInfo.download();

        if (config.logger) {
            config.logger(`Fetched file #${index + 1}:`);
        }

        const document: protos.google.cloud.documentai.v1beta3.IDocument = JSON.parse(file.toString());
        const { pages, text } = document;

        const pageData: Page[] = (pages || []).map((page) => {
            return mapDocumentPage(page, text as string);
        });

        allPages.push(...pageData);
    });

    await queue.addAll(tasks);

    allPages.sort((a, b) => a.id - b.id);

    return allPages;
};

export const requestOCR = async (pdfFile: string, options: RequestOCROptions): Promise<RequestOCRResult> => {
    if (!config) {
        throw new Error(`Config not set, please call init() method first.`);
    }

    const requestId = options.requestId || generateRequestId(pdfFile);
    const name = `projects/${config.projectId}/locations/${config.projectLocation}/processors/${config.processorId}/processorVersions/${config.processorVersion}`;

    const client: DocumentProcessorServiceClient = new DocumentProcessorServiceClient();

    const request = {
        documentOutputConfig: {
            gcsOutputConfig: {
                gcsUri: `${config.bucketUri}/${requestId}/`,
            },
        },
        inputDocuments: {
            gcsDocuments: {
                documents: [
                    {
                        gcsUri: `${config.bucketUri}/${pdfFile}`,
                        mimeType: 'application/pdf',
                    },
                ],
            },
        },
        name,
        processOptions: {
            ocrConfig: {
                hints: {
                    languageHints: [options.language],
                },
            },
        },
    };

    if (config.logger) {
        config.logger(`Issuing batch process request: ${JSON.stringify(request)}`);
    }

    const [operation] = await client.batchProcessDocuments(request);
    await operation.promise();
    const [processorVersion] = await client.getProcessorVersion(request);

    return {
        name,
        processorVersionDisplayName: processorVersion.displayName || '',
        processorVersionName: processorVersion.name || '',
        requestId,
    };
};

export type { Config, Page, RequestOCROptions, RequestOCRResult };
