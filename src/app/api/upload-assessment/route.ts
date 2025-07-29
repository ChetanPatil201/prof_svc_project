import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import { transformAssessedMachine, transformAssessedDisk } from '@/lib/azureVmAnalysis';
import { FullAssessmentReportData } from '@/types/assessmentReport';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    let sheets: Record<string, any[]> = {};
    if (ext === 'xlsx' || ext === 'xls') {
      const data = await file.arrayBuffer();
      const uint8 = new Uint8Array(data);
      const workbook = XLSX.read(uint8, { type: 'array' });
      for (const name of workbook.SheetNames) {
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
        sheets[name] = rows;
      }
    } else if (ext === 'csv') {
      // Assume CSV is All_Assessed_Machines
      const text = await file.text();
      const rows = text.split('\n').map(line => line.split(','));
      sheets['All_Assessed_Machines'] = rows;
    } else if (ext === 'json') {
      const text = await file.text();
      sheets = JSON.parse(text);
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported file type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Transform data
    const assessedMachines = (sheets.All_Assessed_Machines || []).map((row) => {
      const transformed = transformAssessedMachine(row);
      // Map property names to match AssessedMachine interface
      return {
        ...transformed,
        estimatedMonthlySavingsHybridBenefitWindows: transformed.estimatedMonthlySavingsFromAzureHybridBenefitForWindowsOsUsd ?? 0,
        estimatedMonthlySavingsHybridBenefitLinux: transformed.estimatedMonthlySavingsFromAzureHybridBenefitForLinuxOsUsd ?? 0,
      };
    });
    const assessedDisks = (sheets.All_Assessed_Disks || []).map(transformAssessedDisk);
    // Build final structure
    const result: FullAssessmentReportData = {
      assessedMachines,
      assessedDisks,
      assessmentProperties: sheets.Assessment_Properties || [],
    };
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in upload-assessment:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 