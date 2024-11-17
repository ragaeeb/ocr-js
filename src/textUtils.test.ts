import { promises as fs } from 'fs';
import { describe, expect, it } from 'vitest';

import { mapDocumentToPage, stringToHash } from './textUtils';

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

    describe('mapDocumentToPage', () => {
        it('should process text blocks', async () => {
            const { text, ...pageData } = JSON.parse(await fs.readFile('testing/blocks.json', 'utf-8'));
            const result = mapDocumentToPage(pageData, text);

            expect(result.id).toBe(1041);

            const lines = result.text.split('\n');

            expect(lines[0]).toContain('۲۹۳۳- حدثنا ع');
            expect(lines[0]).toContain('سم ربك الذي خلق');

            expect(lines.at(-1)).toContain('(1) لجأتم. (مصححه ) ');
        });

        it('should process text lines', async () => {
            const { text, ...pageData } = JSON.parse(await fs.readFile('testing/lines.json', 'utf-8'));
            const result = mapDocumentToPage(pageData, text);

            expect(result.id).toBe(1041);

            const lines = result.text.split('\n');

            expect(lines[0]).toContain('۲۹۳۳- حدثنا علي بن عيسى ثنا إبراهيم بن أبي طالب ثنا ابن أبي عمر ثنا سفيان عن');
            expect(lines.at(-1)).toContain('(1) لجأتم. (مصححه ) ');
        });

        it('should process text paragraphs', async () => {
            const { text, ...pageData } = JSON.parse(await fs.readFile('testing/paragraphs.json', 'utf-8'));
            const result = mapDocumentToPage(pageData, text);

            expect(result.id).toBe(1041);

            const lines = result.text.split('\n');

            expect(lines[0]).toContain('۲۹۳۳- حدثنا علي بن عيسى ثنا إبراهيم بن أبي طالب ثنا ابن أبي عمر ثنا سفيان عن');
            expect(lines.at(-1)).toContain('(1) لجأتم. (مصححه ) ');
        });
    });
});
