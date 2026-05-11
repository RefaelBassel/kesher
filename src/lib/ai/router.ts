import { callGemini } from './gemini';
import { callGroq } from './groq';

export interface AIResult<T> {
  data: T;
  provider: 'gemini' | 'groq';
  tokensUsed: number;
}

// Try Gemini first; fall back to Groq if it errors or rate-limits.
export async function callAI<T>(prompt: string, jsonSchema?: any): Promise<AIResult<T>> {
  try {
    return await callGemini<T>(prompt, jsonSchema);
  } catch (e) {
    console.warn('[ai] Gemini failed, falling back to Groq:', (e as Error).message);
    return await callGroq<T>(prompt);
  }
}
