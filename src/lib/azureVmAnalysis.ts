import { retryWithBackoff } from './utils';

// Sample Azure Migrate report input (for testing)
export const sampleMigrateReport = [
  {
    vmName: "vm1",
    cores: 4,
    memoryGB: 16,
    region: "eastus",
    osType: "Windows",
  },
  {
    vmName: "vm2",
    cores: 2,
    memoryGB: 8,
    region: "westus",
    osType: "Linux",
  },
];

export interface VMWorkload {
  vmName: string;
  cores: number;
  memoryGB: number;
  region: string;
  osType: string;
}

export interface VMRecommendation {
  vmName: string;
  recommendedSize: string;
  pricePerMonthUSD: number;
  details: any;
}

// Azure Migrate Sheet Interfaces
export interface AssessmentSummaryRow {
  azureMigrate: string;
}

export interface AssessedMachineRow {
  machine: string;
  vmHost: string;
  azureVmReadiness: string;
  azureReadinessIssues: string;
  dataCollectionIssues: string;
  recommendedSize: string;
  computeMonthlyCostEstimateUsd: number;
  storageMonthlyCostEstimateUsd: number;
  estimatedMonthlySavingsFromAzureHybridBenefitForWindowsOsUsd: number;
  estimatedMonthlySavingsFromAzureHybridBenefitForLinuxOsUsd: number;
  securityReadiness: string;
  securityMonthlyCostEstimateUsd: number;
  operatingSystem: string;
  bootType: string;
  processor: string;
  cores: number;
  memoryMb: number;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  storageGb: number;
  standardHddDisks: number;
  standardSsdDisks: number;
  premiumDisks: number;
  premiumSsdV2Disks: number;
  ultraDisks: number;
  diskReadOpsSec: number;
  diskWriteOpsSec: number;
  diskReadMbps: number;
  diskWriteMbps: number;
  confidenceRatingPercent: number;
  networkAdapters: string;
  ipAddress: string;
  macAddress: string;
  networkInMbps: number;
  networkOutMbps: number;
  groupName: string;
}

export interface AssessedDiskRow {
  machine: string;
  diskName: string;
  azureDiskReadiness: string;
  recommendedDiskSizeSku: string;
  recommendedDiskType: string;
  azureReadinessIssues: string;
  migrationGuidance: string;
  dataCollectionIssues: string;
  monthlyCostEstimate: number;
  sourceDiskSizeGb: number;
  targetDiskSizeGb: number;
  diskReadMbps: number;
  diskWriteMbps: number;
  diskReadOpsSec: number;
  diskWriteOpsSec: number;
  ultraDiskProvisionedIops: number;
  ultraDiskProvisionedThroughputMbps: number;
  premiumSsdV2DiskProvisionedIops: number;
  premiumSsdV2DiskProvisionedThroughputMbps: number;
}

export interface AzureCalculatorRow {
  machines: string;
  payg: number;
  oneYear: number;
  threeYear: number;
}

export interface AssessmentPropertyRow {
  property: string;
  selectedValue: string;
}

// Parse the Azure Migrate report (JSON for now)
export function parseMigrateReport(input: any): VMWorkload[] {
  // In real use, add validation and support for CSV/Excel
  return Array.isArray(input) ? input : [];
}

