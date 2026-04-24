import { GoogleGenAI, Type } from "@google/genai";
import * as cheerio from 'cheerio';
import { sanitizeUrl } from '../utils/security.js';

const getAiClient = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export interface ResolutionData {
  platformName: string;
  deletionUrl: string;
  steps: string[];
}

const mockResolutions: Record<string, ResolutionData> = {
  'Tumblr': {
    platformName: 'Tumblr',
    deletionUrl: 'https://www.tumblr.com/account/delete',
    steps: [
      'Log into your Tumblr account.',
      'Go to the account settings page.',
      'Click on "Delete account" at the bottom of the page.',
      'Confirm your password and email address to finalize.'
    ]
  },
  'MySpace': {
    platformName: 'MySpace',
    deletionUrl: 'https://myspace.com/settings/account',
    steps: [
      'Log into your MySpace account.',
      'Navigate to the settings menu.',
      'Select "Account" and find the "Delete Account" option.',
      'Follow the on-screen prompts to confirm deletion.'
    ]
  }
};

export const getPlatformResolution = async (platformUrl: string): Promise<ResolutionData> => {
  const ai = getAiClient();

  // Extract a rough platform name from URL
  let platformName = 'Unknown Platform';
  try {
    const parsedUrl = new URL(platformUrl);
    platformName = parsedUrl.hostname.replace('www.', '').split('.')[0];
    platformName = platformName.charAt(0).toUpperCase() + platformName.slice(1);
  } catch (e) {
    // Keep unknown
  }

  // Fallback to mock data if no AI client
  if (!ai) {
    console.warn("No GEMINI_API_KEY found, falling back to mock data.");
    const mock = mockResolutions[platformName];
    if (mock) {
      return mock;
    }
    return {
      platformName,
      deletionUrl: 'https://example.com/delete-account',
      steps: ['Log into your account.', 'Go to settings.', 'Click delete account.']
    };
  }

  try {
    // 1. Fetch the page (simplified scraper)
    // We assume the user passes a URL like privacy policy or terms
    const response = await fetch(platformUrl);
    if (!response.ok) {
       throw new Error(`Failed to fetch page: ${response.statusText}`);
    }
    const html = await response.text();

    // 2. Extract text (using cheerio to strip HTML)
    // We only use the first 10,000 characters to keep prompt size reasonable
    const $ = cheerio.load(html);
    // Remove scripts and styles
    $('script, style').remove();
    const textContent = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 10000);

    // 3. Ask Gemini to extract the deletion info
    const prompt = `
      Act as a privacy assistant. I will provide you with the text extracted from a platform's terms of service or privacy policy page.
      Your task is to extract the exact direct URL for account deletion or deactivation, and list the exact steps required to delete or deactivate the account.

      Platform Name: ${platformName}

      Extracted Text:
      ${textContent}

      Return the response in strictly valid JSON format matching the schema.
      If you cannot find the direct deletion URL, provide a plausible guess based on standard practices (e.g., https://[domain]/settings/account) or leave it empty.
    `;

    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deletionUrl: { type: Type.STRING, description: "The direct URL to delete or deactivate the account." },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "The step-by-step instructions to delete the account."
            }
          },
          required: ["deletionUrl", "steps"]
        }
      }
    });

    const aiText = aiResponse.text;
    if (!aiText) throw new Error("No response from AI");

    const parsed = JSON.parse(aiText);

    return {
      platformName,
      deletionUrl: sanitizeUrl(parsed.deletionUrl),
      steps: parsed.steps || []
    };

  } catch (error) {
    console.error("Scraping or AI analysis failed:", error);
    // Fallback data if fetch or AI fails
    const mock = mockResolutions[platformName];
    if (mock) {
      return mock;
    }
    return {
      platformName,
      deletionUrl: sanitizeUrl('https://example.com/delete-account'),
      steps: [
        'Could not automatically determine steps.',
        'Please check the platform settings menu.',
        'Look for Account or Privacy settings.'
      ]
    };
  }
};
