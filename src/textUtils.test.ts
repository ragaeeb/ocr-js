import { protos } from '@google-cloud/documentai';
import { describe, expect, it } from 'vitest';

import { mapDocumentPage, stringToHash } from './textUtils';

describe('textUtils', () => {
    describe('stringToHash', () => {
        it('should return 0 for an empty string', () => {
            expect(stringToHash('')).toBe(0);
        });

        it('should compute hash for a single character', () => {
            expect(stringToHash('a')).toBe('a'.charCodeAt(0));
        });

        it('should compute hash for multiple characters', () => {
            const text = 'abc';
            let expectedHash = 0;
            for (const char of text) {
                expectedHash ^= char.charCodeAt(0);
            }
            expect(stringToHash(text)).toBe(expectedHash);
        });

        it('should compute hash for special characters', () => {
            const text = '!@#';
            let expectedHash = 0;
            for (const char of text) {
                expectedHash ^= char.charCodeAt(0);
            }
            expect(stringToHash(text)).toBe(expectedHash);
        });

        it('should compute hash for Unicode characters', () => {
            const text = '你好';
            let expectedHash = 0;
            for (const char of text) {
                expectedHash ^= char.charCodeAt(0);
            }
            expect(stringToHash(text)).toBe(expectedHash);
        });
    });

    describe('mapDocumentPage', () => {
        it('should return empty text if paragraphs are undefined', () => {
            const page: protos.google.cloud.documentai.v1beta3.Document.IPage = {
                pageNumber: 1,
                paragraphs: undefined,
            };
            const result = mapDocumentPage(page, 'Sample text');
            expect(result).toEqual({ id: 1, text: '' });
        });

        it('should return empty text if paragraphs are empty', () => {
            const page: protos.google.cloud.documentai.v1beta3.Document.IPage = {
                pageNumber: 2,
                paragraphs: [],
            };
            const result = mapDocumentPage(page, 'Sample text');
            expect(result).toEqual({ id: 2, text: '' });
        });

        it('should map paragraphs to page text correctly', () => {
            const allText = 'Hello World! This is a test.';
            const page: protos.google.cloud.documentai.v1beta3.Document.IPage = {
                pageNumber: 3,
                paragraphs: [
                    {
                        layout: {
                            textAnchor: {
                                textSegments: [{ endIndex: 12, startIndex: 0 }],
                            },
                        },
                    },
                    {
                        layout: {
                            textAnchor: {
                                textSegments: [{ endIndex: 28, startIndex: 13 }],
                            },
                        },
                    },
                ],
            };
            const result = mapDocumentPage(page, allText);
            expect(result).toEqual({
                id: 3,
                text: 'Hello World!\nThis is a test.',
            });
        });

        it('should handle textSegments with undefined startIndex', () => {
            const allText = 'Hello World!';
            const page: protos.google.cloud.documentai.v1beta3.Document.IPage = {
                pageNumber: 4,
                paragraphs: [
                    {
                        layout: {
                            textAnchor: {
                                textSegments: [{ endIndex: 12 }],
                            },
                        },
                    },
                ],
            };
            const result = mapDocumentPage(page, allText);
            expect(result).toEqual({ id: 4, text: 'Hello World!' });
        });

        it('should return empty text if textSegments are missing', () => {
            const allText = 'Hello World!';
            const page: protos.google.cloud.documentai.v1beta3.Document.IPage = {
                pageNumber: 5,
                paragraphs: [
                    {
                        layout: {
                            textAnchor: {},
                        },
                    },
                ],
            };
            const result = mapDocumentPage(page, allText);
            expect(result).toEqual({ id: 5, text: '' });
        });

        it('should use only the first textSegment', () => {
            const allText = 'Hello World! This is a test.';
            const page: protos.google.cloud.documentai.v1beta3.Document.IPage = {
                pageNumber: 6,
                paragraphs: [
                    {
                        layout: {
                            textAnchor: {
                                textSegments: [
                                    { endIndex: 12, startIndex: 0 },
                                    { endIndex: 27, startIndex: 13 },
                                ],
                            },
                        },
                    },
                ],
            };
            const result = mapDocumentPage(page, allText);
            expect(result).toEqual({ id: 6, text: 'Hello World!' });
        });

        it('should handle undefined pageNumber', () => {
            const allText = 'Hello World!';
            const page: protos.google.cloud.documentai.v1beta3.Document.IPage = {
                paragraphs: [
                    {
                        layout: {
                            textAnchor: {
                                textSegments: [{ endIndex: 12, startIndex: 0 }],
                            },
                        },
                    },
                ],
            };
            const result = mapDocumentPage(page, allText);
            expect(result).toEqual({ id: undefined, text: 'Hello World!' });
        });
    });
});
