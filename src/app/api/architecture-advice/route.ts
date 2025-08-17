import { NextRequest, NextResponse } from 'next/server';
import { getArchitectureAdvice } from '@/lib/archAdvisor';
import type { AssessmentReportData } from '@/types/assessmentReport';

export async function POST(request: NextRequest) {
  try {
    const assessment: AssessmentReportData = await request.json();
    
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment data is required' },
        { status: 400 }
      );
    }

    const advice = await getArchitectureAdvice(assessment);
    
    return NextResponse.json(advice);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate architecture advice', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 