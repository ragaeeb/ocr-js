/* eslint-disable @typescript-eslint/no-explicit-any */
import { protos } from '@google-cloud/documentai';
import { formatStringBySentence } from 'bitaboom';

import { DebugHandler, Page } from './types';

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

type PageContentWithDimensions = {
    height: number;
    text: string;
    width: number;
};

const mapSegmentsToPageContentWithDimensions = (
    layout: protos.google.cloud.documentai.v1beta3.Document.Page.ILayout,
    allText: string,
): PageContentWithDimensions => {
    const { boundingPoly, textAnchor } = layout;
    const vertices =
        boundingPoly?.normalizedVertices as protos.google.cloud.documentai.v1beta3.INormalizedVertex[] as any;
    let width = 0;
    let height = 0;

    if (vertices.length > 2) {
        width = vertices[1].x - vertices[0].x;
        height = vertices[2].y - vertices[0].y;
    }

    return {
        height,
        text: getText(allText, textAnchor as protos.google.cloud.documentai.v1beta3.Document.ITextAnchor),
        width,
    };
};

export const mapDocumentToPage = (
    { blocks, lines, pageNumber, paragraphs, tokens }: protos.google.cloud.documentai.v1beta3.Document.IPage,
    allText: string,
    debug?: DebugHandler,
): Page => {
    const excerpts: PageContentWithDimensions[] = [];

    if (blocks) {
        excerpts.push(
            ...blocks
                .map((block) =>
                    mapSegmentsToPageContentWithDimensions(
                        block.layout as protos.google.cloud.documentai.v1beta3.Document.Page.ILayout,
                        allText,
                    ),
                )
                .map((block) => ({
                    ...block,
                    text: formatStringBySentence(block.text),
                })),
        );
    } else if (lines) {
        excerpts.push(
            ...lines.map((line) =>
                mapSegmentsToPageContentWithDimensions(
                    line.layout as protos.google.cloud.documentai.v1beta3.Document.Page.ILayout,
                    allText,
                ),
            ),
        );
    } else if (paragraphs) {
        excerpts.push(
            ...paragraphs.map((paragraph) =>
                mapSegmentsToPageContentWithDimensions(
                    paragraph.layout as protos.google.cloud.documentai.v1beta3.Document.Page.ILayout,
                    allText,
                ),
            ),
        );
    }

    const pageText = excerpts
        .filter(({ height, text, width }) => {
            // Heuristic thresholds for width and height (tune based on observations)
            const isTooSmall = width < 0.05 && height < 0.015;
            const isLegitimateShortText = text.length > 2 || (width > 0.1 && height > 0.02);

            return !isTooSmall && isLegitimateShortText;
        })
        .map(({ text }) => text)
        .join('\n');

    const page = {
        id: pageNumber as number,
        text: pageText,
    };

    if (debug) {
        debug({
            ...page,
            tokens: (tokens as protos.google.cloud.documentai.v1beta3.Document.Page.IBlock[]).map((token) => {
                return {
                    normalizedVertices: token.layout?.boundingPoly?.normalizedVertices,
                    ...mapSegmentsToPageContentWithDimensions(
                        token.layout as protos.google.cloud.documentai.v1beta3.Document.Page.ILayout,
                        allText,
                    ),
                };
            }),
        });
    }

    return page;
};
