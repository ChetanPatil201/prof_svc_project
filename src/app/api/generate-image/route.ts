import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('Generate image API called');
  
  try {
    const body = await request.json();
    const { prompt, size = '1024x1024', quality = 'hd', style = 'natural' } = body;

    console.log('Image generation parameters:', { size, quality, style });
    console.log('Azure OpenAI configuration:', { 
      endpoint: azureOpenAIEndpoint, 
      deployment: azureOpenAIDeployment, 
      apiVersion: apiVersion 
    });

    // Check for Azure OpenAI configuration (Image Generation specific)
    const azureOpenAIEndpoint = process.env.AZURE_OPENAI_IMG_ENDPOINT || "https://cp-azureopenai-img.openai.azure.com/";
    const azureOpenAIKey = process.env.AZURE_OPENAI_IMG_KEY;
    const azureOpenAIDeployment = process.env.AZURE_OPENAI_IMG_DEPLOYMENT || "dall-e-3";
    const apiVersion = process.env.AZURE_OPENAI_IMG_API_VERSION || "2024-04-01-preview";

    if (!azureOpenAIKey) {
      console.error('Azure OpenAI image generation key not configured');
      return NextResponse.json(
        { 
          error: 'Azure OpenAI image generation is not configured. Please set up AZURE_OPENAI_IMG_KEY environment variable.',
        },
        { status: 500 }
      );
    }

    // Call Azure OpenAI DALL-E API
    const response = await fetch(`${azureOpenAIEndpoint}/openai/deployments/${azureOpenAIDeployment}/images/generations?api-version=${apiVersion}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': azureOpenAIKey,
      },
      body: JSON.stringify({
        prompt: prompt,
        size: size,
        quality: quality,
        style: style,
        n: 1
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Azure OpenAI API error:', errorData);
      throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Image generated successfully');

    // Return the image URL
    return NextResponse.json({ 
      success: true, 
      imageUrl: result.data[0].url,
      revisedPrompt: result.data[0].revised_prompt
    });

  } catch (error) {
    console.error('Error in generate image API:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Azure OpenAI not configured') || error.message.includes('Azure OpenAI key not configured') || error.message.includes('Azure OpenAI image generation key not configured')) {
        return NextResponse.json(
          { 
            error: 'Azure OpenAI image generation is not configured. Please set up AZURE_OPENAI_IMG_KEY environment variable.',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate image. Please try again.',
      },
      { status: 500 }
    );
  }
}
