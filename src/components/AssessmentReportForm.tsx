import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FileText, NotebookPen, MessageSquareText, FolderOpen, UploadCloud, RotateCcw, Network, Eye, EyeOff } from "lucide-react"
import * as XLSX from "xlsx"
import Papa from "papaparse"
import type { ParseResult, ParseError } from "papaparse"
import { transformAssessedMachine, transformAssessedDisk } from "@/lib/azureVmAnalysis";
import { fetchAzureVmPricing, fetchAzureVmPriceDirect } from '@/lib/azureVmAnalysis';
import { AssessmentReportData } from '@/types/assessmentReport';
import { retryWithBackoff } from '@/lib/utils';
import AssessmentFileUpload from "./AssessmentFileUpload";

/**
 * AssessmentReportForm Component
 * 
 * Enhanced with Architecture Diagram Generation
 * 
 * This component now integrates the AzureIconDiagramViewer to provide
 * AI-powered Azure architecture diagrams with Azure service icons based on assessment data.
 * 
 * Key Features:
 * - File upload and parsing for Azure Migrate assessment data
 * - AI-powered VM sizing and cost optimization
 * - Architecture diagram generation using Azure OpenAI
 * - Interactive diagram viewing with zoom, fullscreen, and download
 * 
 * Integration Points:
 * - Diagram generation triggered after successful assessment
 * - Data transformation from assessment format to diagram format
 * - Error handling and user feedback
 * - State management for diagram visibility and data
 * 
 * Future Extensions:
 * - Real-time diagram updates when assessment data changes
 * - Multiple diagram templates and styles
 * - Collaborative diagram editing
 * - Export diagrams to various formats (SVG, PDF, etc.)
 * - Integration with Azure DevOps for deployment pipelines
 */

// Improved pipe table parser: extract only the first markdown table
function parsePipeTable(tableString: string) {
  // Find the first line that starts with '| VM Name'
  const lines = tableString.split('\n');
  const startIdx = lines.findIndex(line => line.trim().startsWith('| VM Name'));
  if (startIdx === -1) return [];
  // Find where the table ends (next blank line or end of string)
  let endIdx = startIdx + 1;
  while (endIdx < lines.length && lines[endIdx].trim().startsWith('|')) {
    endIdx++;
  }
  const tableLines = lines.slice(startIdx, endIdx).map(line => line.trim()).filter(Boolean);
  if (tableLines.length < 2) return [];
  
  // Filter out separator lines (lines with only hyphens, dashes, or empty content)
  const validLines = tableLines.filter(line => {
    const cells = line.split('|').map(cell => cell.trim());
    return !cells.every(cell => 
      cell === '' || 
      cell === '---' || 
      cell === '----' || 
      cell === '-----' || 
      cell === '------' || 
      cell === '-------' || 
      cell === '--------' || 
      cell === '---------' || 
      cell === '----------' || 
      cell === '-----------' ||
      cell === 'CRS' ||
      cell === '(USD)'
    );
  });
  
  if (validLines.length < 2) return [];
  
  const headers = validLines[0].split('|').map(h => h.trim()).filter(Boolean);
  return validLines.slice(1).map(line => {
    const cells = line.split('|').map(cell => cell.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      const cellValue = cells[i + 1] || '';
      // Filter out separator characters and invalid content
      if (cellValue === '---' || cellValue === '----' || cellValue === '-----' || 
          cellValue === '------' || cellValue === '-------' || cellValue === '--------' || 
          cellValue === '---------' || cellValue === '----------' || cellValue === '-----------' ||
          cellValue === 'CRS' || cellValue === '(USD)') {
        row[header] = '';
      } else {
        row[header] = cellValue;
      }
    });
    return row;
  }).filter(row => {
    // Only keep rows that have at least one non-empty value
    return Object.values(row).some(value => value && value.trim() !== '');
  });
}

