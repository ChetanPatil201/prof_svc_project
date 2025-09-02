"use client"

import React from 'react';
import AzureArchitectureDiagram from './AzureArchitectureDiagram';
import type { AssessmentReportData } from '@/types/assessmentReport';

interface ArchitectureDiagramProps {
  assessment?: AssessmentReportData;
  className?: string;
}

export default function ArchitectureDiagram({ assessment, className = '' }: ArchitectureDiagramProps) {


}