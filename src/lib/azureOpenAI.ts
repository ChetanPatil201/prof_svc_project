import { retryWithBackoff } from './utils';

// Remove SDK imports and implementation, use REST API with fetch

export async function getOpenAICompletion(prompt: string, options?: { maxTokens?: number; temperature?: number; seed?: number }) {
  console.log("🔍 [Azure OpenAI Lib] Starting getOpenAICompletion");
  console.log("🔍 [Azure OpenAI Lib] Prompt length:", prompt.length);
  console.log("🔍 [Azure OpenAI Lib] Options:", JSON.stringify(options));
  
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-35-turbo';

  console.log("🔍 [Azure OpenAI Lib] Environment variables:");
  console.log("  - Endpoint:", endpoint ? "Set" : "Not set");
  console.log("  - API Key:", apiKey ? "Set" : "Not set");
  console.log("  - Deployment:", deployment);

  if (!endpoint || !apiKey) {
    console.error("❌ [Azure OpenAI Lib] Missing environment variables");
    throw new Error('Azure OpenAI endpoint or key not set');
  }
  
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`;
  console.log("🔍 [Azure OpenAI Lib] API URL:", url);
  
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
  
  console.log("🔍 [Azure OpenAI Lib] Request body size:", JSON.stringify(body).length);
  console.log("🔍 [Azure OpenAI Lib] Making fetch request with retry logic...");
  
  return await retryWithBackoff(async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey as string,
      } as Record<string, string>,
      body: JSON.stringify(body),
    });
    
    console.log("🔍 [Azure OpenAI Lib] Response status:", res.status);
    console.log("🔍 [Azure OpenAI Lib] Response ok:", res.ok);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ [Azure OpenAI Lib] API Error Response:", errorText);
      console.error("❌ [Azure OpenAI Lib] Response Status:", res.status);
      console.error("❌ [Azure OpenAI Lib] Response Headers:", Object.fromEntries(res.headers.entries()));
      throw new Error(`Azure OpenAI error: ${res.status} ${res.statusText} - ${errorText}`);
    }
    
    const data = await res.json();
    console.log("✅ [Azure OpenAI Lib] API call successful");
    console.log("🔍 [Azure OpenAI Lib] Response data keys:", Object.keys(data));
    console.log("🔍 [Azure OpenAI Lib] Choices count:", data.choices?.length || 0);
    
    const content = data.choices?.[0]?.message?.content || '';
    console.log("🔍 [Azure OpenAI Lib] Content length:", content.length);
    
    return content;
  }, 3, 1000, 10000); // 3 retries, 1s base delay, 10s max delay
} 