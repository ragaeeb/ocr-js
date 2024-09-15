import { protos } from '@google-cloud/documentai';

import { Page } from './types';

export const stringToHash = (text: string): number => {
    let hash = 0;

    if (text.length === 0) return hash;

    for (const char of text) {
        hash ^= char.charCodeAt(0); // Bitwise XOR operation
    }

    return hash;
};

const getText = (
    allText: string,
    { textSegments }: protos.google.cloud.documentai.v1beta3.Document.ITextAnchor,
): string => {
    if (!textSegments || textSegments.length === 0) {
        return '';
    }

    // First shard in document doesn't have startIndex property
    const startIndex = (textSegments[0].startIndex as number) || 0;
    const { endIndex } = textSegments[0];

    return allText.substring(startIndex, endIndex as number).trim();
};

export const mapDocumentPage = (
    { pageNumber, paragraphs }: protos.google.cloud.documentai.v1beta3.Document.IPage,
    allText: string,
): Page => {
    if (!paragraphs) {
        return {
            id: pageNumber as number,
            text: '',
        };
    }

    const bodies = paragraphs.map((paragraph) => {
        return getText(
            allText,
            paragraph.layout?.textAnchor as protos.google.cloud.documentai.v1beta3.Document.ITextAnchor,
        );
    });

    return {
        id: pageNumber as number,
        text: bodies.join('\n'),
    };
};
