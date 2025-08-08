import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return new Response(JSON.stringify({
    endpoint: process.env.AZURE_OPENAI_ENDPOINT ? 'Set' : 'Not set',
    key: process.env.AZURE_OPENAI_KEY ? 'Set' : 'Not set',
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'Not set',
    nodeEnv: process.env.NODE_ENV || 'Not set'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
} 