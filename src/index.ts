import { DocumentProcessorServiceClient, protos } from '@google-cloud/documentai';
import { Storage } from '@google-cloud/storage';
import { promises as fs } from 'fs';
import os from 'os';
import PQueue from 'p-queue';
import path from 'path';

import { fileExists } from './io';
import { mapDocumentToPage, stringToHash } from './textUtils';
import { Config, DownloadOCROptions, OCRDataToPagesParams, Page, RequestOCROptions, RequestOCRResult } from './types';

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

export const isOCRFinished = async (requestId: string): Promise<boolean> => {
    const [files] = await new Storage().bucket(config.bucketUri).getFiles({
        prefix: `${requestId}/`,
        maxResults: 1,
    });

    return files.length > 0;
};

export const downloadOCRResults = async (requestId: string, options: DownloadOCROptions = {}): Promise<string[]> => {
    const { concurrency = 15, outputFolder } = options;
    const outputDir = outputFolder || `${os.tmpdir()}/ocr-js/${requestId}`;
    const results: string[] = [];

    await fs.mkdir(outputDir, { recursive: true });

    const [files] = await new Storage().bucket(config.bucketUri).getFiles({
        prefix: `${requestId}/`,
    });
    const queue = new PQueue({ concurrency });
    const tasks = files.map((fileInfo, index, arr) => async () => {
        const fileName = path.basename(fileInfo.name);
        const outputPath = path.join(outputDir, fileName);
        const fileAlreadyDownloaded = await fileExists(outputPath);

        if (fileAlreadyDownloaded) {
            if (config.logger) {
                config.logger(`Skipping download for ${outputPath}`);
            }
        } else {
            if (config.logger) {
                config.logger(`Downloading file ${index + 1}/${arr.length}...`);
            }

            const [file] = await fileInfo.download();

            await fs.writeFile(outputPath, file);

            if (config.logger) {
                config.logger(`Downloaded file ${index + 1}/${arr.length} to ${outputPath}`);
            }
        }

        results.push(outputPath);
    });

    await queue.addAll(tasks);

    if (config.logger) {
        config.logger(`Download complete!`);
    }

    return results;
};

export const mapOCRDataToPages = async ({ directory, files, debug }: OCRDataToPagesParams): Promise<Page[]> => {
    const pages: Page[] = [];
    const filesToProcess = files || (await fs.readdir(directory)).map((file) => path.resolve(directory, file));

    for (const file of filesToProcess) {
        const {
            pages: rawPages,
            text,
        }: { pages: protos.google.cloud.documentai.v1beta3.Document.IPage[]; text: string } = JSON.parse(
            await fs.readFile(file, 'utf-8'),
        );

        pages.push(...rawPages.map((rawPage) => mapDocumentToPage(rawPage, text, debug)));
    }

    pages.sort((a, b) => a.id - b.id);

    return pages;
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
