import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

let _client: GoogleGenerativeAI | null = null;
function getClient() {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) throw new Error('GOOGLE_GEMINI_API_KEY not set');
  return (_client ??= new GoogleGenerativeAI(key));
}

export interface AICallResult<T> {
  data: T;
  provider: 'gemini';
  tokensUsed: number;
}

export async function callGemini<T>(prompt: string, jsonSchema?: any): Promise<AICallResult<T>> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      ...(jsonSchema ? { responseSchema: jsonSchema } : {}),
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const tokensUsed = result.response.usageMetadata?.totalTokenCount ?? 0;

  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    // Sometimes the model wraps JSON in ```json fences despite responseMimeType
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    data = JSON.parse(cleaned) as T;
  }
  return { data, provider: 'gemini', tokensUsed };
}

export { SchemaType };
