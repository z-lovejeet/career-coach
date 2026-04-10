import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  const models = ['gemini-3.1-flash-lite-preview', 'gemini-2.5-flash-lite', 'gemini-2.5-flash'];
  for (const model of models) {
      try {
        console.log(`Testing ${model}...`);
        const response = await ai.models.generateContent({
              model,
              contents: "Hello",
        });
        console.log(`Success: ${model}`);
      } catch(e) {
        console.error(`Failed ${model}:`, e.message);
      }
  }
}
run();
