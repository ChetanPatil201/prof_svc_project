import { AssessmentReportData, CostComparisonTableData, CostComparisonTableRow } from '@/types/assessmentReport';

export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

// Helper function to ensure consistent disk constraint application
export async function getConstrainedDiskData(data: AssessmentReportData): Promise<any[]> {
  if (!data.rulesAndConstraints || !data.payAsYouGoData?.disks || !data.targetRegion) {
    return data.payAsYouGoData?.disks || [];
  }
  
  console.log("🔄 [Disk Consistency] Applying constraints to all disk data");
  console.log(`🔄 [Disk Consistency] Processing ${data.payAsYouGoData.disks.length} disks with constraints: ${data.rulesAndConstraints}`);
  
  const constrainedDisks = [];
  let constraintChanges = 0;
  
  for (const disk of data.payAsYouGoData.disks) {
    const originalType = disk.recommendedDiskType;
    const constrainedDisk = await applyDiskConstraints(disk, data.rulesAndConstraints, data.targetRegion);
    
    if (constrainedDisk.recommendedDiskType !== originalType) {
      constraintChanges++;
      console.log(`🔄 [Disk Consistency] Constraint applied to ${disk.diskName}: ${originalType} → ${constrainedDisk.recommendedDiskType}`);
    }
    
    constrainedDisks.push(constrainedDisk);
  }
  
  console.log(`✅ [Disk Consistency] Applied constraints to ${constraintChanges} out of ${data.payAsYouGoData.disks.length} disks`);
  
  return constrainedDisks;
}

