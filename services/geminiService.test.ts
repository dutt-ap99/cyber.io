import test from 'node:test';
import assert from 'node:assert';
import { analyzeDigitalFootprint, getFallbackScanResult } from './geminiService';
import type { ScanResult } from '../types';

test('analyzeDigitalFootprint returns fallback data on AI client failure', async () => {
    const name = 'Jane Doe';
    const location = 'San Francisco';

    // Create a mock client that throws an error
    const mockAiClient = {
        models: {
            generateContent: async () => {
                throw new Error("Simulated AI failure");
            }
        }
    };

    // Pass the mock client via dependency injection
    const result = await analyzeDigitalFootprint(name, location, undefined, mockAiClient);

    const expectedFallback = getFallbackScanResult(name);

    assert.deepStrictEqual(result, expectedFallback, 'Should return the expected fallback data when AI fails');
    assert.strictEqual(result.riskScore, 75);
    assert.ok(result.summary.includes('Could not generate live analysis'));
});