// Cache for Azure pricing data to reduce API calls
const pricingCache = new Map<string, any>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Fetch Azure VM pricing from Azure Retail Prices API
export async function fetchAzureVmPricing(region: string, osType: string): Promise<any[]> {
  const cacheKey = `${region}-${osType}`;
  const cached = pricingCache.get(cacheKey);
  
  // Check if we have valid cached data
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`📦 [Azure Pricing] Using cached data for ${region} ${osType}`);
    return cached.data;
  }
  
  console.log(`🔍 [Azure Pricing] Fetching fresh data for ${region} ${osType}`);
  
  const apiUrl =
    "https://prices.azure.com/api/retail/prices?api-version=2023-01-01-preview";
  // Build OData filter for all price types
  let filter = `serviceName eq 'Virtual Machines' and serviceFamily eq 'Compute' and armRegionName eq '${region}'`;
  if (osType === "Windows") {
    filter += " and contains(productName, 'Windows')";
  } else if (osType === "Linux") {
    filter += " and not contains(productName, 'Windows')";
  }
  filter += " and isPrimaryMeterRegion eq true";

  let results: any[] = [];
  let nextPage = `${apiUrl}&$filter=${encodeURIComponent(filter)}`;
  let pageCount = 0;
  
  while (nextPage) {
    pageCount++;
    
    try {
      const pageData = await retryWithBackoff(async () => {
        const res = await fetch(nextPage);
        
        if (!res.ok) {
          const errorText = await res.text();
          if (res.status === 429) {
            console.log(`⏳ [Azure Pricing] Rate limited, waiting 60 seconds...`);
            await delay(60000); // Wait 60 seconds for rate limit
            throw new Error(`Rate limited, retrying...`);
          }
          throw new Error(`Failed to fetch Azure pricing: ${res.status} - ${errorText}`);
        }
        
        const data = await res.json();
        return data;
      }, 3, 1000, 10000); // 3 retries, 1s base delay, 10s max delay
      
      if (pageData.Items) {
        results.push(
          ...pageData.Items.map((item: any) => ({
            sku: item.armSkuName,
            skuName: item.skuName,
            productName: item.productName,
            cores: extractCores(item.skuName),
            memoryGB: extractMemory(item.skuName),
            priceType: item.priceType || 'Consumption', // Default to Consumption if undefined
            term: item.term || '', // 1 Year, 3 Years, or empty
            retailPrice: item.retailPrice,
            pricePerMonthUSD: item.retailPrice * 730, // 730 hours/month
            unitOfMeasure: item.unitOfMeasure,
            osType: osType,
            isAhb: item.skuName?.toLowerCase().includes('ahb') || false,
          }))
        );
      }
      nextPage = pageData.NextPageLink;
    } catch (error) {
      console.error("❌ [Azure Pricing] Error fetching page", pageCount, ":", error);
      throw error;
    }
  }
  
  // If no results, retry without the OS filter
  if (results.length === 0 && (osType === "Windows" || osType === "Linux")) {
    console.log("🔍 [Azure Pricing] No results with OS filter, trying without OS filter...");
    let fallbackFilter = `serviceName eq 'Virtual Machines' and serviceFamily eq 'Compute' and armRegionName eq '${region}' and isPrimaryMeterRegion eq true`;
    let fallbackResults: any[] = [];
    let fallbackNextPage = `${apiUrl}&$filter=${encodeURIComponent(fallbackFilter)}`;
    while (fallbackNextPage) {
      const res = await fetch(fallbackNextPage);
      if (!res.ok) throw new Error(`Failed to fetch Azure pricing: ${res.status}`);
      const data = await res.json();
      if (data.Items) {
        fallbackResults.push(
          ...data.Items.map((item: any) => ({
            sku: item.armSkuName,
            skuName: item.skuName,
            productName: item.productName,
            cores: extractCores(item.skuName),
            memoryGB: extractMemory(item.skuName),
            priceType: item.priceType || 'Consumption', // Default to Consumption if undefined
            term: item.term || '',
            retailPrice: item.retailPrice,
            pricePerMonthUSD: item.retailPrice * 730,
            unitOfMeasure: item.unitOfMeasure,
            osType: osType,
            isAhb: item.skuName?.toLowerCase().includes('ahb') || false,
          }))
        );
      }
      fallbackNextPage = data.NextPageLink;
    }
    results = fallbackResults.filter((sku) => sku.cores); // Only filter by cores, not memory
  }
  
  // Group by SKU and return all price types for each SKU
  const grouped: Record<string, any> = {};
  
  // Only filter by cores, not memory (since memoryGB can be null)
  for (const item of results.filter((sku) => sku.cores)) {
    if (!grouped[item.sku]) grouped[item.sku] = { sku: item.sku, skuName: item.skuName, osType: item.osType };
    if (item.priceType === 'Consumption') {
      if (item.isAhb) {
        grouped[item.sku].paygAhb = item.pricePerMonthUSD;
      } else {
        grouped[item.sku].payg = item.pricePerMonthUSD;
      }
    } else if (item.priceType === 'Reservation') {
      if (item.term === '1 Year') {
        if (item.isAhb) {
          grouped[item.sku].ri1yAhb = item.pricePerMonthUSD;
        } else {
          grouped[item.sku].ri1y = item.pricePerMonthUSD;
        }
      } else if (item.term === '3 Years') {
        if (item.isAhb) {
          grouped[item.sku].ri3yAhb = item.pricePerMonthUSD;
        } else {
          grouped[item.sku].ri3y = item.pricePerMonthUSD;
        }
      }
    }
  }
  
  const finalResults = Object.values(grouped);
  console.log("🔍 [Azure Pricing] Fetched", finalResults.length, "prices for", region, osType);
  
  // Cache the results
  pricingCache.set(cacheKey, {
    data: finalResults,
    timestamp: Date.now()
  });
  
  return finalResults;
}

