import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_KEY;
  
  if (!endpoint || !apiKey) {
    return new Response(JSON.stringify({ error: 'Missing environment variables' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const deployments = ['gpt-4o', 'gpt-35-turbo', 'gpt-4', 'gpt-4o-mini'];
  const results: any[] = [];

  for (const deployment of deployments) {
    try {
      const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`;
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

      if (res.ok) {
        results.push({ deployment, status: 'SUCCESS', statusCode: res.status });
      } else {
        const errorText = await res.text();
        results.push({ 
          deployment, 
          status: 'FAILED', 
          statusCode: res.status, 
          error: errorText 
        });
      }
    } catch (error: any) {
      results.push({ 
        deployment, 
        status: 'ERROR', 
        error: error.message 
      });
    }
  }

  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
} 