import { NextRequest } from "next/server";
import { sampleMigrateReport, parseMigrateReport, recommendVmSizes } from "@/lib/azureVmAnalysis";

export async function GET(req: NextRequest) {
  // For testing: use the sample report
  const workloads = parseMigrateReport(sampleMigrateReport);
  const recommendations = await recommendVmSizes(workloads);
  return new Response(JSON.stringify({ recommendations }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// For POST: accept uploaded report in JSON body
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const workloads = parseMigrateReport(body);
    const recommendations = await recommendVmSizes(workloads);
    return new Response(JSON.stringify({ recommendations }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
} 