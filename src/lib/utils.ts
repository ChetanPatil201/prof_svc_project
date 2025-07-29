import { AssessmentReportData, CostComparisonTableData, CostComparisonTableRow } from '@/types/assessmentReport';

export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function generateCostComparisonTable(data: AssessmentReportData): CostComparisonTableData {
  // Calculate totals from the assessment data
  const payAsYouGoCompute = data.vmSummary.reduce((sum, vm) => 
    sum + (Number(vm.computeMonthlyCostEstimateUsd) || 0), 0
  );
  const payAsYouGoStorage = data.vmSummary.reduce((sum, vm) => 
    sum + (Number(vm.storageMonthlyCostEstimateUsd) || 0), 0
  );
  const payAsYouGoTotal = payAsYouGoCompute + payAsYouGoStorage;

  // Calculate 1-Year Reserved Instance costs (if data available)
  let oneYearCompute = 0;
  let oneYearStorage = 0;
  let oneYearTotal = 0;
  
  if (data.oneYearReservedData?.machines) {
    oneYearCompute = data.oneYearReservedData.machines.reduce((sum, vm) => 
      sum + (Number(vm.computeMonthlyCostEstimateUsd) || 0), 0
    );
    oneYearStorage = data.oneYearReservedData.machines.reduce((sum, vm) => 
      sum + (Number(vm.storageMonthlyCostEstimateUsd) || 0), 0
    );
    oneYearTotal = oneYearCompute + oneYearStorage;
  }

  // Calculate 3-Year Reserved Instance costs (if data available)
  let threeYearCompute = 0;
  let threeYearStorage = 0;
  let threeYearTotal = 0;
  
  if (data.threeYearReservedData?.machines) {
    threeYearCompute = data.threeYearReservedData.machines.reduce((sum, vm) => 
      sum + (Number(vm.computeMonthlyCostEstimateUsd) || 0), 0
    );
    threeYearStorage = data.threeYearReservedData.machines.reduce((sum, vm) => 
      sum + (Number(vm.storageMonthlyCostEstimateUsd) || 0), 0
    );
    threeYearTotal = threeYearCompute + threeYearStorage;
  }

  // Create table rows
  const rows: CostComparisonTableRow[] = [
    {
      pricingPlan: 'Pay-as-you-go (PAYG)',
      configMatch: 'On-demand',
      compute: payAsYouGoCompute,
      storage: payAsYouGoStorage,
      total: payAsYouGoTotal
    }
  ];

  // Add 1-Year Reserved Instance row if data exists
  if (oneYearTotal > 0) {
    rows.push({
      pricingPlan: '1 Year Reserved Instance',
      configMatch: '1-year commitment',
      compute: oneYearCompute,
      storage: oneYearStorage,
      total: oneYearTotal
    });
  }

  // Add 3-Year Reserved Instance row if data exists
  if (threeYearTotal > 0) {
    rows.push({
      pricingPlan: '3 Year Reserved Instance',
      configMatch: '3-year commitment',
      compute: threeYearCompute,
      storage: threeYearStorage,
      total: threeYearTotal
    });
  }

  // Determine best pricing option
  const validTotals = rows.filter(row => row.total > 0).map(row => row.total);
  const minTotal = Math.min(...validTotals);
  const bestRow = rows.find(row => row.total === minTotal);
  const bestPricingOption = bestRow?.pricingPlan || 'Pay-as-you-go (PAYG)';

  // Calculate savings percentage
  const costSavingsPercentage = payAsYouGoTotal > 0 && minTotal < payAsYouGoTotal 
    ? ((payAsYouGoTotal - minTotal) / payAsYouGoTotal) * 100 
    : 0;

  // Generate recommendation summary
  let recommendationSummary = '';
  if (costSavingsPercentage > 0) {
    recommendationSummary = `Consider ${bestPricingOption} for potential savings of ${costSavingsPercentage.toFixed(1)}% compared to Pay-as-you-go pricing.`;
  } else {
    recommendationSummary = 'Pay-as-you-go pricing appears to be the most cost-effective option for your current workload.';
  }

  return {
    rows,
    summary: {
      totalMonthlyCost: payAsYouGoTotal,
      bestPricingOption,
      costSavingsPercentage,
      recommendationSummary
    }
  };
}




export function generateCostComparisonTableData(tableData: CostComparisonTableData) {
  const { rows, summary } = tableData;
  
  // Return structured data for Word document table generation
  return {
    tableRows: rows.map(row => ({
      pricingPlan: row.pricingPlan,
      configMatch: row.configMatch || '',
      compute: `$${row.compute.toFixed(2)}`,
      storage: `$${row.storage.toFixed(2)}`,
      total: `$${row.total.toFixed(2)}`
    })),
    summary: {
      totalCost: `$${summary.totalMonthlyCost.toFixed(2)}`,
      recommendedOption: summary.bestPricingOption,
      potentialSavings: `${summary.costSavingsPercentage.toFixed(1)}%`,
      recommendation: summary.recommendationSummary
    }
  };
}