// Fetch price for a specific SKU, region, priceType, and term (optional)
export async function fetchAzureVmPriceDirect({
  sku,
  region,
  osType,
  priceType = 'Consumption',
  term = '', // '1 Year', '3 Years', or ''
}: {
  sku: string;
  region: string;
  osType: string;
  priceType?: 'Consumption' | 'Reservation';
  term?: string;
}): Promise<number | null> {
  // Always use full SKU name (e.g., 'Standard_D2as_v5')
  let baseSku = sku.startsWith('Standard_') ? sku : `Standard_${sku}`;
  // Try v5, v4, v3, v2, v1 fallback
  const versionMatch = baseSku.match(/^(Standard_[A-Za-z]+_D?\d+[a-z]*_v)(\d+)$/i);
  let versionsToTry = [baseSku];
  if (versionMatch) {
    const prefix = versionMatch[1];
    const version = parseInt(versionMatch[2], 10);
    for (let v = version - 1; v >= 1; v--) {
      versionsToTry.push(`${prefix}${v}`);
    }
  }
  for (const trySku of versionsToTry) {
    let filter = `serviceName eq 'Virtual Machines' and armSkuName eq '${trySku}' and armRegionName eq '${region}' and priceType eq '${priceType}'`;
    if (priceType === 'Reservation' && term) {
      filter += ` and term eq '${term}'`;
    }
    const apiUrl = `https://prices.azure.com/api/retail/prices?$filter=${encodeURIComponent(filter)}&$top=1`;
    try {
      const data = await retryWithBackoff(async () => {
        const res = await fetch(apiUrl);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return await res.json();
      }, 2, 300, 3000); // 2 retries, 300ms base delay, 3s max delay
      
      if (data.Items && data.Items.length > 0) {
        const pricePerHour = data.Items[0].unitPrice ?? 0;
        const hoursPerMonth = 730;
        const monthlyCost = Math.round(pricePerHour * hoursPerMonth * 100) / 100;
        return monthlyCost;
      }
    } catch (err) {
      // Continue to next version
    }
  }
  return null;
}

// Helper: Extract cores from SKU name (e.g., "D4s v3" => 4)
function extractCores(skuName: string): number | null {
  if (!skuName) return null;
  
  // Handle modern SKU formats like Standard_D2as_v5, Standard_D2s_v3, etc.
  const modernMatch = skuName.match(/Standard_[A-Za-z]*(\d+)[a-z]*_v\d+/i);
  if (modernMatch) {
    return parseInt(modernMatch[1], 10);
  }
  
  // Handle older formats
  const legacyMatch = skuName.match(/([0-9]+)[^0-9]*v?\d*/i);
  if (legacyMatch) {
    return parseInt(legacyMatch[1], 10);
  }
  
  // Handle formats like "D2", "D4", etc.
  const simpleMatch = skuName.match(/[A-Za-z]*(\d+)/i);
  if (simpleMatch) {
    return parseInt(simpleMatch[1], 10);
  }
  
  return null;
}

// Helper: Extract memory from SKU name (not available in name, so returns null)
function extractMemory(skuName: string): number | null {
  // Real implementation would map SKU to memory size using a lookup table
  // For now, we'll return null and handle this in the recommendation logic
  return null;
}

function toCamelCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^(.)/, (m) => m.toLowerCase());
}

function transformKeys<T>(raw: any, keyMap: Record<string, string>): T {
  const result: any = {};
  for (const key in raw) {
    const camelKey = keyMap[key] || toCamelCase(key);
    result[camelKey] = raw[key];
  }
  return result as T;
}

