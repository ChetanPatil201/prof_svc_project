import * as XLSX from "xlsx";
import Papa from "papaparse";
import type { ParseResult } from "papaparse";
import { 
  FullAssessmentReportData, 
  AssessmentReportComparison, 
  CostComparisonItem, 
  AssessmentReportSummary,
  AssessedMachine,
  AssessedDisk,
  AssessmentProperty
} from "@/types/assessmentReport";

// Parse Excel/CSV/JSON files to extract assessment data
export async function parseAssessmentFile(file: File): Promise<FullAssessmentReportData> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  let sheets: Record<string, any[]> = {};

  if (ext === "xlsx" || ext === "xls") {
    const data = await file.arrayBuffer();
    const uint8 = new Uint8Array(data);
    const workbook = XLSX.read(uint8, { type: "array" });
    
    for (const name of workbook.SheetNames) {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
      sheets[name] = rows;
    }
  } else if (ext === "csv") {
    const text = await file.text();
    const rows = text.split('\n').map(line => line.split(','));
    sheets['All_Assessed_Machines'] = rows;
  } else if (ext === "json") {
    const text = await file.text();
    sheets = JSON.parse(text);
  } else {
    throw new Error("Unsupported file type. Please upload .xlsx, .csv, or .json.");
  }

  return buildAssessmentReportData(sheets);
}

// Build assessment report data from parsed sheets
function buildAssessmentReportData(sheets: Record<string, any[]>): FullAssessmentReportData {
  const assessedMachines = (sheets.All_Assessed_Machines || []).map((row): AssessedMachine => ({
    machine: row["Machine"] || row["machine"] || "",
    vmHost: row["VM host"] || row["vmHost"] || "",
    azureVmReadiness: row["Azure VM readiness"] || row["azureVmReadiness"] || "",
    azureReadinessIssues: row["Azure readiness issues"] || row["azureReadinessIssues"] || "",
    dataCollectionIssues: row["Data collection issues"] || row["dataCollectionIssues"] || "",
    recommendedSize: row["Recommended size"] || row["recommendedSize"] || "",
    computeMonthlyCostEstimateUsd: Number(row["Compute monthly cost estimate USD"]) || 0,
    storageMonthlyCostEstimateUsd: Number(row["Storage monthly cost estimate USD"]) || 0,
    estimatedMonthlySavingsHybridBenefitWindows: Number(row["Estimated monthly savings from Azure Hybrid Benefit for Windows OS USD"]) || 0,
    estimatedMonthlySavingsHybridBenefitLinux: Number(row["Estimated monthly savings from Azure Hybrid Benefit for Linux OS USD"]) || 0,
    securityReadiness: row["Security readiness"] || row["securityReadiness"] || "",
    securityMonthlyCostEstimateUsd: Number(row["Security monthly cost estimate USD"]) || 0,
    operatingSystem: row["Operating system"] || row["operatingSystem"] || "",
    bootType: row["Boot type"] || row["bootType"] || "",
    processor: row["Processor"] || row["processor"] || "",
    cores: Number(row["Cores"]) || 0,
    memoryMb: Number(row["Memory(MB)"]) || 0,
    cpuUsagePercent: Number(row["CPU usage(%)"]) || 0,
    memoryUsagePercent: Number(row["Memory usage(%)"]) || 0,
    storageGb: Number(row["Storage(GB)"]) || 0,
    standardHddDisks: Number(row["Standard HDD disks"]) || 0,
    standardSsdDisks: Number(row["Standard SSD disks"]) || 0,
    premiumDisks: Number(row["Premium disks"]) || 0,
    premiumSsdV2Disks: Number(row["Premium SSD V2 disks"]) || 0,
    ultraDisks: Number(row["Ultra disks"]) || 0,
    diskReadOpsSec: Number(row["Disk read(ops/sec)"]) || 0,
    diskWriteOpsSec: Number(row["Disk write(ops/sec)"]) || 0,
    diskReadMbps: Number(row["Disk read(MBPS)"]) || 0,
    diskWriteMbps: Number(row["Disk write(MBPS)"]) || 0,
    confidenceRatingPercent: Number(row["Confidence Rating (% of utilization data collected)"]) || 0,
    networkAdapters: row["Network adapters"] || row["networkAdapters"] || "",
    ipAddress: row["IP address"] || row["ipAddress"] || "",
    macAddress: row["MAC address"] || row["macAddress"] || "",
    networkInMbps: Number(row["Network in(MBPS)"]) || 0,
    networkOutMbps: Number(row["Network out(MBPS)"]) || 0,
    groupName: row["Group name"] || row["groupName"] || "",
  }));

  const assessedDisks = (sheets.All_Assessed_Disks || []).map((row): AssessedDisk => ({
    machine: row["Machine"] || row["machine"] || "",
    diskName: row["Disk name"] || row["diskName"] || "",
    azureDiskReadiness: row["Azure disk readiness"] || row["azureDiskReadiness"] || "",
    recommendedDiskSizeSku: row["Recommended disk size SKU"] || row["recommendedDiskSizeSku"] || "",
    recommendedDiskType: row["Recommended disk type"] || row["recommendedDiskType"] || "",
    azureReadinessIssues: row["Azure readiness issues"] || row["azureReadinessIssues"] || "",
    migrationGuidance: row["Migration Guidance"] || row["migrationGuidance"] || "",
    dataCollectionIssues: row["Data collection issues"] || row["dataCollectionIssues"] || "",
    monthlyCostEstimate: Number(row["Monthly cost estimate"]) || 0,
    sourceDiskSizeGb: Number(row["Source disk size(GB)"]) || 0,
    targetDiskSizeGb: Number(row["Target disk size(GB)"]) || 0,
    diskReadMbps: Number(row["Disk read(MBPS)"]) || 0,
    diskWriteMbps: Number(row["Disk write(MBPS)"]) || 0,
    diskReadOpsSec: Number(row["Disk read(ops/sec)"]) || 0,
    diskWriteOpsSec: Number(row["Disk write(ops/sec)"]) || 0,
    ultraDiskProvisionedIops: Number(row["Ultra disk provisioned IOPS (Operations/Sec)"]) || 0,
    ultraDiskProvisionedThroughputMbps: Number(row["Ultra disk provisioned throughput (MBPS)"]) || 0,
    premiumSsdV2DiskProvisionedIops: Number(row["Premium SSD V2 disk provisioned IOPS (Operations/Sec)"]) || 0,
    premiumSsdV2DiskProvisionedThroughputMbps: Number(row["Premium SSD V2 disk provisioned throughput (MBPS)"]) || 0,
  }));

  const assessmentProperties = (sheets.Assessment_Properties || []).map((row): AssessmentProperty => ({
    property: row["Property"] || row["property"] || "",
    selectedValue: row["Selected value"] || row["selectedValue"] || "",
  }));

  return {
    assessedMachines,
    assessedDisks,
    assessmentProperties,
  };
}

