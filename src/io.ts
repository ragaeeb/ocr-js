import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { RawFileData } from './rawTypes';

export const fileExists = async (path: string) => !!(await fs.stat(path).catch(() => false));

export const readRawFile = async (ocrFile: string): Promise<RawFileData> => {
    const result = JSON.parse(await fs.readFile(ocrFile, 'utf-8'));
    return result;
};

export const saveRawFile = async (outputFile: string, data: RawFileData): Promise<void> => {
    return fs.writeFile(outputFile, JSON.stringify(data));
};

export const readOCRData = async (directory: string) => {
    return (await fs.readdir(directory)).map((file) => path.resolve(directory, file));
};