const assessedMachineKeyMap = {
  'Machine': 'machine',
  'VM host': 'vmHost',
  'Azure VM readiness': 'azureVmReadiness',
  'Azure readiness issues': 'azureReadinessIssues',
  'Data collection issues': 'dataCollectionIssues',
  'Recommended size': 'recommendedSize',
  'Compute monthly cost estimate USD': 'computeMonthlyCostEstimateUsd',
  'Storage monthly cost estimate USD': 'storageMonthlyCostEstimateUsd',
  'Estimated monthly savings from Azure Hybrid Benefit for Windows OS USD': 'estimatedMonthlySavingsFromAzureHybridBenefitForWindowsOsUsd',
  'Estimated monthly savings from Azure Hybrid Benefit for Linux OS USD': 'estimatedMonthlySavingsFromAzureHybridBenefitForLinuxOsUsd',
  'Security readiness': 'securityReadiness',
  'Security monthly cost estimate USD': 'securityMonthlyCostEstimateUsd',
  'Operating system': 'operatingSystem',
  'Boot type': 'bootType',
  'Processor': 'processor',
  'Cores': 'cores',
  'Memory(MB)': 'memoryMb',
  'CPU usage(%)': 'cpuUsagePercent',
  'Memory usage(%)': 'memoryUsagePercent',
  'Storage(GB)': 'storageGb',
  'Standard HDD disks': 'standardHddDisks',
  'Standard SSD disks': 'standardSsdDisks',
  'Premium disks': 'premiumDisks',
  'Premium SSD V2 disks': 'premiumSsdV2Disks',
  'Ultra disks': 'ultraDisks',
  'Disk read(ops/sec)': 'diskReadOpsSec',
  'Disk write(ops/sec)': 'diskWriteOpsSec',
  'Disk read(MBPS)': 'diskReadMbps',
  'Disk write(MBPS)': 'diskWriteMbps',
  'Confidence Rating (% of utilization data collected)': 'confidenceRatingPercent',
  'Network adapters': 'networkAdapters',
  'IP address': 'ipAddress',
  'MAC address': 'macAddress',
  'Network in(MBPS)': 'networkInMbps',
  'Network out(MBPS)': 'networkOutMbps',
  'Group name': 'groupName',
};

const assessedDiskKeyMap = {
  'Machine': 'machine',
  'Disk name': 'diskName',
  'Azure disk readiness': 'azureDiskReadiness',
  'Recommended disk size SKU': 'recommendedDiskSizeSku',
  'Recommended disk type': 'recommendedDiskType',
  'Azure readiness issues': 'azureReadinessIssues',
  'Migration Guidance': 'migrationGuidance',
  'Data collection issues': 'dataCollectionIssues',
  'Monthly cost estimate': 'monthlyCostEstimate',
  'Source disk size(GB)': 'sourceDiskSizeGb',
  'Target disk size(GB)': 'targetDiskSizeGb',
  'Disk read(MBPS)': 'diskReadMbps',
  'Disk write(MBPS)': 'diskWriteMbps',
  'Disk read(ops/sec)': 'diskReadOpsSec',
  'Disk write(ops/sec)': 'diskWriteOpsSec',
  'Ultra disk provisioned IOPS (Operations/Sec)': 'ultraDiskProvisionedIops',
  'Ultra disk provisioned throughput (MBPS)': 'ultraDiskProvisionedThroughputMbps',
  'Premium SSD V2 disk provisioned IOPS (Operations/Sec)': 'premiumSsdV2DiskProvisionedIops',
  'Premium SSD V2 disk provisioned throughput (MBPS)': 'premiumSsdV2DiskProvisionedThroughputMbps',
};

const azureCalculatorKeyMap = {
  'Machines': 'machines',
  'PAYG': 'payg',
  '1 Year': 'oneYear',
  '3 Year': 'threeYear',
};

export function transformAssessmentSummary(raw: any): AssessmentSummaryRow {
  return transformKeys<AssessmentSummaryRow>(raw, { 'Azure Migrate': 'azureMigrate' });
}

export function transformAssessedMachine(raw: any): AssessedMachineRow {
  return transformKeys<AssessedMachineRow>(raw, assessedMachineKeyMap);
}

export function transformAssessedDisk(raw: any): AssessedDiskRow {
  return transformKeys<AssessedDiskRow>(raw, assessedDiskKeyMap);
}

export function transformAzureCalculator(raw: any): AzureCalculatorRow {
  return transformKeys<AzureCalculatorRow>(raw, azureCalculatorKeyMap);
}

