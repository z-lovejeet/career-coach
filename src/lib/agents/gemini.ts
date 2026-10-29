/**
 * AI Provider Facade:
 * Powered by Groq (openai/gpt-oss-120b) & Google Gemini (3.8-flash -> 3.5-flash-lite)
 */
export {
  callGemini,
  callGroq,
  callAI,
  getGemini38Usage,
  recordGemini38Request,
  buildStudentContext,
} from './ai';
export type { AICallOptions } from './ai';
