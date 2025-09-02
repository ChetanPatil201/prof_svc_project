import { NextRequest } from 'next/server';
import { getOpenAICompletion } from '@/lib/azureOpenAI';

export async function POST(req: NextRequest) {
  try {
    const { prompt, options } = await req.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const completion = await getOpenAICompletion(prompt, options);
    
    return new Response(JSON.stringify({ completion }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 