export function transformAssessmentProperty(raw: any): AssessmentPropertyRow {
  return transformKeys<AssessmentPropertyRow>(raw, { 'Property': 'property', 'Selected value': 'selectedValue' });
}

// Helper function to add delay between API calls
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Recommend VM size for each workload
export async function recommendVmSizes(workloads: any[]): Promise<VMRecommendation[]> {
  console.log("🔍 [VM Recommendation] Starting VM size recommendations for", workloads.length, "workloads");
  const recommendations: VMRecommendation[] = [];
  
  // Group VMs by region and OS type to minimize API calls
  const vmGroups = new Map<string, any[]>();
  workloads.forEach(vm => {
    const key = `${vm.region}-${vm.osType}`;
    if (!vmGroups.has(key)) {
      vmGroups.set(key, []);
    }
    vmGroups.get(key)!.push(vm);
  });
  
  console.log(`📊 [VM Recommendation] Grouped into ${vmGroups.size} API calls instead of ${workloads.length}`);
  
  for (const [groupKey, groupVMs] of vmGroups) {
    const [region, osType] = groupKey.split('-');
    console.log(`🔍 [VM Recommendation] Processing group: ${region} ${osType} (${groupVMs.length} VMs)`);
    
    try {
      // Fetch pricing once for the entire group
      const prices = await fetchAzureVmPricing(region, osType);
      
      // Process each VM in the group
      for (const vm of groupVMs) {
        console.log("🔍 [VM Recommendation] Processing VM:", vm.vmName);
        
        // Add small delay between VM processing to avoid overwhelming the system
        if (groupVMs.indexOf(vm) > 0) {
          await delay(100); // 100ms delay between VMs
        }
        
        let match = null;
        // 1. Try to match on recommendedSize (armSkuName) if provided
        if (vm.recommendedSize) {
          const rec = String(vm.recommendedSize).toLowerCase();
          match = prices.find(
            (sku) => {
              if (!sku.sku) return false;
              const s = sku.sku.toLowerCase();
              return (
                s === rec ||
                s.replace(/_/g, '-') === rec.replace(/_/g, '-') ||
                s.replace(/_/g, ' ') === rec.replace(/_/g, ' ') ||
                s.replace(/-/g, '_') === rec.replace(/-/g, '_')
              );
            }
          );
        }
        // 2. Fallback: Find the smallest SKU that fits the workload (focus on cores, memory is optional)
        if (!match) {
          match = prices.find(
            (sku) => {
              // Must have enough cores
              if (!sku.cores || sku.cores < vm.cores) return false;
              
              // If we have memory info for both, check memory too
              if (sku.memoryGB && vm.memoryGB) {
                return sku.memoryGB >= vm.memoryGB;
              }
              
              // If no memory info for SKU, just check cores
              return true;
            }
          );
        }
        if (match) {
          recommendations.push({
            vmName: vm.vmName,
            recommendedSize: match.sku,
            pricePerMonthUSD: match.pricePerMonthUSD,
            details: match,
          });
          console.log("✅ [VM Recommendation] Found match for", vm.vmName, ":", match.sku);
        } else {
          recommendations.push({
            vmName: vm.vmName,
            recommendedSize: "No suitable SKU found",
            pricePerMonthUSD: 0,
            details: null,
          });
          console.log("⚠️ [VM Recommendation] No suitable SKU found for", vm.vmName);
        }
      }
    } catch (error) {
      console.error("❌ [VM Recommendation] Error processing group", groupKey, ":", error);
      // Add error entries for all VMs in this group
      for (const vm of groupVMs) {
        recommendations.push({
          vmName: vm.vmName,
          recommendedSize: "Error fetching pricing",
          pricePerMonthUSD: 0,
          details: { error: error instanceof Error ? error.message : String(error) },
        });
      }
    }
    
    // Add delay between groups to respect rate limits
    if (Array.from(vmGroups.keys()).indexOf(groupKey) < vmGroups.size - 1) {
      console.log(`⏳ [VM Recommendation] Waiting 2 seconds before next group...`);
      await delay(2000); // 2 second delay between groups
    }
  }
  
  console.log("✅ [VM Recommendation] Completed recommendations for", recommendations.length, "VMs");
  return recommendations;
} 