// Remove SDK imports and implementation, use REST API with fetch

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_KEY;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-35-turbo';

if (!endpoint || !apiKey) throw new Error('Azure OpenAI endpoint or key not set');

export async function getOpenAICompletion(prompt: string, options?: { maxTokens?: number; temperature?: number; seed?: number }) {
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`;
  const body: any = {
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: options?.maxTokens || 512,
    temperature: options?.temperature ?? 0.7,
  };
  
  // Add seed for deterministic responses if provided
  if (options?.seed !== undefined) {
    body.seed = options.seed;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey as string,
    } as Record<string, string>,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Azure OpenAI error: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
} 