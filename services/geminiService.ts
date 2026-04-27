import { ScanResult, RiskLevel } from "../types";

// Analyzes the potential footprint based on generic user info and generates search queries
export const analyzeDigitalFootprint = async (name: string, location: string, email?: string): Promise<ScanResult> => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, location, email })
    });

    if (!response.ok) {
        throw new Error('Analysis API returned an error');
    }

    const data = await response.json();
    return data as ScanResult;
  } catch (error) {
    console.error("Analysis failed:", error);
    // Fallback data if API fails
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

export const generateRemovalInstructions = async (brokerName: string): Promise<string> => {
  try {
    const response = await fetch('/api/instructions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ brokerName })
    });

    if (!response.ok) {
        throw new Error('Instructions API returned an error');
    }

    const data = await response.json();
    return data.text || "No instructions generated.";
  } catch (error) {
    return "Failed to retrieve instructions. Please try again.";
  }
};

export const generateDeletionEmail = async (brokerName: string, userData: { name: string, email: string, address?: string }): Promise<string> => {
  try {
    const response = await fetch('/api/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ brokerName, userData })
    });

    if (!response.ok) {
        throw new Error('Email API returned an error');
    }

    const data = await response.json();
    return data.text || "Could not generate email.";
  } catch (error) {
    return "Error generating email template.";
  }
};
