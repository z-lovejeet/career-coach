import { GoogleGenAI } from '@google/genai';
import { getGemini38Usage, recordGemini38Request } from './ai';

export async function readResumeWithGemini(pdf: Buffer, prompt: string, jsonMode = false) {
  if (!process.env.GEMINI_API_KEY) return '';
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const primary = 'gemini-3.8-flash';
  const fallback = 'gemini-3.5-flash-lite';
  const models = getGemini38Usage().allowed ? [primary, fallback] : [fallback];
  const data = pdf.toString('base64');

  for (const model of models) {
    try {
      const result = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType: 'application/pdf', data } }, { text: prompt }] }],
        config: {
          ...(jsonMode && { responseMimeType: 'application/json' }),
          temperature: 0.3,
          maxOutputTokens: 4096,
          abortSignal: AbortSignal.timeout(20000),
        },
      });
      if (model === primary) recordGemini38Request();
      if (result.text?.trim()) return result.text.trim();
    } catch {
      console.warn(`[Resume] ${model} extraction failed.`);
    }
  }
  return '';
}
