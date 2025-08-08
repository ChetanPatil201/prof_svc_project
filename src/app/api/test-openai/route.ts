import { NextRequest } from 'next/server';
import { getOpenAICompletion } from '@/lib/azureOpenAI';

export async function GET(req: NextRequest) {
  try {
    console.log('Testing Azure OpenAI API...');
    
    // Test with a simple prompt
    const completion = await getOpenAICompletion('Hello, this is a test message.', {
      temperature: 0,
      maxTokens: 100
    });
    
    return new Response(JSON.stringify({ 
      success: true, 
      completion,
      message: 'Azure OpenAI API is working correctly'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Azure OpenAI API Error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 