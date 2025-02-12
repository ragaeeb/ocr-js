import type { protos } from '@google-cloud/documentai';

import type { RawFileData } from './rawTypes';

import { readOCRData, readRawFile, saveRawFile } from './io';
import { mapDocumentToPage } from './textUtils';

export const findFile = async (
    directory: string,
    query: string,
): Promise<undefined | { data: RawFileData; file: string }> => {
    const filesToProcess = await readOCRData(directory);

    for (const file of filesToProcess) {
        const result = await readRawFile(file);

        if (result.text.includes(query)) {
            return { data: result, file };
        }
    }
};

export const findPage = (
    { pages: rawPages, text }: RawFileData,
    query: string,
): protos.google.cloud.documentai.v1beta3.Document.IPage | undefined => {
    const matchedPage = rawPages.find((rawPage) => {
        const page = mapDocumentToPage(rawPage, text);
        return page.text.includes(query);
    });

    return matchedPage;
};

export const generateMinifiedRawPage = async (directory: string, query: string, outputFile: string) => {
    const match = await findFile(directory, query);

    if (!match) {
        throw new Error('Query not found in any file');
    }

    const page = findPage(match.data, query);

    if (!page) {
        throw new Error('Query not found in any page');
    }

    const { blocks, lines, pageNumber, paragraphs, tokens } = page;

    return saveRawFile(outputFile, {
        pages: [{ blocks, lines, pageNumber, paragraphs, tokens }],
        text: match.data.text,
    });
};