// Process multiple assessment reports and generate comparison data
export async function processMultipleAssessmentReports(
  payAsYouGoFile: File | null,
  reservedInstance1YrFile: File | null,
  reservedInstance3YrFile: File | null
): Promise<AssessmentReportComparison> {
  const comparison: AssessmentReportComparison = {
    payAsYouGo: null,
    reservedInstance1Yr: null,
    reservedInstance3Yr: null,
  };

  try {
    if (payAsYouGoFile) {
      comparison.payAsYouGo = await parseAssessmentFile(payAsYouGoFile);
    }
    if (reservedInstance1YrFile) {
      comparison.reservedInstance1Yr = await parseAssessmentFile(reservedInstance1YrFile);
    }
    if (reservedInstance3YrFile) {
      comparison.reservedInstance3Yr = await parseAssessmentFile(reservedInstance3YrFile);
    }
  } catch (error) {
    console.error("Error processing assessment files:", error);
    throw error;
  }

  return comparison;
}

// Generate cost comparison data from multiple assessment reports
export function generateCostComparison(comparison: AssessmentReportComparison): CostComparisonItem[] {
  const costComparison: CostComparisonItem[] = [];
  
  if (!comparison.payAsYouGo) {
    return costComparison;
  }

  // Use Pay-as-you-go as the base for machine names
  const payAsYouGoMachines = comparison.payAsYouGo.assessedMachines;
  
  payAsYouGoMachines.forEach(payAsYouGoMachine => {
    const machineName = payAsYouGoMachine.machine;
    const payAsYouGoCost = payAsYouGoMachine.computeMonthlyCostEstimateUsd + payAsYouGoMachine.storageMonthlyCostEstimateUsd;
    
    // Find corresponding machines in 1-year and 3-year reports
    const reservedInstance1YrMachine = comparison.reservedInstance1Yr?.assessedMachines.find(
      m => m.machine === machineName
    );
    const reservedInstance3YrMachine = comparison.reservedInstance3Yr?.assessedMachines.find(
      m => m.machine === machineName
    );

    const reservedInstance1YrCost = reservedInstance1YrMachine 
      ? reservedInstance1YrMachine.computeMonthlyCostEstimateUsd + reservedInstance1YrMachine.storageMonthlyCostEstimateUsd
      : payAsYouGoCost;
    
    const reservedInstance3YrCost = reservedInstance3YrMachine
      ? reservedInstance3YrMachine.computeMonthlyCostEstimateUsd + reservedInstance3YrMachine.storageMonthlyCostEstimateUsd
      : payAsYouGoCost;

    const savings1Yr = payAsYouGoCost - reservedInstance1YrCost;
    const savings3Yr = payAsYouGoCost - reservedInstance3YrCost;

    // Determine recommended option based on savings
    let recommendedOption: 'pay-as-you-go' | '1-year-ri' | '3-year-ri' = 'pay-as-you-go';
    if (savings3Yr > savings1Yr && savings3Yr > 0) {
      recommendedOption = '3-year-ri';
    } else if (savings1Yr > 0) {
      recommendedOption = '1-year-ri';
    }

    costComparison.push({
      machine: machineName,
      payAsYouGoCost,
      reservedInstance1YrCost,
      reservedInstance3YrCost,
      savings1Yr,
      savings3Yr,
      recommendedOption,
    });
  });

  return costComparison;
}

