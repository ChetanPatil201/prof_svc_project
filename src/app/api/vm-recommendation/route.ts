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
    console.log("🔍 [VM Recommendation API] Request received");
    const body = await req.json();
    console.log("🔍 [VM Recommendation API] Request body type:", typeof body);
    console.log("🔍 [VM Recommendation API] Request body length:", Array.isArray(body) ? body.length : "Not an array");
    console.log("🔍 [VM Recommendation API] First item sample:", Array.isArray(body) && body.length > 0 ? JSON.stringify(body[0]).substring(0, 200) + "..." : "No items");
    
    const workloads = parseMigrateReport(body);
    console.log("🔍 [VM Recommendation API] Workloads parsed:", workloads.length);
    
    const recommendations = await recommendVmSizes(workloads);
    console.log("✅ [VM Recommendation API] Recommendations generated:", recommendations.length);
    
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