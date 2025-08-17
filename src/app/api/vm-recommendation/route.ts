import { NextRequest } from "next/server";
import { parseMigrateReport, recommendVmSizes } from "@/lib/azureVmAnalysis";

export async function GET(req: NextRequest) {
    return new Response(JSON.stringify({ error: "GET method not supported" }), {
    status: 405,
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
    console.error("❌ [VM Recommendation API] Error:", e.message);
    console.error("❌ [VM Recommendation API] Stack trace:", e.stack);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
} 