export interface ComputeBreakdownRow {
  vmName: string;
  cores: number;
  memoryMB: number;
  recommendedSize: string;
  computeCost: number;
  reasoning: string;
}

export interface ComputeBreakdownData {
  title: string;
  description: string;
  rows: ComputeBreakdownRow[];
  vms: Array<{
    name: string;
    cores: string;
    memory: string;
    size: string;
    cost: string;
    reason: string;
  }>;
  totalComputeCost: number;
  summary: string;
}

export function generateComputeBreakdownData(assessmentData: AssessmentReportData): ComputeBreakdownData {
  const { vmSummary, genAiVmSummary } = assessmentData;
  
  // Extract data from GenAI recommendations
  const rows: ComputeBreakdownRow[] = [];
  let totalComputeCost = 0;
  
  // Always use all VMs from the assessment, but enhance with GenAI data if available
  vmSummary.forEach((vm, index) => {
    const genAiVm = genAiVmSummary && genAiVmSummary[index];
    
    // Use GenAI recommended size if available, otherwise use assessment recommended size
    const recommendedSize = genAiVm?.recommendedSize || vm.recommendedSize || 'N/A';
    const computeCost = vm.computeMonthlyCostEstimateUsd;
    
    totalComputeCost += computeCost;
    
    rows.push({
      vmName: vm.vmName,
      cores: vm.cores,
      memoryMB: vm.memoryGB * 1024,
      recommendedSize: recommendedSize,
      computeCost: computeCost,
      reasoning: generateSKUReasoning(recommendedSize, String(vm.cores), String(vm.memoryGB * 1024))
    });
  });
  
  // Get region from assessment data or use default
  const region = assessmentData.targetRegion || 'eastus';
  const regionDisplayName = getRegionDisplayName(region);
  
  // Create the vms array for Docxtemplater loop
  const vms = rows.map(row => ({
    name: row.vmName,
    cores: String(row.cores),
    memory: String(row.memoryMB),
    size: row.recommendedSize,
    cost: `$${row.computeCost.toFixed(2)}`,
    reason: row.reasoning
  }));

  return {
    title: `Breakdown of On-demand Performance Based compute pricing for ${regionDisplayName}`,
    description: "This section describes our recommendations based on AI analysis for VM SKU selection and associated costs. The recommendations are optimized for performance and cost efficiency.",
    rows: rows,
    vms: vms,
    totalComputeCost: totalComputeCost,
    summary: `Total compute cost for all ${rows.length} virtual machines: $${totalComputeCost.toFixed(2)} per month.`
  };
}

export interface DiskBreakdownRow {
  machine: string;
  diskName: string;
  recommendedDiskSizeSku: string;
  recommendedDiskType: string;
  sourceDiskSizeGb: number;
  targetDiskSizeGb: number;
  monthlyCostEstimate: number;
}

export interface DiskBreakdownData {
  title: string;
  description: string;
  rows: DiskBreakdownRow[];
  disks: Array<{
    machine: string;
    diskName: string;
    recommendedDiskSizeSku: string;
    recommendedDiskType: string;
    sourceDiskSizeGb: string;
    targetDiskSizeGb: string;
    monthlyCostEstimate: string;
  }>;
  totalStorageCost: number;
  summary: string;
}

export function generateDiskBreakdownData(assessmentData: AssessmentReportData): DiskBreakdownData {
  console.log('💿 [Disk Breakdown] Starting disk breakdown generation');
  
  const { payAsYouGoData } = assessmentData;
  const rows: DiskBreakdownRow[] = [];
  let totalStorageCost = 0;

  // Use PAYG disk data as the primary source
  if (payAsYouGoData?.disks) {
    console.log('✅ [Disk Breakdown] Found PAYG disk data, count:', payAsYouGoData.disks.length);
    
    payAsYouGoData.disks.forEach((disk, index) => {
      const monthlyCost = Number(disk.monthlyCostEstimate) || 0;
      totalStorageCost += monthlyCost;

      rows.push({
        machine: disk.machine,
        diskName: disk.diskName,
        recommendedDiskSizeSku: disk.recommendedDiskSizeSku,
        recommendedDiskType: disk.recommendedDiskType,
        sourceDiskSizeGb: disk.sourceDiskSizeGb,
        targetDiskSizeGb: disk.targetDiskSizeGb,
        monthlyCostEstimate: monthlyCost
      });
    });
  } else {
    console.log('⚠️ [Disk Breakdown] No PAYG disk data found');
  }

  const region = assessmentData.targetRegion || 'eastus';
  const regionDisplayName = getRegionDisplayName(region);
  
  const disks = rows.map(row => ({
    machine: row.machine,
    diskName: row.diskName,
    recommendedDiskSizeSku: row.recommendedDiskSizeSku,
    recommendedDiskType: row.recommendedDiskType,
    sourceDiskSizeGb: `${row.sourceDiskSizeGb} GB`,
    targetDiskSizeGb: `${row.targetDiskSizeGb} GB`,
    monthlyCostEstimate: `$${(Number(row.monthlyCostEstimate) || 0).toFixed(2)}`
  }));

  console.log('💿 [Disk Breakdown] Generated disk data:', {
    diskCount: disks.length,
    totalCost: totalStorageCost,
    title: `2.4.3 Disk Recommendations for Right-Sized`
  });

  const result = {
    title: `2.4.3 Disk Recommendations for Right-Sized`,
    description: `Based on the recommended size of disks for the right sized virtual machines, the overall monthly cost estimate will be $${totalStorageCost.toFixed(2)}.`,
    rows: rows,
    disks: disks,
    totalStorageCost: totalStorageCost,
    summary: `Total storage cost for all ${rows.length} disks: $${totalStorageCost.toFixed(2)} per month.`
  };

  return result;
}