export function AssessmentReportForm({ onComplete }: { onComplete?: (assessment: AssessmentReportData) => void }) {
  const [azureReport, setAzureReport] = useState<File | null>(null)
  const [azureReport1Yr, setAzureReport1Yr] = useState<File | null>(null);
  const [azureReport3Yr, setAzureReport3Yr] = useState<File | null>(null);
  const [notesFile, setNotesFile] = useState<File | null>(null)
  const [meetingTranscript, setMeetingTranscript] = useState<File | null>(null)
  const [otherDetails, setOtherDetails] = useState<string>("")
  const [rulesAndConstraints, setRulesAndConstraints] = useState<string>("")
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recommendations, setRecommendations] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [parsedInput, setParsedInput] = useState<any[] | null>(null)
  const [genAIOutput, setGenAIOutput] = useState<string | null>(null);
  const [reportData, setReportData] = useState<AssessmentReportData | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  


  const azureReportRef = useRef<HTMLInputElement>(null)
  const azureReport1YrRef = useRef<HTMLInputElement>(null)
  const azureReport3YrRef = useRef<HTMLInputElement>(null)
  const notesFileRef = useRef<HTMLInputElement>(null)
  const meetingTranscriptRef = useRef<HTMLInputElement>(null)
  const templateFileRef = useRef<HTMLInputElement>(null)

  // Comprehensive reset function to clear all state and file inputs
  const resetForm = useCallback(() => {
    setIsResetting(true);
    
    // Clear all state variables
    setAzureReport(null);
    setAzureReport1Yr(null);
    setAzureReport3Yr(null);
    setNotesFile(null);
    setMeetingTranscript(null);
    setOtherDetails("");
    setRulesAndConstraints("");
    setTemplateFile(null);
    setIsSubmitting(false);
    setRecommendations(null);
    setError(null);
    setParsedInput(null);
    setGenAIOutput(null);
    setReportData(null);
    setShowSuccessMessage(false);

    // Clear all file input elements
    if (azureReportRef.current) azureReportRef.current.value = "";
    if (azureReport1YrRef.current) azureReport1YrRef.current.value = "";
    if (azureReport3YrRef.current) azureReport3YrRef.current.value = "";
    if (notesFileRef.current) notesFileRef.current.value = "";
    if (meetingTranscriptRef.current) meetingTranscriptRef.current.value = "";
    if (templateFileRef.current) templateFileRef.current.value = "";

    console.log("🔄 [Reset] Form and all state cleared successfully");
    
    // Reset the resetting flag after a short delay
    setTimeout(() => setIsResetting(false), 500);
  }, []);

  // Auto-reset when starting a new assessment
  const handleStartNewAssessment = useCallback(() => {
    if (window.confirm("Are you sure you want to start a new assessment?\n\nThis will clear:\n• All uploaded files\n• Current assessment results\n• Form data and settings\n\nMake sure you've downloaded your report before proceeding.")) {
      resetForm();
    }
  }, [resetForm]);

  // Helper: Parse file to JSON array (all sheets)
  async function parseAssessmentSheets(file: File): Promise<any> {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "xlsx" || ext === "xls") {
      const data = await file.arrayBuffer();
      const uint8 = new Uint8Array(data);
      const workbook = XLSX.read(uint8, { type: "array" });
      const sheets: Record<string, any[]> = {};
      for (const name of workbook.SheetNames) {
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
        sheets[name] = rows;
      }
      return sheets;
    } else if (ext === "csv") {
      // Assume CSV is All_Assessed_Machines
      return { All_Assessed_Machines: await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          Papa.parse(reader.result as string, {
            header: true,
            complete: (results: ParseResult<any>) => resolve(results.data),
          });
        };
        reader.onerror = (err) => reject(err);
        reader.readAsText(file);
      }) };
    } else if (ext === "json") {
      const text = await file.text();
      return JSON.parse(text);
    } else {
      throw new Error("Unsupported file type. Please upload .xlsx, .csv, or .json.");
    }
  }

  // Helper: Map AssessedMachineRow to VMWorkload for backend
  function toVMWorkload(machine: any): any {
    return {
      vmName: machine.machine || '',
      cores: Number(machine.cores) || 0,
      memoryGB: machine.memoryMb ? Number(machine.memoryMb) / 1024 : 0,
      region: 'eastus', // Default or map if you have region info
      osType: (machine.operatingSystem || '').toLowerCase().includes('windows') ? 'Windows' : 'Linux',
      recommendedSize: machine.recommendedSize || '',
    };
  }

  // Helper: Parse and format rules and constraints for AI prompt
  function formatRulesAndConstraints(rules: string): string {
    if (!rules || rules.trim() === '') return '';
    
    // Convert to uppercase for better AI understanding
    const formattedRules = rules
      .split('\n')
      .map(rule => rule.trim())
      .filter(rule => rule.length > 0)
      .map(rule => `• ${rule}`)
      .join('\n');
    
    return formattedRules;
  }

  // Helper: Parse and format disk-specific constraints for AI prompt
  function formatDiskConstraints(rules: string): string {
    if (!rules || rules.trim() === '') return '';
    
    const diskKeywords = [
      'premium', 'premium v2', 'premium v1', 'premium disk', 'premium ssd', 'premium ssd v2',
      'standard', 'standard ssd', 'standard hdd', 'ultra', 'ultra disk', 'disk', 'ssd', 'hdd'
    ];
    
    const diskConstraints = rules
      .split('\n')
      .map(rule => rule.trim().toLowerCase())
      .filter(rule => rule.length > 0)
      .filter(rule => diskKeywords.some(keyword => rule.includes(keyword)))
      .map(rule => {
        // Make disk constraints more explicit
        if (rule.includes('premium v2') || rule.includes('premiumv2')) {
          return '• DO NOT recommend Premium SSD V2 disks under ANY circumstances';
        }
        if (rule.includes('premium') && !rule.includes('v2')) {
          return '• DO NOT recommend Premium SSD disks under ANY circumstances';
        }
        if (rule.includes('ultra')) {
          return '• DO NOT recommend Ultra Disk under ANY circumstances';
        }
        if (rule.includes('standard ssd')) {
          return '• PREFER Standard SSD over other disk types when possible';
        }
        if (rule.includes('standard hdd')) {
          return '• PREFER Standard HDD over other disk types when possible';
        }
        return `• ${rule}`;
      })
      .join('\n');
    
    return diskConstraints || '• No specific disk constraints provided';
  }

  function getMigratePrice(row: any): string | number | null {
    // Try common column names for price
    return (
      row["Migrate Price"] ||
      row["Monthly Price"] ||
      row["Price"] ||
      row["Price/Month"] ||
      row["EstimatedMonthlyCost"] ||
      row["Estimated Monthly Cost"] ||
      row["MonthlyCost"] ||
      row["Monthly Cost"] ||
      null
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 [Form Submit] Starting assessment report generation...");
    console.log("🔍 [Form Submit] Files uploaded:");
    console.log("  - Azure Report (Pay-as-you-go):", azureReport?.name || "Not uploaded");
    console.log("  - Azure Report (1-Year):", azureReport1Yr?.name || "Not uploaded");
    console.log("  - Azure Report (3-Year):", azureReport3Yr?.name || "Not uploaded");
    console.log("  - Notes File:", notesFile?.name || "Not uploaded");
    console.log("  - Meeting Transcript:", meetingTranscript?.name || "Not uploaded");
    console.log("  - Template File:", templateFile?.name || "Not uploaded");
    
    setIsSubmitting(true);
    setRecommendations(null);
    setError(null);
    setParsedInput(null);
    setGenAIOutput(null);
    try {
      if (!azureReport) throw new Error("Please upload an Azure Migrate Assessment Report (Pay-as-you-go).");
      
      console.log("🔍 [Form Submit] Starting file parsing...");
      
      // Parse all three assessment reports
      console.log("🔍 [Form Submit] Parsing Pay-as-you-go report...");
      const payAsYouGoSheets = await parseAssessmentSheets(azureReport);
      console.log("✅ [Form Submit] Pay-as-you-go report parsed successfully");
      console.log("🔍 [Form Submit] Pay-as-you-go sheets:", Object.keys(payAsYouGoSheets));
      
      console.log("🔍 [Form Submit] Parsing 1-Year report...");
      const oneYearSheets = azureReport1Yr ? await parseAssessmentSheets(azureReport1Yr) : null;
      console.log("✅ [Form Submit] 1-Year report parsed successfully");
      if (oneYearSheets) console.log("🔍 [Form Submit] 1-Year sheets:", Object.keys(oneYearSheets));
      
      console.log("🔍 [Form Submit] Parsing 3-Year report...");
      const threeYearSheets = azureReport3Yr ? await parseAssessmentSheets(azureReport3Yr) : null;
      console.log("✅ [Form Submit] 3-Year report parsed successfully");
      if (threeYearSheets) console.log("🔍 [Form Submit] 3-Year sheets:", Object.keys(threeYearSheets));
      
      // Parse Pay-as-you-go data (primary data source)
      console.log("🔍 [Form Submit] Extracting data from sheets...");
      const payAsYouGoMachines = payAsYouGoSheets.All_Assessed_Machines || [];
      const payAsYouGoDisks = payAsYouGoSheets.All_Assessed_Disks || [];
      console.log("🔍 [Form Submit] Pay-as-you-go machines count:", payAsYouGoMachines.length);
      console.log("🔍 [Form Submit] Pay-as-you-go disks count:", payAsYouGoDisks.length);
      
      // Extract region from Assessment_Summary sheet
      const assessmentSummary = payAsYouGoSheets.Assessment_Summary || [];
      let targetRegion = 'eastus'; // default fallback
      
      // Look for region information in Assessment_Summary
      const regionRow = assessmentSummary.find((row: any) => 
        row.Property && (
          row.Property.toLowerCase().includes('region') ||
          row.Property.toLowerCase().includes('location') ||
          row.Property.toLowerCase().includes('target region')
        )
      );
      
      if (regionRow && regionRow.SelectedValue) {
        targetRegion = regionRow.SelectedValue.toLowerCase().replace(/\s+/g, '');
      }
      console.log("🔍 [Form Submit] Target region:", targetRegion);
      
      // Parse 1-Year Reserved Instance data
      const oneYearMachines = oneYearSheets?.All_Assessed_Machines || [];
      const oneYearDisks = oneYearSheets?.All_Assessed_Disks || [];
      console.log("🔍 [Form Submit] 1-Year machines count:", oneYearMachines.length);
      console.log("🔍 [Form Submit] 1-Year disks count:", oneYearDisks.length);
      
      // Parse 3-Year Reserved Instance data
      const threeYearMachines = threeYearSheets?.All_Assessed_Machines || [];
      const threeYearDisks = threeYearSheets?.All_Assessed_Disks || [];
      console.log("🔍 [Form Submit] 3-Year machines count:", threeYearMachines.length);
      console.log("🔍 [Form Submit] 3-Year disks count:", threeYearDisks.length);
      
      // Transform all data
      console.log("🔍 [Form Submit] Starting data transformation...");
      const transformedPayAsYouGoMachines = payAsYouGoMachines.map(transformAssessedMachine);
      const transformedPayAsYouGoDisks = payAsYouGoDisks.map(transformAssessedDisk);
      const transformedOneYearMachines = oneYearMachines.map(transformAssessedMachine);
      const transformedOneYearDisks = oneYearDisks.map(transformAssessedDisk);
      const transformedThreeYearMachines = threeYearMachines.map(transformAssessedMachine);
      const transformedThreeYearDisks = threeYearDisks.map(transformAssessedDisk);
      console.log("✅ [Form Submit] Data transformation completed");
      
      setParsedInput(transformedPayAsYouGoMachines);
      
      // Map to VMWorkload format for backend
      console.log("🔍 [Form Submit] Creating VM workloads for API...");
      const vmWorkloads = transformedPayAsYouGoMachines.map(toVMWorkload);
      console.log("🔍 [Form Submit] VM workloads count:", vmWorkloads.length);
      
      // POST to API for recommendations
      console.log("🔍 [Form Submit] Calling VM recommendation API...");
      
      const data = await retryWithBackoff(async () => {
        const res = await fetch("/api/vm-recommendation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(vmWorkloads),
        });
        console.log("🔍 [Form Submit] VM recommendation API response status:", res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("❌ [Form Submit] VM recommendation API error:", errorText);
          throw new Error(`Failed to get recommendations. Status: ${res.status}, Response: ${errorText}`);
        }
        
        return await res.json();
      }, 3, 1000, 10000); // 3 retries, 1s base delay, 10s max delay
      
      console.log("✅ [Form Submit] VM recommendations received successfully");
      setRecommendations(data.recommendations);
      // Prepare a detailed prompt for GenAI with all VM and disk data
      const vmDataJson = JSON.stringify(transformedPayAsYouGoMachines);
      const diskDataJson = JSON.stringify(transformedPayAsYouGoDisks);
      
      // Process VMs in batches to avoid context size limitations
      const batchSize = 3; // Process 3 VMs at a time
      let allGenAIResults: any[] = [];
      let lastAiData: any = null;
      
      for (let i = 0; i < transformedPayAsYouGoMachines.length; i += batchSize) {
        const batch = transformedPayAsYouGoMachines.slice(i, i + batchSize);
        const batchDisks = transformedPayAsYouGoDisks.filter((disk: any) => 
          batch.some((vm: any) => vm.machine === disk.machine)
        );
        
        const batchVmDataJson = JSON.stringify(batch);
        const batchDiskDataJson = JSON.stringify(batchDisks);
        
        // Enhanced prompt to include reserved instance pricing comparison
        const prompt = `You are a cloud infrastructure expert specializing in Azure VM sizing, disk optimization, and cost analysis. You will receive detailed VM and disk information from Azure Migrate assessments for Pay-as-you-go, 1-Year Reserved Instances, and 3-Year Reserved Instances, and provide comprehensive cost analysis and recommendations.

CONTEXT:
- Target Region: ${targetRegion} (use this region for all pricing calculations)
- Analysis Type: Workload-based VM sizing with cost optimization across different pricing models
- Requirements: Provide deterministic recommendations with accurate current Azure pricing and cost comparisons

For each VM, analyze the workload characteristics and recommend the optimal Azure VM SKU and disk configuration. Compare your recommendation with the Azure Migrate recommended SKU and provide cost analysis across Pay-as-you-go, 1-Year Reserved Instances, and 3-Year Reserved Instances.

IMPORTANT REQUIREMENTS:
1. Use temperature=0 and seed=42 for deterministic, consistent recommendations
2. Provide ACCURATE and CURRENT Azure pricing for both VM and disk recommendations
3. Pricing should be close to the Azure Migrate assessment prices shown in the data
4. Use current Azure Retail Prices API rates for the specified region
5. Consider workload patterns, CPU/memory ratios, and storage requirements
6. Include cost comparisons across all three pricing models (Pay-as-you-go, 1-Year RI, 3-Year RI)

${rulesAndConstraints ? `CUSTOM RULES AND CONSTRAINTS:
${formatRulesAndConstraints(rulesAndConstraints)}

CRITICAL DISK CONSTRAINT ENFORCEMENT:
You MUST strictly follow these disk-related constraints:
${formatDiskConstraints(rulesAndConstraints)}

CRITICAL: You MUST strictly adhere to these rules and constraints when making ALL recommendations including:
- VM SKU selection (compute resources)
- Disk type recommendations (Premium, Premium v2, Standard SSD, Standard HDD, Ultra Disk)
- Storage tier selection
- Any other Azure resource recommendations

These rules override any default optimization strategies and must be applied to every recommendation you make.` : ''}

${otherDetails ? `ADDITIONAL CONTEXT AND REQUIREMENTS:
${otherDetails}

Consider these requirements when analyzing workload characteristics and making recommendations.` : ''}

Return your answer as a markdown table with the following columns (and only these columns):
| VM Name | Migrate Recommended SKU | Pay-as-you-go (USD) | 1-Year RI (USD) | 3-Year RI (USD) | GenAI Recommended SKU | GenAI Pay-as-you-go (USD) | GenAI 1-Year RI (USD) | GenAI 3-Year RI (USD) | Best Option | Justification |

Here is a sample row format:
| VM Name | Migrate Recommended SKU | Pay-as-you-go (USD) | 1-Year RI (USD) | 3-Year RI (USD) | GenAI Recommended SKU | GenAI Pay-as-you-go (USD) | GenAI 1-Year RI (USD) | GenAI 3-Year RI (USD) | Best Option | Justification |
|---------|------------------------|---------------------|------------------|------------------|----------------------|---------------------------|----------------------|----------------------|-------------|--------------|
| VM1     | Standard_D2as_v5       | 144.60              | 120.50           | 95.30            | Standard_D2as_v5     | 144.60                   | 120.50                | 95.30                | 3-Year RI   | VM recommendation: Standard_D2as_v5 provides optimal CPU/memory balance. Cost analysis: 3-Year RI offers 34% savings vs Pay-as-you-go. |

DETAILED VM DATA (Batch ${Math.floor(i/batchSize) + 1}):
${batchVmDataJson}

DETAILED DISK DATA (Batch ${Math.floor(i/batchSize) + 1}):
${batchDiskDataJson}

CRITICAL INSTRUCTIONS:
1. Ensure your VM pricing is accurate and matches current Azure rates for the specified region
2. The GenAI VM Price should be close to the Migrate Price for the same SKU
3. Use precise calculations and current pricing data for all three pricing models
4. Consider the operating system type (Windows vs Linux) for licensing costs
5. Analyze disk IOPS and throughput requirements for optimal disk tier selection
6. Provide cost comparisons and recommend the best pricing option for each VM
7. Return only the markdown table, and nothing else
8. Be consistent and deterministic in your recommendations
${rulesAndConstraints ? `9. STRICTLY FOLLOW the custom rules and constraints provided above for ALL recommendations (compute, disk, storage, networking, etc.)
10. If any recommendation would violate the rules and constraints, you MUST choose an alternative that complies with the constraints
11. In your justification, explain how your recommendations comply with the specified rules and constraints
12. CRITICAL: For disk recommendations, if the original recommendation violates disk constraints, you MUST recommend an alternative disk type that complies with the constraints
13. CRITICAL: If Premium SSD V2 is mentioned in constraints as forbidden, NEVER recommend Premium SSD V2 disks
14. CRITICAL: If Premium SSD is mentioned in constraints as forbidden, NEVER recommend Premium SSD disks
15. CRITICAL: Always check disk constraints before making any disk type recommendations` : ''}`;

        // POST to Azure OpenAI API for this batch with deterministic settings
        console.log("🔍 [GenAI Debug] Making API call to Azure OpenAI...");
        console.log("🔍 [GenAI Debug] Prompt length:", prompt.length);
        console.log("🔍 [GenAI Debug] Environment check - Endpoint:", process.env.AZURE_OPENAI_ENDPOINT ? "Set" : "Not set");
        console.log("🔍 [GenAI Debug] Environment check - API Key:", process.env.AZURE_OPENAI_KEY ? "Set" : "Not set");
        console.log("🔍 [GenAI Debug] Environment check - Deployment:", process.env.AZURE_OPENAI_DEPLOYMENT || "Using default");
        console.log("🔍 [GenAI Debug] Rules and constraints:", rulesAndConstraints);
        console.log("🔍 [GenAI Debug] Formatted disk constraints:", formatDiskConstraints(rulesAndConstraints));
        
        const aiData = await retryWithBackoff(async () => {
          const aiRes = await fetch("/api/azure-openai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              prompt,
              options: {
                temperature: 0,
                seed: 42,
                maxTokens: 2048
              }
            }),
          });
          
          console.log("🔍 [GenAI Debug] API Response Status:", aiRes.status);
          console.log("🔍 [GenAI Debug] API Response OK:", aiRes.ok);
          
          if (!aiRes.ok) {
            const errorText = await aiRes.text();
            console.error("❌ [GenAI Debug] API Error Response:", errorText);
            console.error("❌ [GenAI Debug] Response Status:", aiRes.status);
            console.error("❌ [GenAI Debug] Response Headers:", Object.fromEntries(aiRes.headers.entries()));
            throw new Error(`Failed to get GenAI recommendations. Status: ${aiRes.status}, Response: ${errorText}`);
          }
          
          const data = await aiRes.json();
          console.log("✅ [GenAI Debug] API call successful");
          console.log("🔍 [GenAI Debug] AI Response length:", data.completion?.length || 0);
          return data;
        }, 3, 1000, 10000); // 3 retries, 1s base delay, 10s max delay
        
        lastAiData = aiData; // Store the last AI response for fallback
        
        // Parse GenAI output table for this batch
        const batchGenAITable = parsePipeTable(aiData.completion);
        
        // Validate that the AI response doesn't contain forbidden disk types
        if (rulesAndConstraints) {
          const forbiddenDiskTypes = [];
          if (rulesAndConstraints.toLowerCase().includes('premium v2') || rulesAndConstraints.toLowerCase().includes('premiumv2')) {
            forbiddenDiskTypes.push('Premium SSD V2', 'PremiumV2', 'Premium SSD v2');
          }
          if (rulesAndConstraints.toLowerCase().includes('premium') && !rulesAndConstraints.toLowerCase().includes('v2')) {
            forbiddenDiskTypes.push('Premium SSD', 'Premium');
          }
          
          // Check if any forbidden disk types are in the AI response
          const aiResponseText = aiData.completion.toLowerCase();
          const violations = forbiddenDiskTypes.filter(type => 
            aiResponseText.includes(type.toLowerCase())
          );
          
          if (violations.length > 0) {
            console.warn("⚠️ [GenAI Debug] AI response contains forbidden disk types:", violations);
            console.warn("⚠️ [GenAI Debug] This may indicate that disk constraints are not being followed properly");
          } else {
            console.log("✅ [GenAI Debug] AI response complies with disk constraints");
          }
        }
        
        allGenAIResults = allGenAIResults.concat(batchGenAITable);
      }
      
      // Process all results together
      let genAITable = allGenAIResults;
      // For each row, set pricing data from all three assessment reports
      for (let i = 0; i < genAITable.length; i++) {
        const row = genAITable[i];
        const vmName = row["VM Name"];
        
        // Find data from all three assessment reports
        const payAsYouGoVM = transformedPayAsYouGoMachines.find((m: any) => m.machine === vmName);
        const oneYearVM = transformedOneYearMachines.find((m: any) => m.machine === vmName);
        const threeYearVM = transformedThreeYearMachines.find((m: any) => m.machine === vmName);
        
        const region = payAsYouGoVM?.region || 'eastus';
        const osType = payAsYouGoVM?.operatingSystem?.toLowerCase().includes('windows') ? 'Windows' : 'Linux';
        
        // Set pricing from all three assessment reports
        const payAsYouGoPrice = (Number(payAsYouGoVM?.computeMonthlyCostEstimateUsd) || 0) + (Number(payAsYouGoVM?.storageMonthlyCostEstimateUsd) || 0);
        const oneYearPrice = (Number(oneYearVM?.computeMonthlyCostEstimateUsd) || 0) + (Number(oneYearVM?.storageMonthlyCostEstimateUsd) || 0);
        const threeYearPrice = (Number(threeYearVM?.computeMonthlyCostEstimateUsd) || 0) + (Number(threeYearVM?.storageMonthlyCostEstimateUsd) || 0);
        
        row["Pay-as-you-go (USD)"] = payAsYouGoPrice > 0 ? payAsYouGoPrice.toFixed(2) : 'N/A';
        row["1-Year RI (USD)"] = oneYearPrice > 0 ? oneYearPrice.toFixed(2) : 'N/A';
        row["3-Year RI (USD)"] = threeYearPrice > 0 ? threeYearPrice.toFixed(2) : 'N/A';
        
        // Calculate GenAI pricing (if available)
        const genAIPayAsYouGo = parseFloat(row["GenAI Pay-as-you-go (USD)"]) || 0;
        const genAIOneYear = parseFloat(row["GenAI 1-Year RI (USD)"]) || 0;
        const genAIThreeYear = parseFloat(row["GenAI 3-Year RI (USD)"]) || 0;
        
        // Determine best option based on pricing
        const prices = [genAIPayAsYouGo, genAIOneYear, genAIThreeYear].filter(p => p > 0);
        if (prices.length > 0) {
          const minPrice = Math.min(...prices);
          if (minPrice === genAIThreeYear) row["Best Option"] = '3-Year RI';
          else if (minPrice === genAIOneYear) row["Best Option"] = '1-Year RI';
          else row["Best Option"] = 'Pay-as-you-go';
        }
      }
      // Rebuild markdown table string for rendering
      if (genAITable.length > 0) {
        // Always show the new columns in the table
        let headers = Object.keys(genAITable[0]);
        // Ensure we have the total price column
        if (!headers.includes("GenAI Total Price (USD)")) {
          headers.push("GenAI Total Price (USD)");
        }
        // Remove any old price columns that might exist
        const oldPriceCols = [
          "GenAI Price (Pay-as-you-go)",
          "GenAI Price (1yr RI)",
          "GenAI Price (3yr RI)",
          "GenAI Price (AHB)",
          "GenAI Price (USD)",
          "GenAI Total Price (USD)",
          "GenAI VM Price (USD)",
          "GenAI Disk Price (USD)"
        ];
        headers = headers.filter(h => !oldPriceCols.includes(h));
        headers = headers.filter(h => h !== "DEBUG_SKU_REGION_OS");
        
        // Use the headers as they are, no need for reordering with new structure
        const reorderedHeaders = headers;
        
        const headerLine = '| ' + reorderedHeaders.join(' | ') + ' |';
        const sepLine = '| ' + reorderedHeaders.map(() => '---').join(' | ') + ' |';
        const rows = genAITable.map(row => '| ' + reorderedHeaders.map(h => String(row[h] ?? '')).join(' | ') + ' |');
        setGenAIOutput([headerLine, sepLine, ...rows].join('\n'));
      } else {
        setGenAIOutput(lastAiData?.completion || 'No GenAI recommendations generated.');
      }

      // Generate assessment report data
      const windowsServers = transformedPayAsYouGoMachines.filter((vm: any) => (vm.operatingSystem || '').toLowerCase().includes('windows')).length;
      const linuxServers = transformedPayAsYouGoMachines.filter((vm: any) => (vm.operatingSystem || '').toLowerCase().includes('linux')).length;
      const totalStorageTB = transformedPayAsYouGoMachines.reduce((sum: number, vm: any) => sum + (Number(vm.storageGb) || 0), 0) / 1024;
      const numDisksInScope = transformedPayAsYouGoDisks.length;
      // Calculate OS distribution for all servers from payAsYouGoMachines (All_Assessed_Machines)
      const osDistributionTable = Object.entries(
        payAsYouGoMachines.reduce((acc: Record<string, number>, vm: any) => {
          const os = vm["Operating system"] || vm.operatingSystem || 'Unknown';
          acc[os] = (acc[os] || 0) + 1;
          return acc;
        }, {})
      ).map(([os, count]) => ({ os, count: Number(count) }));
      const osDistributionTotal = payAsYouGoMachines.length;
      // Compute in-scope servers for the table (include all servers)
      const inScopeServers = payAsYouGoMachines.map((vm: any) => ({
        machine: vm["Machine"] || vm.machine || '',
        operatingSystem: vm["Operating system"] || vm.operatingSystem || '',
        cores: vm["Cores"] || vm.cores || '',
        memoryMb: vm["Memory(MB)"] || vm.memoryMb || '',
        storageGb: vm["Storage(GB)"] || vm.storageGb || ''
      }));
      // Compute cloudReadiness for the Cloud Readiness Analysis and Plan section
      const cloudReadiness = payAsYouGoMachines.map((vm: any) => ({
        machine: vm["Machine"] || vm.machine || '',
        operatingSystem: vm["Operating system"] || vm.operatingSystem || '',
        vmReadiness: vm["Azure VM readiness"] || vm.vmReadiness || '',
        azurePlan: "Rehost (Lift-n-Shift)",
      }));
      // Extract GenAI VM summary for template
      let genAiVmSummary: any[] = [];
      if (genAIOutput) {
        try {
          const parsedGenAiTable = parsePipeTable(genAIOutput);
          genAiVmSummary = parsedGenAiTable.map(row => ({
            vmName: row["VM Name"] || row["Server Name"] || '',
            cores: row["Cores"] || '',
            memoryMB: row["Memory (MB)"] || '',
            cpuUsage: row["CPU usage (%)"] || '',
            memoryUsage: row["Memory usage (%)"] || '',
            recommendedSize: row["GenAI Recommended SKU"] || row["Recommended size"] || '',
          }));
        } catch (err) {
          // If parsing fails, leave genAiVmSummary empty
        }
      }
      // Find the correct key for 'Memory usage (%)' in the sheet (case-insensitive, ignore whitespace and punctuation)
      const memoryUsageKey = Object.keys(payAsYouGoMachines[0] || {}).find(k => 
        k === 'Memory usage(%)' ||
        k.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().includes('memoryusage')
      ) || Object.keys(payAsYouGoMachines[0] || {}).find(k =>
        k.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().includes('memusage')
      ) || 'Memory usage(%)';
      // LOGGING: Print detected key and values for debugging
      console.log('Detected memoryUsageKey:', memoryUsageKey);
      payAsYouGoMachines.forEach((row: any, idx: number) => {
        console.log(`Row ${idx} memory usage:`, row[memoryUsageKey]);
      });
      // Calculate reserved instance data
      const payAsYouGoData = {
        machines: transformedPayAsYouGoMachines,
        disks: transformedPayAsYouGoDisks,
        totalMonthlyCost: transformedPayAsYouGoMachines.reduce((sum: number, vm: any) => 
          sum + (Number(vm.computeMonthlyCostEstimateUsd) || 0) + (Number(vm.storageMonthlyCostEstimateUsd) || 0), 0
        ),
        totalAnnualCost: 0,
        totalThreeYearCost: 0
      };
      payAsYouGoData.totalAnnualCost = payAsYouGoData.totalMonthlyCost * 12;
      payAsYouGoData.totalThreeYearCost = payAsYouGoData.totalMonthlyCost * 36;

      const oneYearReservedData = {
        machines: transformedOneYearMachines,
        disks: transformedOneYearDisks,
        totalMonthlyCost: transformedOneYearMachines.reduce((sum: number, vm: any) => 
          sum + (Number(vm.computeMonthlyCostEstimateUsd) || 0) + (Number(vm.storageMonthlyCostEstimateUsd) || 0), 0
        ),
        totalAnnualCost: 0,
        totalThreeYearCost: 0,
        savingsVsPayAsYouGo: 0,
        savingsPercentage: 0
      };
      oneYearReservedData.totalAnnualCost = oneYearReservedData.totalMonthlyCost * 12;
      oneYearReservedData.totalThreeYearCost = oneYearReservedData.totalMonthlyCost * 36;
      oneYearReservedData.savingsVsPayAsYouGo = payAsYouGoData.totalMonthlyCost - oneYearReservedData.totalMonthlyCost;
      oneYearReservedData.savingsPercentage = payAsYouGoData.totalMonthlyCost > 0 ? 
        (oneYearReservedData.savingsVsPayAsYouGo / payAsYouGoData.totalMonthlyCost) * 100 : 0;

      const threeYearReservedData = {
        machines: transformedThreeYearMachines,
        disks: transformedThreeYearDisks,
        totalMonthlyCost: transformedThreeYearMachines.reduce((sum: number, vm: any) => 
          sum + (Number(vm.computeMonthlyCostEstimateUsd) || 0) + (Number(vm.storageMonthlyCostEstimateUsd) || 0), 0
        ),
        totalAnnualCost: 0,
        totalThreeYearCost: 0,
        savingsVsPayAsYouGo: 0,
        savingsPercentage: 0
      };
      threeYearReservedData.totalAnnualCost = threeYearReservedData.totalMonthlyCost * 12;
      threeYearReservedData.totalThreeYearCost = threeYearReservedData.totalMonthlyCost * 36;
      threeYearReservedData.savingsVsPayAsYouGo = payAsYouGoData.totalMonthlyCost - threeYearReservedData.totalMonthlyCost;
      threeYearReservedData.savingsPercentage = payAsYouGoData.totalMonthlyCost > 0 ? 
        (threeYearReservedData.savingsVsPayAsYouGo / payAsYouGoData.totalMonthlyCost) * 100 : 0;

      const assessmentData: AssessmentReportData = {
        totalServers: transformedPayAsYouGoMachines.length,
        inScopeServersCount: transformedPayAsYouGoMachines.filter((vm: any) => vm.readiness === 'Ready for Azure').length,
        targetRegion: targetRegion, // Add the extracted region
        vmSummary: transformedPayAsYouGoMachines.map((vm: any, idx: number) => ({
          vmName: vm.machine || '',
          operatingSystem: vm.operatingSystem || '',
          cores: vm.cores || 0,
          memoryGB: vm.memoryMb ? Number(vm.memoryMb) / 1024 : 0,
          storageGB: vm.storageGb || 0,
          recommendedSize: vm.recommendedSize || '',
          computeMonthlyCostEstimateUsd: Number(vm.computeMonthlyCostEstimateUsd) || 0,
          storageMonthlyCostEstimateUsd: Number(vm.storageMonthlyCostEstimateUsd) || 0,
          readiness: vm.readiness || 'Unknown',
          inScope: vm.readiness === 'Ready for Azure',
          cpuUsage: payAsYouGoMachines[idx]["CPU usage(%)"] || payAsYouGoMachines[idx]["cpuUsage"] || '',
          memoryUsage: payAsYouGoMachines[idx][memoryUsageKey] || payAsYouGoMachines[idx]["memoryUsage"] || ''
        })),
        osDistribution: transformedPayAsYouGoMachines.reduce((acc: Record<string, number>, vm: any) => {
          const os = vm.operatingSystem || 'Unknown';
          acc[os] = (acc[os] || 0) + 1;
          return acc;
        }, {}),
        serverInfrastructure: `Assessment completed for ${transformedPayAsYouGoMachines.length} servers with varying specifications and readiness levels.`,
        readinessSummary: `Out of ${transformedPayAsYouGoMachines.length} servers, ${transformedPayAsYouGoMachines.filter((vm: any) => vm.readiness === 'Ready for Azure').length} are ready for Azure migration.`,
        costAnalysis: `Total estimated monthly cost for all servers: $${transformedPayAsYouGoMachines.reduce((sum: number, vm: any) => sum + (Number(vm.computeMonthlyCostEstimateUsd) || 0) + (Number(vm.storageMonthlyCostEstimateUsd) || 0), 0).toFixed(2)}`,
        recommendations: 'Based on the assessment, consider implementing a phased migration approach starting with the most ready workloads.',
        windowsServers,
        linuxServers,
        totalStorageTB: Number(totalStorageTB.toFixed(3)),
        numDisksInScope,
        osDistributionTable,
        osDistributionTotal,
        inScopeServers,
        allAssessedDisks: transformedPayAsYouGoDisks,
        cloudReadiness: cloudReadiness,
        genAiVmSummary,
        // Add rules and constraints for disk recommendations
        rulesAndConstraints,
        // Add reserved instance data
        payAsYouGoData,
        oneYearReservedData,
        threeYearReservedData
      };

      console.log('💿 [Frontend] Assessment data prepared:', {
        vmCount: assessmentData.vmSummary.length,
        diskCount: assessmentData.numDisksInScope,
        payAsYouGoDisks: assessmentData.payAsYouGoData?.disks?.length || 0,
        targetRegion: assessmentData.targetRegion
      });

      setReportData(assessmentData);
      setShowSuccessMessage(true);
      if (onComplete) onComplete(assessmentData);
      
      console.log("✅ [Form Submit] Assessment completed successfully. User can now download report and start new assessment when ready.");
    } catch (err: any) {
      console.error("❌ [Form Submit] Error occurred:", err);
      console.error("❌ [Form Submit] Error message:", err.message);
      console.error("❌ [Form Submit] Error stack:", err.stack);
      setError(err.message);
    }
    setIsSubmitting(false);
  };

  useEffect(() => {
    console.log("🚀 [Component Mount] AssessmentReportForm mounted.");
  }, []);

  useEffect(() => {
    console.log("🔄 [Form Reset] Form reset triggered.");
  }, []);



  return (
    <>
      <CardHeader className="text-center">
        <UploadCloud className="mx-auto h-12 w-12 text-blue-600" />
        <CardTitle className="text-3xl font-bold mt-2">Generate Assessment Report</CardTitle>
        <CardDescription>Upload your data for AI-powered VM sizing, costing, and landing zone design.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AssessmentFileUpload
                id="azure-report"
              label="Azure Migrate Assessment Report (Pay-as-you-go, Excel/CSV/JSON)"
              accept=".xlsx,.xls,.csv,.json"
              onChange={setAzureReport}
              value={azureReport}
              inputRef={azureReportRef}
            />
            <AssessmentFileUpload
              id="azure-report-1yr"
              label="Azure Migrate Assessment Report (1-Year Reserved Instance, Excel/CSV/JSON)"
              accept=".xlsx,.xls,.csv,.json"
              onChange={setAzureReport1Yr}
              value={azureReport1Yr}
              inputRef={azureReport1YrRef}
            />
            <AssessmentFileUpload
              id="azure-report-3yr"
              label="Azure Migrate Assessment Report (3-Year Reserved Instance, Excel/CSV/JSON)"
                accept=".xlsx,.xls,.csv,.json"
              onChange={setAzureReport3Yr}
              value={azureReport3Yr}
              inputRef={azureReport3YrRef}
            />
            <div>
              <Label htmlFor="notes-file" className="flex items-center gap-2 mb-2">
                <NotebookPen className="h-4 w-4" />
                User Notes (TXT/DOCX/PDF)
              </Label>
              <Input
                id="notes-file"
                type="file"
                accept=".txt,.docx,.pdf"
                onChange={(e) => setNotesFile(e.target.files ? e.target.files[0] : null)}
                ref={notesFileRef}
              />
              {notesFile && <p className="text-sm text-gray-500 mt-1">Selected: {notesFile.name}</p>}
            </div>
            <div>
              <Label htmlFor="meeting-transcript" className="flex items-center gap-2 mb-2">
                <MessageSquareText className="h-4 w-4" />
                Meeting Transcript (TXT/SRT)
              </Label>
              <Input
                id="meeting-transcript"
                type="file"
                accept=".txt,.srt"
                onChange={(e) => setMeetingTranscript(e.target.files ? e.target.files[0] : null)}
                ref={meetingTranscriptRef}
              />
              {meetingTranscript && <p className="text-sm text-gray-500 mt-1">Selected: {meetingTranscript.name}</p>}
            </div>
            <div>
              <Label htmlFor="template-file" className="flex items-center gap-2 mb-2">
                <FolderOpen className="h-4 w-4" />
                Company Template (DOCX/PDF)
              </Label>
              <Input
                id="template-file"
                type="file"
                accept=".docx,.pdf"
                onChange={(e) => setTemplateFile(e.target.files ? e.target.files[0] : null)}
                ref={templateFileRef}
              />
              {templateFile && <p className="text-sm text-gray-500 mt-1">Selected: {templateFile.name}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="other-details" className="mb-2 block">
              Additional Context / Specific Requirements
            </Label>
            <Textarea
              id="other-details"
              placeholder="e.g., 'Focus on cost optimization for SQL servers', 'Prioritize lift-and-shift for dev environments', 'Specific compliance requirements for healthcare data'..."
              value={otherDetails}
              onChange={(e) => setOtherDetails(e.target.value)}
              rows={5}
            />
          </div>

          <div>
            <Label htmlFor="rules-constraints" className="mb-2 block">
              Rules and Constraints
            </Label>
            <Textarea
              id="rules-constraints"
              placeholder="Examples:
• Don't select premium v2 disk and premium disk
• Avoid burstable instances (B-series)
• Use only Standard_D and Standard_E VM series
• Limit total cost to $200/month per VM
• Prefer Standard SSD over Premium SSD
• No Ultra Disk recommendations
• Use only specific regions (East US, West US 2)
• Avoid Windows licensing costs where possible

IMPORTANT: For disk constraints, be very specific:
• 'Don't select premium v2 disk and premium disk' - will prevent Premium SSD V2 and Premium SSD recommendations
• 'Only use Standard SSD' - will force Standard SSD recommendations
• 'No Ultra Disk' - will prevent Ultra Disk recommendations"
              value={rulesAndConstraints}
              onChange={(e) => setRulesAndConstraints(e.target.value)}
              rows={6}
            />
            <p className="text-sm text-gray-500 mt-1">
              These rules will be strictly applied to ALL recommendations (compute, disk, storage, networking, etc.)
            </p>
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
              {isSubmitting ? "Generating Report..." : "Generate Assessment Report"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleStartNewAssessment}
              disabled={isSubmitting || isResetting}
            >
              <RotateCcw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
              {isResetting ? 'Resetting...' : 'Start New Assessment'}
            </Button>
          </div>
          
          {/* Show Start New Assessment button prominently after successful assessment */}
          {showSuccessMessage && !isResetting && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-blue-800">Ready for Next Assessment?</h4>
                  <p className="text-sm text-blue-600 mt-1">
                    Download your report first, then click below to start a fresh assessment.
                  </p>
                </div>
                <Button 
                  type="button" 
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  onClick={handleStartNewAssessment}
                >
                  <RotateCcw className="h-4 w-4" />
                  Start New Assessment
                </Button>
              </div>
            </div>
          )}

          {reportData && (
            <div className="space-y-6">
              {/* Step 1: Report Download Section */}
              <Card className="border-green-200 bg-green-50/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm font-bold">
                      1
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        Download Assessment Report
                      </CardTitle>
                      <CardDescription>
                        First, download your complete assessment report as a Word document with all analysis and recommendations.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    type="button" 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={async () => {
                      try {
                        // Create FormData to send both report data and template file
                        const formData = new FormData();
                        formData.append('reportData', JSON.stringify(reportData));
                        
                        if (templateFile) {
                          formData.append('templateFile', templateFile);
                        }
                        
                        console.log('💿 [Frontend] Sending report generation request:', {
                          hasTemplate: !!templateFile,
                          reportDataKeys: Object.keys(reportData),
                          diskData: reportData.payAsYouGoData?.disks?.length || 0
                        });
                        
                        const response = await fetch('/api/generate-report', {
                          method: 'POST',
                          body: formData,
                        });
                        
                        if (!response.ok) throw new Error('Failed to generate report');
                        
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = 'assessment-report.docx';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                        
                        // Show success message
                        setShowSuccessMessage(true);
                      } catch (error) {
                        console.error('Error downloading report:', error);
                        alert('Failed to download report');
                      }
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Download Word Report
                  </Button>
                </CardContent>
              </Card>


            </div>
          )}
        </form>
        {error && <div className="text-red-600 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">{error}</div>}
        {showSuccessMessage && (
          <div className="text-green-600 mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            ✅ Assessment completed successfully! Please download your report. You can view architecture diagrams in the dashboard below.
            {isResetting && (
              <div className="mt-2 text-sm text-green-700">
                🔄 Resetting form...
              </div>
            )}
          </div>
        )}
        {recommendations && parsedInput && (
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-2">VM Recommendations</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Server Name</th>
                    <th className="border px-2 py-1">Migrate Recommended Size</th>
                    <th className="border px-2 py-1">Migrate Cores</th>
                    <th className="border px-2 py-1">Migrate Memory (GB)</th>
                    <th className="border px-2 py-1">Migrate Price/Month (from file)</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.map((rec, i) => {
                    const orig = parsedInput[i] || {};
                    const migratePrice = (Number(orig.computeMonthlyCostEstimateUsd) || 0) + (Number(orig.storageMonthlyCostEstimateUsd) || 0);
                    return (
                      <tr key={i}>
                        <td className="border px-2 py-1">{orig.machine || '-'}</td>
                        <td className="border px-2 py-1">{orig.recommendedSize || '-'}</td>
                        <td className="border px-2 py-1">{orig.cores || '-'}</td>
                        <td className="border px-2 py-1">{orig.memoryMb ? (Number(orig.memoryMb) / 1024).toFixed(1) : '-'}</td>
                        <td className="border px-2 py-1">{migratePrice > 0 ? migratePrice.toFixed(2) : '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {genAIOutput && (
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-2">GenAI Recommendations & Comparison</h3>
            {(() => {
              let genAITable: any[] = [];
              try {
                genAITable = parsePipeTable(genAIOutput);
              } catch (err) {
                return <div className="text-red-600">Error parsing GenAI output table.</div>;
              }
              if (!Array.isArray(genAITable) || genAITable.length === 0 || typeof genAITable[0] !== 'object') {
                return <div className="text-red-600">No valid GenAI recommendations table to display.</div>;
              }
              const headers = Object.keys(genAITable[0]);
              return (
                <div className="overflow-x-auto">
                  <table className="min-w-full border text-sm">
                    <thead>
                      <tr>
                        {headers.map(header => (
                          <th key={header} className="border px-2 py-1 bg-gray-100">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {genAITable.map((row, i) => (
                        <tr key={i}>
                          {headers.map((header, j) => (
                            <td key={j} className="border px-2 py-1">{String(row[header] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}
      </CardContent>
    </>
  )
} 