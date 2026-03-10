/**
 * Context Lens - Unit Tests (Jest-style)
 * Testing core analysis and utility logic.
 */

import { textProcessor } from '../../utils/dom-utils.js'; // Note: combined in this project
import { RateLimiter } from '../../utils/rate-limiter.js';

describe('Text Processor', () => {
    test('cleans URLs and mentions', () => {
        const input = "Check this out @elonmusk https://google.com Hello world!";
        const expected = "Check this out Hello world!";
        expect(textProcessor.cleanText(input)).toBe(expected);
    });

    test('normalizes whitespace', () => {
        const input = "   Too   many    spaces   ";
        const expected = "Too many spaces";
        expect(textProcessor.cleanText(input)).toBe(expected);
    });
});

describe('Rate Limiter', () => {
    test('allows calls within limit', () => {
        const limiter = new RateLimiter(2, 1000);
        expect(limiter.canCall()).toBe(true);
        expect(limiter.canCall()).toBe(true);
        expect(limiter.canCall()).toBe(false);
    });

    test('resets after time window', (done) => {
        const limiter = new RateLimiter(1, 100);
        expect(limiter.canCall()).toBe(true);
        expect(limiter.canCall()).toBe(false);

        setTimeout(() => {
            expect(limiter.canCall()).toBe(true);
            done();
        }, 150);
    });
});
