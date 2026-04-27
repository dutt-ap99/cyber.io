import test from 'node:test';
import assert from 'node:assert';
import { analyzeDigitalFootprint, generateRemovalInstructions, generateDeletionEmail } from './geminiService';
import { GoogleGenAI } from '@google/genai';

test('analyzeDigitalFootprint returns parsed JSON on success', async () => {
  const mockScanResult = {
    riskScore: 42,
    summary: 'Test summary',
    dorks: [],
    recommendedBrokers: []
  };
  const mockClient = {
    models: {
      generateContent: async () => ({ text: JSON.stringify(mockScanResult) })
    }
  };
  const result = await analyzeDigitalFootprint('Jane', 'CA', 'jane@test.com', mockClient as unknown as GoogleGenAI);
  assert.strictEqual(result.riskScore, 42);
  assert.strictEqual(result.summary, 'Test summary');
});

test('analyzeDigitalFootprint returns default mock data on error', async () => {
  const mockClient = {
    models: {
      generateContent: async () => { throw new Error("Mock error"); }
    }
  };
  // suppress console.error for clean test output
  const originalConsoleError = console.error;
  console.error = () => {};
  const result = await analyzeDigitalFootprint('John', 'NY', 'john@test.com', mockClient as unknown as GoogleGenAI);
  console.error = originalConsoleError;

  assert.strictEqual(result.riskScore, 75);
  assert.strictEqual(result.dorks.length, 2);
});

test('generateRemovalInstructions returns instructions on success', async () => {
  const mockClient = {
    models: {
      generateContent: async () => ({ text: "Step 1. Opt out" })
    }
  };
  const result = await generateRemovalInstructions('BrokerA', mockClient as unknown as GoogleGenAI);
  assert.strictEqual(result, "Step 1. Opt out");
});

test('generateRemovalInstructions handles error gracefully', async () => {
  const mockClient = {
    models: {
      generateContent: async () => { throw new Error("Mock error"); }
    }
  };
  const result = await generateRemovalInstructions('BrokerA', mockClient as any);
  assert.strictEqual(result, "Failed to retrieve instructions. Please try again.");
});

test('generateDeletionEmail returns email body on success', async () => {
  const mockClient = {
    models: {
      generateContent: async () => ({ text: "Dear BrokerB, delete my data." })
    }
  };
  const userData = { name: "Bob", email: "bob@test.com" };
  const result = await generateDeletionEmail('BrokerB', userData, mockClient as unknown as GoogleGenAI);
  assert.strictEqual(result, "Dear BrokerB, delete my data.");
});

test('generateDeletionEmail handles error gracefully', async () => {
  const mockClient = {
    models: {
      generateContent: async () => { throw new Error("Mock error"); }
    }
  };
  const userData = { name: "Bob", email: "bob@test.com" };
  const result = await generateDeletionEmail('BrokerB', userData, mockClient as any);
  assert.strictEqual(result, "Error generating email template.");
});

test('throws error if API_KEY is missing and no client is provided', async () => {
  const originalApiKey = process.env.API_KEY;
  delete process.env.API_KEY;

  await assert.rejects(
    () => analyzeDigitalFootprint('Jane', 'CA'),
    { message: "API_KEY is missing from environment variables" }
  );

  process.env.API_KEY = originalApiKey;
});
