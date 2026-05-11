import Groq from 'groq-sdk';

let _client: Groq | null = null;
function getClient() {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not set');
  return (_client ??= new Groq({ apiKey: key }));
}

export interface AICallResult<T> {
  data: T;
  provider: 'groq';
  tokensUsed: number;
}

export async function callGroq<T>(prompt: string): Promise<AICallResult<T>> {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You return only valid JSON, no markdown fences, no commentary. Follow the requested schema exactly.',
      },
      { role: 'user', content: prompt },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? '{}';
  const tokensUsed = completion.usage?.total_tokens ?? 0;
  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    data = JSON.parse(cleaned) as T;
  }
  return { data, provider: 'groq', tokensUsed };
}
