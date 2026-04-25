import { GoogleGenAI, Type } from "@google/genai";
import { ScanResult, RiskLevel } from "../types";

let cachedClient: GoogleGenAI | null = null;

const getAiClient = () => {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is missing from environment variables");
  }

  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
};

// Analyzes the potential footprint based on generic user info and generates search queries
export const analyzeDigitalFootprint = async (name: string, location: string, email?: string): Promise<ScanResult> => {
  const prompt = `
    Act as a senior cybersecurity analyst. A user named "${name}" located in "${location}" wants to audit their public digital footprint.
    
    1. Estimate a hypothetical privacy risk score (0-100) for an average person in this demographic.
    2. Generate a list of "Google Dorks" (advanced search queries) that this user should run to see what is publicly available about them. Include email variations if provided.
    3. List top 5 data broker websites that operate in this region (e.g., Whitepages, Spokeo, ZoomInfo if US-based) that likely have their data.
    
    Return the response in strictly valid JSON format matching the schema.
  `;

  try {
    const ai = getAiClient();
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
    
    return JSON.parse(text) as ScanResult;
  } catch (error) {
    console.error("Analysis failed:", error);
    // Fallback data if AI fails
    return {
      riskScore: 75,
      summary: "Could not generate live analysis. Showing default high-risk vectors.",
      dorks: [
        { title: "Exact Name Match", query: `"${name}"`, description: "Basic exact match search", risk: RiskLevel.MEDIUM },
        { title: "PDF Documents", query: `"${name}" filetype:pdf`, description: "Public records or resumes", risk: RiskLevel.HIGH }
      ],
      recommendedBrokers: []
    };
  }
};

export const generateRemovalInstructions = async (brokerName: string, aiClient?: GoogleGenAI): Promise<string> => {
  const ai = aiClient || getAiClient();
  const prompt = `
    Provide a concise, step-by-step guide on how to opt-out and remove personal data from the data broker "${brokerName}".
    Include a direct link to the opt-out page if known.
    Format the response in Markdown.
    Focus on speed and accuracy.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "No instructions generated.";
  } catch (error) {
    return "Failed to retrieve instructions. Please try again.";
  }
};

export const generateDeletionEmail = async (brokerName: string, userData: { name: string, email: string, address?: string }, aiClient?: GoogleGenAI): Promise<string> => {
  const ai = aiClient || getAiClient();
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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "Could not generate email.";
  } catch (error) {
    return "Error generating email template.";
  }
};
