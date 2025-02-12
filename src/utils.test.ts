import { describe, it } from 'vitest';

import { generateMinifiedRawPage } from './utils';

describe('utils', () => {
    describe('generateMinifiedRawPage', () => {
        it.skip('should find the matching file', async () => {
            const query = 'العمامة كما في زاد المعاد';
            await generateMinifiedRawPage('/dir', query, 'testing/1.json');
        });
    });
});