// Generate assessment summary from cost comparison data
export function generateAssessmentSummary(costComparison: CostComparisonItem[]): AssessmentReportSummary {
  const totalMachines = costComparison.length;
  
  const totalCosts = costComparison.reduce(
    (acc, machine) => ({
      payAsYouGo: acc.payAsYouGo + machine.payAsYouGoCost,
      reservedInstance1Yr: acc.reservedInstance1Yr + machine.reservedInstance1YrCost,
      reservedInstance3Yr: acc.reservedInstance3Yr + machine.reservedInstance3YrCost,
    }),
    { payAsYouGo: 0, reservedInstance1Yr: 0, reservedInstance3Yr: 0 }
  );

  const totalSavings = {
    reservedInstance1Yr: totalCosts.payAsYouGo - totalCosts.reservedInstance1Yr,
    reservedInstance3Yr: totalCosts.payAsYouGo - totalCosts.reservedInstance3Yr,
  };

  const recommendations = {
    machinesFor1YrRI: costComparison
      .filter(machine => machine.recommendedOption === '1-year-ri')
      .map(machine => machine.machine),
    machinesFor3YrRI: costComparison
      .filter(machine => machine.recommendedOption === '3-year-ri')
      .map(machine => machine.machine),
    machinesForPayAsYouGo: costComparison
      .filter(machine => machine.recommendedOption === 'pay-as-you-go')
      .map(machine => machine.machine),
  };

  return {
    totalMachines,
    totalCosts,
    totalSavings,
    recommendations,
  };
} 

// Calculate total costs for template table
export function calculateTemplateCosts(comparison: AssessmentReportComparison) {
  const calculateTotalCosts = (report: FullAssessmentReportData | null) => {
    if (!report) return { compute: 0, storage: 0, total: 0 };
    
    const computeTotal = report.assessedMachines.reduce(
      (sum, machine) => sum + machine.computeMonthlyCostEstimateUsd, 
      0
    );
    
    const storageTotal = report.assessedDisks.reduce(
      (sum, disk) => sum + disk.monthlyCostEstimate, 
      0
    );
    
    return {
      compute: computeTotal,
      storage: storageTotal,
      total: computeTotal + storageTotal
    };
  };

  const payAsYouGoCosts = calculateTotalCosts(comparison.payAsYouGo);
  const reservedInstance1YrCosts = calculateTotalCosts(comparison.reservedInstance1Yr);
  const reservedInstance3YrCosts = calculateTotalCosts(comparison.reservedInstance3Yr);

  return {
    payCompute: payAsYouGoCosts.compute.toFixed(2),
    payStorage: payAsYouGoCosts.storage.toFixed(2),
    payTotal: payAsYouGoCosts.total.toFixed(2),
    reservedInstance1YrCompute: reservedInstance1YrCosts.compute.toFixed(2),
    reservedInstance1YrStorage: reservedInstance1YrCosts.storage.toFixed(2),
    reservedInstance1YrTotal: reservedInstance1YrCosts.total.toFixed(2),
    reservedInstance3YrCompute: reservedInstance3YrCosts.compute.toFixed(2),
    reservedInstance3YrStorage: reservedInstance3YrCosts.storage.toFixed(2),
    reservedInstance3YrTotal: reservedInstance3YrCosts.total.toFixed(2),
  };
} 