export async function generateCostComparisonTable(data: AssessmentReportData): Promise<CostComparisonTableData> {
  // Get accurate pricing from compute and disk breakdowns if constraints are applied
  let payAsYouGoCompute = 0;
  let payAsYouGoStorage = 0;
  
  if (data.rulesAndConstraints) {
    // Use accurate pricing from compute breakdown
    const computeBreakdown = await generateComputeBreakdownData(data);
    payAsYouGoCompute = computeBreakdown.totalComputeCost;
    
    // Use accurate pricing from disk breakdown
    const diskBreakdown = await generateDiskBreakdownData(data);
    payAsYouGoStorage = diskBreakdown.totalStorageCost;
    
    // Apply constraints to original disk data to ensure consistency
    if (data.payAsYouGoData?.disks && data.targetRegion) {
      console.log("🔄 [Cost Comparison] Applying disk constraints to original data for consistency");
      for (let i = 0; i < data.payAsYouGoData.disks.length; i++) {
        data.payAsYouGoData.disks[i] = await applyDiskConstraints(
          data.payAsYouGoData.disks[i], 
          data.rulesAndConstraints, 
          data.targetRegion
        );
      }
    }
  } else {
    // Use original assessment data
    payAsYouGoCompute = data.vmSummary.reduce((sum, vm) => 
      sum + (Number(vm.computeMonthlyCostEstimateUsd) || 0), 0
    );
    payAsYouGoStorage = data.vmSummary.reduce((sum, vm) => 
      sum + (Number(vm.storageMonthlyCostEstimateUsd) || 0), 0
    );
  }
  
  const payAsYouGoTotal = payAsYouGoCompute + payAsYouGoStorage;

  // Calculate 1-Year Reserved Instance costs (compute only - storage remains the same)
  let oneYearCompute = 0;
  let oneYearTotal = 0;
  
  if (data.oneYearReservedData?.machines) {
    oneYearCompute = data.oneYearReservedData.machines.reduce((sum, vm) => 
      sum + (Number(vm.computeMonthlyCostEstimateUsd) || 0), 0
    );
    // Storage cost remains the same as PAYG since reservations don't apply to storage
    oneYearTotal = oneYearCompute + payAsYouGoStorage;
  }

  // Calculate 3-Year Reserved Instance costs (compute only - storage remains the same)
  let threeYearCompute = 0;
  let threeYearTotal = 0;
  
  if (data.threeYearReservedData?.machines) {
    threeYearCompute = data.threeYearReservedData.machines.reduce((sum, vm) => 
      sum + (Number(vm.computeMonthlyCostEstimateUsd) || 0), 0
    );
    // Storage cost remains the same as PAYG since reservations don't apply to storage
    threeYearTotal = threeYearCompute + payAsYouGoStorage;
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
      storage: payAsYouGoStorage, // Same storage cost as PAYG
      total: oneYearTotal
    });
  }

  // Add 3-Year Reserved Instance row if data exists
  if (threeYearTotal > 0) {
    rows.push({
      pricingPlan: '3 Year Reserved Instance',
      configMatch: '3-year commitment',
      compute: threeYearCompute,
      storage: payAsYouGoStorage, // Same storage cost as PAYG
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

  // Add constraint note if applicable
  if (data.rulesAndConstraints) {
    recommendationSummary += ' Note: Pricing reflects applied constraints and accurate Azure pricing.';
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

// Function to fetch accurate VM pricing from Azure Retail Prices API
async function fetchVmPricing(sku: string, region: string, osType: string = 'Linux'): Promise<number | null> {
  try {
    // Clean up SKU name
    let cleanSku = sku;
    if (!cleanSku.startsWith('Standard_')) {
      cleanSku = `Standard_${cleanSku}`;
    }
    
    // Build API filter
    let filter = `serviceName eq 'Virtual Machines' and serviceFamily eq 'Compute' and armRegionName eq '${region}' and armSkuName eq '${cleanSku}'`;
    
    // Add OS filter
    if (osType.toLowerCase().includes('windows')) {
      filter += " and contains(productName, 'Windows')";
    } else {
      filter += " and not contains(productName, 'Windows')";
    }
    
    const apiUrl = `https://prices.azure.com/api/retail/prices?$filter=${encodeURIComponent(filter)}&$top=1`;
    
    console.log(`🔍 [VM Pricing] Fetching pricing for ${cleanSku} in ${region} (${osType})`);
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.Items && data.Items.length > 0) {
      const pricePerHour = data.Items[0].unitPrice || 0;
      const monthlyCost = pricePerHour * 730; // 730 hours per month
      console.log(`✅ [VM Pricing] Found price for ${cleanSku}: $${monthlyCost.toFixed(2)}/month`);
      return monthlyCost;
    }
    
    console.log(`⚠️ [VM Pricing] No pricing found for ${cleanSku} in ${region}`);
    return null;
  } catch (error) {
    console.error(`❌ [VM Pricing] Error fetching pricing for ${sku}:`, error);
    return null;
  }
}

export async function generateComputeBreakdownData(assessmentData: AssessmentReportData): Promise<ComputeBreakdownData> {
  const { vmSummary, genAiVmSummary, rulesAndConstraints, targetRegion } = assessmentData;
  
  // Extract data from GenAI recommendations
  const rows: ComputeBreakdownRow[] = [];
  let totalComputeCost = 0;
  
  // Always use all VMs from the assessment, but enhance with GenAI data if available
  for (let i = 0; i < vmSummary.length; i++) {
    const vm = vmSummary[i];
    const genAiVm = genAiVmSummary && genAiVmSummary[i];
    
    // Use GenAI recommended size if available, otherwise use assessment recommended size
    const recommendedSize = genAiVm?.recommendedSize || vm.recommendedSize || 'N/A';
    let computeCost = vm.computeMonthlyCostEstimateUsd;
    
    // If we have GenAI recommendations and constraints, fetch accurate pricing
    if (genAiVm?.recommendedSize && rulesAndConstraints && targetRegion) {
      console.log(`🔍 [Compute Breakdown] Fetching accurate pricing for ${vm.vmName} (${genAiVm.recommendedSize})`);
      const accuratePricing = await fetchVmPricing(genAiVm.recommendedSize, targetRegion, vm.operatingSystem);
      if (accuratePricing) {
        computeCost = accuratePricing;
        console.log(`✅ [Compute Breakdown] Updated pricing for ${vm.vmName}: $${computeCost.toFixed(2)}/month`);
      }
    }
    
    totalComputeCost += computeCost;
    
    rows.push({
      vmName: vm.vmName,
      cores: vm.cores,
      memoryMB: vm.memoryGB * 1024,
      recommendedSize: recommendedSize,
      computeCost: computeCost,
      reasoning: generateSKUReasoning(recommendedSize, String(vm.cores), String(vm.memoryGB * 1024))
    });
  }
  
  // Get region from assessment data or use default
  const region = targetRegion || 'eastus';
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

// Function to fetch accurate disk pricing from Azure Retail Prices API
async function fetchDiskPricing(diskSizeGB: number, diskType: string, region: string): Promise<number | null> {
  try {
    // Try different filter combinations to find the right pricing
    const filters = [
      `serviceName eq 'Storage' and serviceFamily eq 'Storage' and armRegionName eq '${region}' and contains(productName, '${diskType}') and contains(skuName, '${diskSizeGB}')`,
      `serviceName eq 'Storage' and serviceFamily eq 'Storage' and armRegionName eq '${region}' and contains(productName, '${diskType}')`,
      `serviceName eq 'Storage' and serviceFamily eq 'Storage' and armRegionName eq '${region}' and contains(skuName, '${diskType}')`
    ];
    
    for (const filter of filters) {
      const apiUrl = `https://prices.azure.com/api/retail/prices?$filter=${encodeURIComponent(filter)}&$top=10`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        continue;
      }
      
      const data = await response.json();
      
      if (data.Items && data.Items.length > 0) {
        // Find the best match for our disk size
        const bestMatch = data.Items.find((item: any) => {
          const itemSku = item.skuName?.toLowerCase() || '';
          const itemProduct = item.productName?.toLowerCase() || '';
          
          // Look for size indicators in SKU or product name
          const sizeMatch = itemSku.includes(String(diskSizeGB)) || 
                           itemProduct.includes(String(diskSizeGB)) ||
                           itemSku.includes('p' + diskSizeGB) ||
                           itemSku.includes('e' + diskSizeGB);
          
          return sizeMatch && item.unitPrice !== undefined;
        });
        
        if (bestMatch) {
          let monthlyCost = 0;
          
          // Handle different units of measure
          if (bestMatch.unitOfMeasure?.toLowerCase() === 'gb') {
            monthlyCost = bestMatch.unitPrice * diskSizeGB;
          } else if (bestMatch.unitOfMeasure?.toLowerCase() === 'hour') {
            monthlyCost = bestMatch.unitPrice * 730; // 730 hours per month
          } else if (bestMatch.unitOfMeasure?.toLowerCase() === 'month') {
            monthlyCost = bestMatch.unitPrice;
          } else {
            // Default to hourly pricing
            monthlyCost = bestMatch.unitPrice * 730;
          }
          
          // Sanity check for reasonable pricing
          const maxReasonableCost = diskSizeGB * 2; // $2 per GB as sanity check
          if (monthlyCost > maxReasonableCost) {
            console.warn(`⚠️ [Disk Pricing] Unusually high cost detected: $${monthlyCost.toFixed(2)} for ${diskSizeGB}GB ${diskType}`);
            return getFallbackDiskPricing(diskSizeGB, diskType);
          }
          
          return monthlyCost;
        }
      }
    }
    
    console.log(`⚠️ [Disk Pricing] No pricing found for ${diskType} ${diskSizeGB}GB in ${region}, using fallback`);
    return getFallbackDiskPricing(diskSizeGB, diskType);
    
  } catch (error) {
    console.error(`❌ [Disk Pricing] Error fetching pricing for ${diskType} ${diskSizeGB}GB:`, error);
    return getFallbackDiskPricing(diskSizeGB, diskType);
  }
}

// Function to get reasonable fallback pricing for disk types
function getFallbackDiskPricing(diskSizeGB: number, diskType: string): number {
  // Fallback pricing rates per GB per month
  const fallbackRates = {
    'Premium SSD': 0.12,
    'Premium SSD V2': 0.15,
    'Standard SSD': 0.08,
    'Standard HDD': 0.04,
    'Ultra Disk': 0.20
  };
  
  const rate = fallbackRates[diskType as keyof typeof fallbackRates] || 0.08;
  const cost = diskSizeGB * rate;
  
  return cost;
}

// Function to map SKU to disk type
function mapSkuToDiskType(sku: string, diskType: string): string {
  const skuLower = sku.toLowerCase();
  const diskTypeLower = diskType.toLowerCase();
  
  // If disk type is already clear, use it
  if (diskTypeLower.includes('premium ssd v2') || diskTypeLower.includes('premium v2')) {
    return 'Premium SSD V2';
  }
  if (diskTypeLower.includes('premium ssd') || diskTypeLower.includes('premium managed') || diskTypeLower.includes('premium disk')) {
    return 'Premium SSD';
  }
  if (diskTypeLower.includes('standard ssd') || diskTypeLower.includes('standard managed')) {
    return 'Standard SSD';
  }
  if (diskTypeLower.includes('standard hdd') || diskTypeLower.includes('standard disk')) {
    return 'Standard HDD';
  }
  if (diskTypeLower.includes('ultra')) {
    return 'Ultra Disk';
  }
  
  // Map SKU patterns to disk types
  if (skuLower.includes('premium_p') || skuLower.includes('premiump')) {
    return 'Premium SSD';
  }
  if (skuLower.includes('premium_') || skuLower.includes('premium')) {
    return 'Premium SSD';
  }
  if (skuLower.includes('standardssd_') || skuLower.includes('standardssd')) {
    return 'Standard SSD';
  }
  if (skuLower.includes('standard_') || skuLower.includes('standard')) {
    return 'Standard SSD';
  }
  if (skuLower.includes('ultra')) {
    return 'Ultra Disk';
  }
  
  // Default fallback
  return diskType;
}

// Function to test constraint detection
function testConstraintDetection(diskType: string, constraints: string): boolean {
  const diskTypeLower = diskType.toLowerCase();
  const constraintsLower = constraints.toLowerCase();
  
  // Split constraints by common separators
  const constraintParts = constraintsLower
    .split(/[,;]/) // Split by comma or semicolon
    .map(part => part.trim())
    .filter(part => part.length > 0);
  
  // Test Premium V2 detection
  const isPremiumV2 = diskTypeLower.includes('premium ssd v2') || 
                      diskTypeLower.includes('premium v2') ||
                      diskTypeLower.includes('premiumssd v2') ||
                      diskTypeLower.includes('premiumssdv2');
  
  // Check for Premium V2 constraints across all parts
  const hasPremiumV2Constraint = constraintParts.some(part => [
    'premium v2', 'premiumv2', 'dont select premium v2', 'no premium v2',
    'avoid premium v2', 'exclude premium v2', 'premium ssd v2'
  ].some(pattern => part.includes(pattern)));
  
  // Test Premium detection (excluding V2)
  const isPremium = (diskTypeLower.includes('premium ssd') || 
                    diskTypeLower.includes('premium') ||
                    diskTypeLower.includes('premium managed') ||
                    diskTypeLower.includes('premium disk')) &&
                   !diskTypeLower.includes('v2');
  
  // Check for Premium constraint across all parts
  const hasPremiumConstraint = constraintParts.some(part => [
    'dont select premium', 'no premium', 'avoid premium', 'exclude premium',
    'premium disk', 'premium ssd', 'dont select premium disk', 'no premium disk'
  ].some(pattern => part.includes(pattern)));
  
  // Special handling for "dont select premium v2 disk and premium disk"
  const hasCombinedConstraint = constraintParts.some(part => 
    part.includes('dont select premium v2 disk and premium disk') ||
    part.includes('dont select premium disk and premium v2 disk')
  );
  
  // Special handling for "dont select any type of premium disk" and "dont select any premium disk"
  const hasAnyPremiumConstraint = constraintParts.some(part => 
    part.includes('dont select any type of premium disk') ||
    part.includes('no any type of premium disk') ||
    part.includes('avoid any type of premium disk') ||
    part.includes('dont select any premium disk') ||
    part.includes('no any premium disk') ||
    part.includes('avoid any premium disk')
  );
  
  // Return true if we should apply any constraint
  return (isPremiumV2 && (hasPremiumV2Constraint || hasAnyPremiumConstraint)) || 
         (isPremium && (hasPremiumConstraint || hasCombinedConstraint || hasAnyPremiumConstraint)) ||
         (isPremium && hasCombinedConstraint);
}

// Function to apply disk constraints based on rules and constraints
async function applyDiskConstraints(disk: any, rulesAndConstraints: string, region: string = 'eastus'): Promise<any> {
  if (!rulesAndConstraints || !disk.recommendedDiskType) {
    return disk;
  }

  const constraints = rulesAndConstraints.toLowerCase();
  const originalDiskType = disk.recommendedDiskType.toLowerCase();
  const originalSku = disk.recommendedDiskSizeSku || '';
  const diskSizeGB = disk.targetDiskSizeGb || disk.sourceDiskSizeGb || 128;
  
  // Map SKU to disk type for better detection
  const mappedDiskType = mapSkuToDiskType(originalSku, originalDiskType);
  const mappedDiskTypeLower = mappedDiskType.toLowerCase();
  
  // Split constraints by common separators
  const constraintParts = constraints
    .split(/[,;]/) // Split by comma or semicolon
    .map(part => part.trim())
    .filter(part => part.length > 0);
  
  // Test constraint detection with mapped disk type
  const shouldApplyConstraint = testConstraintDetection(mappedDiskTypeLower, constraints);
  
  // Check for Premium V2 constraints - multiple patterns
  const premiumV2Patterns = [
    'premium v2', 'premiumv2', 'dont select premium v2', 'no premium v2',
    'avoid premium v2', 'exclude premium v2', 'premium ssd v2'
  ];
  
  // Check if this is a Premium V2 disk
  const isPremiumV2 = mappedDiskTypeLower.includes('premium ssd v2') || 
                      mappedDiskTypeLower.includes('premium v2') ||
                      mappedDiskTypeLower.includes('premiumssd v2') ||
                      mappedDiskTypeLower.includes('premiumssdv2');
  
  // Check for "any type of premium disk" constraint across all parts
  const hasAnyPremiumConstraint = constraintParts.some(part => 
    part.includes('dont select any type of premium disk') ||
    part.includes('no any type of premium disk') ||
    part.includes('avoid any type of premium disk') ||
    part.includes('dont select any premium disk') ||
    part.includes('no any premium disk') ||
    part.includes('avoid any premium disk')
  );
  
  // Check for Premium V2 constraint across all parts
  const hasPremiumV2Constraint = constraintParts.some(part => 
    premiumV2Patterns.some(pattern => part.includes(pattern))
  );
  
  // Check if this is a Premium disk (but not V2) - more comprehensive check
  const isPremium = (mappedDiskTypeLower.includes('premium ssd') || 
                    mappedDiskTypeLower.includes('premium') ||
                    mappedDiskTypeLower.includes('premium managed') ||
                    mappedDiskTypeLower.includes('premium disk') ||
                    originalDiskType.includes('premium managed') ||
                    originalDiskType.includes('premium disk')) &&
                   !mappedDiskTypeLower.includes('v2') &&
                   !originalDiskType.includes('v2');
  
  // Check for combined constraint "dont select premium v2 disk and premium disk"
  const hasCombinedConstraint = constraintParts.some(part => 
    part.includes('dont select premium v2 disk and premium disk') ||
    part.includes('dont select premium disk and premium v2 disk')
  );
  
  if ((hasPremiumV2Constraint || hasAnyPremiumConstraint) && isPremiumV2) {
    console.log(`🔄 [Disk Constraints] Filtering out Premium SSD V2 disk: ${disk.diskName}`);
    
    // Fetch accurate pricing for Standard SSD
    const newDiskCost = await fetchDiskPricing(diskSizeGB, 'Standard SSD', region);
    
    return {
      ...disk,
      recommendedDiskType: 'Standard SSD',
      recommendedDiskSizeSku: originalSku.replace(/premium/gi, 'Standard').replace(/v2/gi, ''),
      monthlyCostEstimate: newDiskCost || getFallbackDiskPricing(diskSizeGB, 'Standard SSD')
    };
  }
  
  // Check for Premium constraints (excluding V2) - multiple patterns
  const premiumPatterns = [
    'dont select premium', 'no premium', 'avoid premium', 'exclude premium',
    'premium disk', 'premium ssd', 'dont select premium disk', 'no premium disk'
  ];
  
  // Check for Premium constraint across all parts
  const hasPremiumConstraint = constraintParts.some(part => 
    premiumPatterns.some(pattern => part.includes(pattern))
  );
  
  // Debug logging for constraint detection
  if (isPremium || isPremiumV2) {
    console.log(`🔍 [Disk Debug] ${disk.diskName}: Type="${originalDiskType}", Mapped="${mappedDiskTypeLower}"`);
    console.log(`🔍 [Disk Debug] IsPremium=${isPremium}, IsPremiumV2=${isPremiumV2}`);
    console.log(`🔍 [Disk Debug] HasPremiumConstraint=${hasPremiumConstraint}, HasPremiumV2Constraint=${hasPremiumV2Constraint}, HasAnyPremiumConstraint=${hasAnyPremiumConstraint}`);
  }
  
  if ((hasPremiumConstraint || hasCombinedConstraint || hasAnyPremiumConstraint) && isPremium) {
    console.log(`🔄 [Disk Constraints] Filtering out Premium SSD disk: ${disk.diskName}`);
    
    // Fetch accurate pricing for Standard SSD
    const newDiskCost = await fetchDiskPricing(diskSizeGB, 'Standard SSD', region);
    
    return {
      ...disk,
      recommendedDiskType: 'Standard SSD',
      recommendedDiskSizeSku: originalSku.replace(/premium/gi, 'Standard'),
      monthlyCostEstimate: newDiskCost || getFallbackDiskPricing(diskSizeGB, 'Standard SSD')
    };
  }
  
  // Check for Ultra Disk constraints - multiple patterns
  const ultraPatterns = [
    'ultra', 'no ultra', 'avoid ultra', 'exclude ultra', 'ultra disk'
  ];
  
  // Check if this is an Ultra disk
  const isUltra = mappedDiskTypeLower.includes('ultra');
  
  // Check for Ultra constraint across all parts
  const hasUltraConstraint = constraintParts.some(part => 
    ultraPatterns.some(pattern => part.includes(pattern))
  );
  
  if (hasUltraConstraint && isUltra) {
    console.log(`🔄 [Disk Constraints] Filtering out Ultra Disk: ${disk.diskName}`);
    
    // Fetch accurate pricing for Premium SSD
    const newDiskCost = await fetchDiskPricing(diskSizeGB, 'Premium SSD', region);
    
    return {
      ...disk,
      recommendedDiskType: 'Premium SSD',
      recommendedDiskSizeSku: originalSku.replace(/ultra/gi, 'Premium'),
      monthlyCostEstimate: newDiskCost || getFallbackDiskPricing(diskSizeGB, 'Premium SSD')
    };
  }
  
  return disk;
}

export async function generateDiskBreakdownData(assessmentData: AssessmentReportData): Promise<DiskBreakdownData> {
  const { payAsYouGoData, rulesAndConstraints, targetRegion } = assessmentData;
  
  if (!payAsYouGoData?.disks || payAsYouGoData.disks.length === 0) {
    return {
      title: '2.4.3 Disk Recommendations for Right-Sized',
      description: 'No disk data available for analysis.',
      rows: [],
      disks: [],
      totalStorageCost: 0,
      summary: 'No disks found in the assessment data.'
    };
  }

  const rows: DiskBreakdownRow[] = [];
  let totalStorageCost = 0;
  let constraintChanges = 0;

  // Process each disk with constraints if provided
  for (let i = 0; i < payAsYouGoData.disks.length; i++) {
    const disk = payAsYouGoData.disks[i];
    let constrainedDisk = disk;
    
    // Apply constraints if provided
    if (rulesAndConstraints && targetRegion) {
      constrainedDisk = await applyDiskConstraints(disk, rulesAndConstraints, targetRegion);
      
      // Check if constraint was applied
      if (constrainedDisk.recommendedDiskType !== disk.recommendedDiskType) {
        constraintChanges++;
        console.log(`🔄 [Disk Breakdown] Constraint applied: ${disk.recommendedDiskType} → ${constrainedDisk.recommendedDiskType}`);
      }
    }

    // Ensure monthlyCostEstimate is a number
    const monthlyCost = Number(constrainedDisk.monthlyCostEstimate) || 0;
    totalStorageCost += monthlyCost;

    rows.push({
      machine: constrainedDisk.machine,
      diskName: constrainedDisk.diskName,
      recommendedDiskSizeSku: constrainedDisk.recommendedDiskSizeSku,
      recommendedDiskType: constrainedDisk.recommendedDiskType,
      sourceDiskSizeGb: constrainedDisk.sourceDiskSizeGb,
      targetDiskSizeGb: constrainedDisk.targetDiskSizeGb,
      monthlyCostEstimate: monthlyCost
    });
  }

  // Create the disks array for Docxtemplater loop
  const disks = rows.map(row => ({
    machine: row.machine,
    diskName: row.diskName,
    recommendedDiskSizeSku: row.recommendedDiskSizeSku,
    recommendedDiskType: row.recommendedDiskType,
    sourceDiskSizeGb: String(row.sourceDiskSizeGb),
    targetDiskSizeGb: String(row.targetDiskSizeGb),
    monthlyCostEstimate: `$${row.monthlyCostEstimate.toFixed(2)}`
  }));

  return {
    title: '2.4.3 Disk Recommendations for Right-Sized',
    description: 'This section provides disk recommendations based on the assessment data and any applied constraints.',
    rows: rows,
    disks: disks,
    totalStorageCost: totalStorageCost,
    summary: `Total storage cost for all ${rows.length} disks: $${totalStorageCost.toFixed(2)} per month.`
  };
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

// Retry utility for API calls
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
      const totalDelay = delay + jitter;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }
  
  throw lastError!;
} 

 