import { NextRequest, NextResponse } from 'next/server';
import { cafSuggest } from '@/lib/ai/cafSuggest';
import type { AssessmentReportData } from '@/types/assessmentReport';

export async function POST(request: NextRequest) {
  console.log('AI suggest API called');
  
  try {
    const assessment: AssessmentReportData = await request.json();
    console.log('Assessment data received:', { 
      clientName: assessment?.clientName, 
      totalServers: assessment?.totalServers 
    });
    
    // Validate required fields
    if (!assessment) {
      console.log('No assessment data provided');
      return NextResponse.json(
        { error: 'Assessment data is required' },
        { status: 400 }
      );
    }

    console.log('Generating AI suggestions...');
    // Generate AI suggestions
    const aiArchitecture = await cafSuggest(assessment);
    console.log('AI suggestions generated successfully');
    
    return NextResponse.json(aiArchitecture);
  } catch (error) {
    console.error('Error in AI suggest API:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Azure OpenAI endpoint or key not set')) {
        return NextResponse.json(
          { 
            error: 'Azure OpenAI not configured',
            details: 'Please configure AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY environment variables'
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