function getRegionDisplayName(region: string): string {
  const regionMap: Record<string, string> = {
    'eastus': 'East US',
    'eastus2': 'East US 2',
    'westus': 'West US',
    'westus2': 'West US 2',
    'westus3': 'West US 3',
    'centralus': 'Central US',
    'northcentralus': 'North Central US',
    'southcentralus': 'South Central US',
    'westcentralus': 'West Central US',
    'northeurope': 'North Europe',
    'westeurope': 'West Europe',
    'eastasia': 'East Asia',
    'southeastasia': 'Southeast Asia',
    'japaneast': 'Japan East',
    'japanwest': 'Japan West',
    'australiaeast': 'Australia East',
    'australiasoutheast': 'Australia Southeast',
    'brazilsouth': 'Brazil South',
    'canadacentral': 'Canada Central',
    'canadaeast': 'Canada East',
    'uksouth': 'UK South',
    'ukwest': 'UK West',
    'francecentral': 'France Central',
    'francesouth': 'France South',
    'germanywestcentral': 'Germany West Central',
    'germanynorth': 'Germany North',
    'switzerlandnorth': 'Switzerland North',
    'switzerlandwest': 'Switzerland West',
    'norwayeast': 'Norway East',
    'norwaywest': 'Norway West',
    'swedencentral': 'Sweden Central',
    'swedensouth': 'Sweden South',
    'italynorth': 'Italy North',
    'polandcentral': 'Poland Central',
    'southafricanorth': 'South Africa North',
    'southafricawest': 'South Africa West',
    'uaenorth': 'UAE North',
    'uaecentral': 'UAE Central',
    'koreacentral': 'Korea Central',
    'koreasouth': 'Korea South',
    'indiawest': 'India West',
    'indiasouth': 'India South',
    'indiacentral': 'India Central',
    'indiawest2': 'India West 2',
    'indiasouth2': 'India South 2',
    'indianorth': 'India North',
    'indiaeast': 'India East',
    'chinanorth': 'China North',
    'chinaeast': 'China East',
    'chinanorth2': 'China North 2',
    'chinaeast2': 'China East 2',
    'chinanorth3': 'China North 3',
    'chinaeast3': 'China East 3'
  };
  
  return regionMap[region.toLowerCase()] || region;
}

function generateSKUReasoning(sku: string, cores: number | string, memoryMB: number | string): string {
  const coresNum = typeof cores === 'string' ? parseFloat(cores) || 0 : cores;
  const memoryMBNum = typeof memoryMB === 'string' ? parseFloat(memoryMB) || 0 : memoryMB;
  const memoryGB = memoryMBNum / 1024;
  
  if (sku.includes('Standard_D2as_v5')) {
    return `Standard_D2as_v5 (2 vCPUs, 8 GB RAM) - General Purpose VM with balanced CPU-to-memory ratio, suitable for small to medium business workloads.`;
  } else if (sku.includes('Standard_D4as_v5')) {
    return `Standard_D4as_v5 (4 vCPUs, 16 GB RAM) - General Purpose VM with balanced CPU-to-memory ratio, suitable for small to medium business workloads and lightly loaded databases.`;
  } else if (sku.includes('Standard_F4s_v2')) {
    return `Standard_F4s_v2 (4 vCPUs, 8 GB RAM) - Compute optimized VM designed for compute-intensive workloads with high CPU requirements.`;
  } else if (sku.includes('Standard_D8as_v5')) {
    return `Standard_D8as_v5 (8 vCPUs, 32 GB RAM) - General Purpose VM for medium to large workloads requiring more resources.`;
  } else if (sku.includes('Standard_E4as_v5')) {
    return `Standard_E4as_v5 (4 vCPUs, 32 GB RAM) - Memory optimized VM for applications requiring high memory-to-CPU ratio.`;
  } else if (sku.includes('Standard_B2s')) {
    return `Standard_B2s (2 vCPUs, 4 GB RAM) - Burstable VM suitable for development and testing workloads with variable performance requirements.`;
  } else {
    return `${sku} - Recommended based on workload analysis: ${cores} cores and ${memoryGB.toFixed(1)} GB RAM requirements.`;
  }
} 