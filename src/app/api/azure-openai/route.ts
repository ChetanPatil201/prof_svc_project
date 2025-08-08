import { NextRequest } from 'next/server';
import { getOpenAICompletion } from '@/lib/azureOpenAI';

export async function POST(req: NextRequest) {
  try {
    console.log("🔍 [Azure OpenAI API] Request received");
    const { prompt, options } = await req.json();
    console.log("🔍 [Azure OpenAI API] Prompt length:", prompt?.length || 0);
    console.log("🔍 [Azure OpenAI API] Options:", JSON.stringify(options));
    
    if (!prompt) {
      console.error("❌ [Azure OpenAI API] No prompt provided");
      return new Response(JSON.stringify({ error: 'Prompt is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.log("🔍 [Azure OpenAI API] Calling getOpenAICompletion...");
    const completion = await getOpenAICompletion(prompt, options);
    console.log("✅ [Azure OpenAI API] Completion successful, length:", completion?.length || 0);
    
    return new Response(JSON.stringify({ completion }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error("❌ [Azure OpenAI API] Error:", e.message);
    console.error("❌ [Azure OpenAI API] Stack trace:", e.stack);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 