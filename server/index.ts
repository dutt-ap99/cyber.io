import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from "@google/genai";
import { getPlatformResolution } from '../services/resolutionService.js';
import nodemailer from 'nodemailer';
import { encryptField } from '../utils/encryption.js';

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

// Mock Database
const dbLogs: any[] = [];

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

app.post('/api/generate-removal-request', async (req, res) => {
  try {
    const { name, email, address, brokerName } = req.body;

    if (!name || !email || !brokerName) {
      res.status(400).json({ error: 'Name, email, and brokerName are required.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not set.' });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a legal assistant specializing in data privacy laws like GDPR and CCPA.
Generate a professional, legally-toned data deletion request email to be sent to a data broker.
Use the following information:
Broker Name: ${brokerName}
User Name: ${name}
User Email: ${email}
User Address: ${address || 'Not provided'}

The output should just be the text of the email itself. Do not include any conversational filler.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const generatedText = response.text || '';

    // Create a nodemailer transport
    let transporter;
    if (process.env.SMTP_HOST) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
      });
    } else {
      transporter = nodemailer.createTransport({
        jsonTransport: true
      });
    }

    const placeholderEmail = `privacy@${brokerName.toLowerCase().replace(/\s+/g, '')}.com`;

    // Send the email
    await transporter.sendMail({
      from: 'noreply@ghostprotocol.local',
      replyTo: email,
      to: placeholderEmail,
      subject: `Data Deletion Request - ${name}`,
      text: generatedText
    });

    // Mock database logging using encrypted fields
    const logEntry = {
      id: Date.now().toString(),
      brokerName,
      status: encryptField('Sent'),
      emailContent: encryptField(generatedText),
      timestamp: new Date().toISOString()
    };

    // Push to a global array acting as our mock database
    dbLogs.push(logEntry);
    console.log('Logged to mock database:', logEntry);

    res.json({ text: generatedText });
  } catch (error: any) {
    console.error('Generate Removal Request API Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate removal request' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
