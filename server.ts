import express from 'express';
import path from 'path';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import dotenv from 'dotenv';
import { initDatabase } from './server/db';
import { apiRouter } from './server/routes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static serving for persistent uploaded vehicle photos and media assets
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Database & Admin API Routes
app.use('/api', apiRouter);

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Chatbot Endpoint (Gemini 3.5 Flash)
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, userMessage } = req.body;
    const ai = getAI();

    // Format conversation history for @google/genai
    const contents = (messages || []).map((m: { sender: string; text: string }) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    if (userMessage) {
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction: `You are the Apex Luxury Car Rental Fleet Concierge.
You represent a premier rent-a-car agency in Pakistan that strictly enforces 100% exact vehicle model matching.
Our fleet:
1. Toyota Corolla Altis 1.6 (PKR 6,500/day | PKR 42,000/week) - Iconic reliability, executive comfort.
2. Toyota Yaris ATIV X (PKR 5,500/day | PKR 35,000/week) - City agility, supreme fuel economy.
3. Honda Civic RS Turbo (PKR 9,500/day | PKR 62,000/week) - Sport performance, Honda SENSING, executive presence.
4. Honda City Aspire 1.5 (PKR 6,000/day | PKR 39,000/week) - Elegant sedan, class-leading rear legroom.
5. Kia Sportage AWD (PKR 11,000/day | PKR 72,000/week) - Panoramic sunroof, elevated luxury crossover SUV.
6. Toyota Fortuner Legender 2.8L Sigma 4 (PKR 18,500/day | PKR 120,000/week) - 7-seater flagship 4x4 SUV.
7. Toyota Corolla Altis Grande (PKR 7,500/day | PKR 49,000/week) - Sunroof, ivory leather, paddle shifters.

Rules:
- Give polite, refined, high-end guidance.
- Answer questions on rental conditions (valid CNIC/Passport, driving license, refundable security deposit, 200 km/day allowance).
- Mention self-drive or driver options available upon request.
- Keep responses concise, clear, formatting with elegant bullet points when listing specs.
- Always offer to initiate booking via WhatsApp with the exact vehicle name.`,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'I would be delighted to assist you with our fleet availability.';
    res.json({ reply });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate concierge response' });
  }
});

// Text-to-Speech Endpoint (Gemini 3.1 Flash TTS Preview)
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Kore' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS synthesis' });
    }

    const ai = getAI();
    const promptText = `Speak in a warm, refined luxury automotive showroom tone: ${text}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice }, // 'Kore', 'Puck', 'Fenrir', 'Zephyr'
          },
        },
      },
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioBase64) {
      return res.status(500).json({ error: 'No audio stream returned from Gemini TTS' });
    }

    res.json({ audioBase64 });
  } catch (error: any) {
    console.error('TTS error:', error);
    res.status(500).json({ error: error.message || 'Failed to synthesize speech' });
  }
});

// Strict Vehicle Image Match & Inspection Analysis (Gemini 3.1 Pro Preview)
app.post('/api/analyze-vehicle', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', claimedModel } = req.body;
    if (!imageBase64 || !claimedModel) {
      return res.status(400).json({ error: 'imageBase64 and claimedModel are required' });
    }

    const ai = getAI();
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const promptText = `You are a forensic automotive model verifier adhering to STRICT VEHICLE MATCHING RULES.
The claimed vehicle listing is: "${claimedModel}".

Perform a thorough visual analysis of the provided car photograph:
1. Identify the exact manufacturer, model name, and generation/variant of the car in the photo.
2. Compare strictly against "${claimedModel}".
   - If the photo is a Toyota Yaris and claimed is Toyota Corolla -> MISMATCH (isMatch: false).
   - If the photo is a Honda Civic and claimed is Honda City -> MISMATCH (isMatch: false).
   - If the photo is a generic/different SUV and claimed is Kia Sportage -> MISMATCH (isMatch: false).
   - If the photo is a standard Corolla and claimed is Toyota Grande -> Verify specific Grande indicators (chrome garnish, alloy styling, badging) or note whether it accurately represents the Corolla/Grande family.
   - If the photo is another brand entirely -> MISMATCH (isMatch: false).
   - Only return isMatch: true if the photo genuinely depicts the exact vehicle model "${claimedModel}".
3. Provide confidence score (0-100), detailed explanation, and 3-4 visual checkmarks (e.g., "Front grille and headlamp profile", "Manufacturer badge", "Wheel design", "Body silhouette").`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          { text: promptText },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isMatch: { type: Type.BOOLEAN, description: 'True if image strictly matches claimed vehicle model' },
            detectedModel: { type: Type.STRING, description: 'The exact vehicle model detected in image' },
            claimedModel: { type: Type.STRING, description: 'The model claimed by user' },
            confidence: { type: Type.NUMBER, description: 'Confidence percentage 0-100' },
            explanation: { type: Type.STRING, description: 'Detailed forensic assessment' },
            visualCheckmarks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key visual evidence points detected',
            },
          },
          required: ['isMatch', 'detectedModel', 'claimedModel', 'confidence', 'explanation', 'visualCheckmarks'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Analyze vehicle error:', error);
    res.status(500).json({ error: error.message || 'Failed to inspect vehicle image' });
  }
});

// Vite middleware in dev, static files in production
async function start() {
  // Initialize and seed SQLite database
  await initDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Apex Car Rental server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
