import { retryWithBackoff } from './utils';

// Remove SDK imports and implementation, use REST API with fetch

export async function getOpenAICompletion(prompt: string, options?: { maxTokens?: number; temperature?: number; seed?: number }) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';

  if (!endpoint || !apiKey) {
    throw new Error('Azure OpenAI endpoint or key not set. Please check your environment variables.');
  }
  
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
  
  return await retryWithBackoff(async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey as string,
      } as Record<string, string>,
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Azure OpenAI error: ${res.status} ${res.statusText} - ${errorText}`);
    }
    
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    return content;
  }, 3, 1000, 10000); // 3 retries, 1s base delay, 10s max delay
} 