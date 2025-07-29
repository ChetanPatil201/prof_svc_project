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

// Fetch Azure VM pricing from Azure Retail Prices API
export async function fetchAzureVmPricing(region: string, osType: string): Promise<any[]> {
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
  while (nextPage) {
    const res = await fetch(nextPage);
    if (!res.ok) throw new Error(`Failed to fetch Azure pricing: ${res.status}`);
    const data = await res.json();
    if (data.Items) {
      results.push(
        ...data.Items.map((item: any) => ({
          sku: item.armSkuName,
          skuName: item.skuName,
          productName: item.productName,
          cores: extractCores(item.skuName),
          memoryGB: extractMemory(item.skuName),
          priceType: item.priceType, // Consumption, Reservation
          term: item.term || '', // 1 Year, 3 Years, or empty
          retailPrice: item.retailPrice,
          pricePerMonthUSD: item.retailPrice * 730, // 730 hours/month
          unitOfMeasure: item.unitOfMeasure,
          osType: osType,
          isAhb: item.skuName?.toLowerCase().includes('ahb') || false,
        }))
      );
    }
    nextPage = data.NextPageLink;
  }
  // If no results, retry without the OS filter
  if (results.length === 0 && (osType === "Windows" || osType === "Linux")) {
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
            priceType: item.priceType,
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
    results = fallbackResults.filter((sku) => sku.cores && sku.memoryGB);
  }
  // Group by SKU and return all price types for each SKU
  const grouped: Record<string, any> = {};
  for (const item of results.filter((sku) => sku.cores && sku.memoryGB)) {
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
  return Object.values(grouped);
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
      const res = await fetch(apiUrl);
      if (!res.ok) {
        continue;
      }
      const data = await res.json();
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
  const match = skuName.match(/([0-9]+)[^0-9]*v?\d*/i);
  return match ? parseInt(match[1], 10) : null;
}
// Helper: Extract memory from SKU name (not available in name, so returns null)
function extractMemory(skuName: string): number | null {
  // Real implementation would map SKU to memory size using a lookup table
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

// Recommend VM size for each workload
export async function recommendVmSizes(workloads: any[]): Promise<VMRecommendation[]> {
  const recommendations: VMRecommendation[] = [];
  for (const vm of workloads) {
    const prices = await fetchAzureVmPricing(vm.region, vm.osType);
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
    // 2. Fallback: Find the smallest SKU that fits the workload
    if (!match) {
      match = prices.find(
        (sku) => sku.cores >= vm.cores && (!sku.memoryGB || sku.memoryGB >= vm.memoryGB)
      );
    }
    if (match) {
      recommendations.push({
        vmName: vm.vmName,
        recommendedSize: match.sku,
        pricePerMonthUSD: match.pricePerMonthUSD,
        details: match,
      });
    } else {
      recommendations.push({
        vmName: vm.vmName,
        recommendedSize: "No suitable SKU found",
        pricePerMonthUSD: 0,
        details: null,
      });
    }
  }
  return recommendations;
} 