import type { protos } from '@google-cloud/documentai';

export type RawFileData = { pages: protos.google.cloud.documentai.v1beta3.Document.IPage[]; text: string };
