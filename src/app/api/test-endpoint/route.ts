import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  
  if (!endpoint || !apiKey) {
    return new Response(JSON.stringify({ error: 'Missing environment variables' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Test different URL formats
  const urlFormats = [
    `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`,
    `${endpoint}openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`,
    `${endpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`
  ];

  const results: any[] = [];

  for (let i = 0; i < urlFormats.length; i++) {
    const url = urlFormats[i];
    try {
      const body = {
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello' },
        ],
        max_tokens: 10,
        temperature: 0,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify(body),
      });

      const responseText = await res.text();
      
      results.push({ 
        format: i + 1,
        url: url,
        status: res.status,
        statusText: res.statusText,
        response: responseText.substring(0, 200) // First 200 chars
      });
    } catch (error: any) {
      results.push({ 
        format: i + 1,
        url: url,
        error: error.message 
      });
    }
  }

  return new Response(JSON.stringify({ 
    endpoint,
    deployment,
    apiKeyLength: apiKey?.length || 0,
    results 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
} 