import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from "@google/genai";
import { getPlatformResolution } from '../services/resolutionService.js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// RiskLevel Enum equivalent
const RiskLevel = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    CRITICAL: 'Critical'
};

let cachedClient: GoogleGenAI | null = null;

const getAiClient = () => {
    if (cachedClient) return cachedClient;

    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY is missing from environment variables");
    }
    cachedClient = new GoogleGenAI({ apiKey });
    return cachedClient;
};


app.post('/api/resolve', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
       res.status(400).json({ error: 'URL is required' });
       return;
    }
    const data = await getPlatformResolution(url);
    res.json(data);
  } catch (error: any) {
    console.error('Resolution API Error:', error);
    res.status(500).json({ error: error.message || 'Failed to resolve' });
  }
});

app.post('/api/analyze', async (req, res) => {
    try {
        const { name, location, email } = req.body;
        const ai = getAiClient();

        const prompt = `
          Act as a senior cybersecurity analyst. A user named "${name}" located in "${location}" wants to audit their public digital footprint.

          1. Estimate a hypothetical privacy risk score (0-100) for an average person in this demographic.
          2. Generate a list of "Google Dorks" (advanced search queries) that this user should run to see what is publicly available about them. Include email variations if provided.
          3. List top 5 data broker websites that operate in this region (e.g., Whitepages, Spokeo, ZoomInfo if US-based) that likely have their data.

          Return the response in strictly valid JSON format matching the schema.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  riskScore: { type: Type.NUMBER, description: "A number between 0 and 100 indicating exposure risk." },
                  summary: { type: Type.STRING, description: "A brief 2-sentence summary of why they might be at risk." },
                  dorks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        query: { type: Type.STRING, description: "The actual Google search query string." },
                        description: { type: Type.STRING },
                        risk: { type: Type.STRING, enum: [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL] }
                      }
                    }
                  },
                  recommendedBrokers: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        url: { type: Type.STRING },
                        difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
                        timeToComplete: { type: Type.STRING },
                        category: { type: Type.STRING, enum: ['People Search', 'Marketing', 'Financial', 'Social'] }
                      }
                    }
                  }
                }
              }
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");

        res.json(JSON.parse(text));
    } catch (error: any) {
        console.error("Analysis failed:", error);
        res.status(500).json({ error: error.message || "Failed to analyze" });
    }
});

app.post('/api/instructions', async (req, res) => {
    try {
        const { brokerName } = req.body;
        const ai = getAiClient();
        const prompt = `
          Provide a concise, step-by-step guide on how to opt-out and remove personal data from the data broker "${brokerName}".
          Include a direct link to the opt-out page if known.
          Format the response in Markdown.
          Focus on speed and accuracy.
        `;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        res.json({ text: response.text || "No instructions generated." });
    } catch (error) {
        console.error("Instructions generation failed:", error);
        res.status(500).json({ error: "Failed to retrieve instructions. Please try again." });
    }
});

app.post('/api/email', async (req, res) => {
    try {
        const { brokerName, userData } = req.body;
        const ai = getAiClient();
        const prompt = `
          Write a formal GDPR/CCPA data deletion request email to "${brokerName}".

          User Details:
          Name: ${userData.name}
          Email: ${userData.email}
          Address: ${userData.address || '[Address]'}

          The email should cite relevant privacy laws (GDPR for Europe, CCPA for California/USA generic).
          The tone should be legal and firm.
          Return ONLY the email body text.
        `;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        res.json({ text: response.text || "Could not generate email." });
    } catch (error) {
        console.error("Email generation failed:", error);
        res.status(500).json({ error: "Error generating email template." });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
