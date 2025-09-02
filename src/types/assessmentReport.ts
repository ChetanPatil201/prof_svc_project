export interface AssessmentReportTemplate {
  sections: {
    executiveSummary: {
      title: string;
      content: string;
      placeholders: string[];
    };
    cloudDiscovery: {
      title: string;
      content: string;
      placeholders: string[];
    };
  };
}

export interface ServerDetails {
  vmName: string;
  operatingSystem: string;
  cores: number;
  memoryGB: number;
  storageGB: number;
  recommendedSize: string;
  computeMonthlyCostEstimateUsd: number;
  storageMonthlyCostEstimateUsd: number;
  readiness: string;
  inScope: boolean;
  cpuUsage?: string | number;
  memoryUsage?: string | number;
}

export interface AssessmentReportData {
  totalServers: number;
  inScopeServersCount: number;
  vmSummary: ServerDetails[];
  osDistribution: Record<string, number>;
  serverInfrastructure: string;
  readinessSummary: string;
  costAnalysis: string;
  recommendations: string;
  windowsServers: number;
  linuxServers: number;
  totalStorageTB: number;
  numDisksInScope: number;
  allAssessedDisks?: AssessedDisk[];
  osDistributionTable?: { os: string; count: number }[];
  osDistributionTotal?: number;
  inScopeServers?: { machine: string; operatingSystem: string; cores: string | number; memoryMb: string | number; storageGb: string | number }[];
  cloudReadiness?: { machine: string; operatingSystem: string; vmReadiness: string; azurePlan?: string }[];
  genAiVmSummary?: { vmName: string; cores: string | number; memoryMB: string | number; cpuUsage: string | number; memoryUsage: string | number; recommendedSize: string }[];
  targetRegion?: string; // Target Azure region from assessment
  
  // Rules and Constraints for disk recommendations
  rulesAndConstraints?: string;
  
  // Reserved Instance Data
  payAsYouGoData?: ReservedInstanceData;
  oneYearReservedData?: ReservedInstanceData;
  threeYearReservedData?: ReservedInstanceData;
  costComparison?: CostComparisonData;
}

export interface ReservedInstanceData {
  machines: AssessedMachine[];
  disks: AssessedDisk[];
  totalMonthlyCost: number;
  totalAnnualCost: number;
  totalThreeYearCost?: number;
  savingsVsPayAsYouGo?: number;
  savingsPercentage?: number;
}

export interface CostComparisonData {
  payAsYouGo: {
    monthlyCost: number;
    annualCost: number;
    threeYearCost: number;
  };
  oneYearReserved: {
    monthlyCost: number;
    annualCost: number;
    threeYearCost: number;
    savingsVsPayAsYouGo: number;
    savingsPercentage: number;
  };
  threeYearReserved: {
    monthlyCost: number;
    annualCost: number;
    threeYearCost: number;
    savingsVsPayAsYouGo: number;
    savingsPercentage: number;
  };
  recommendations: {
    bestOption: 'pay-as-you-go' | '1-year-reserved' | '3-year-reserved';
    reasoning: string;
    estimatedSavings: number;
  };
}

export interface CostComparisonItem {
  machine: string;
  payAsYouGoCost: number;
  reservedInstance1YrCost: number;
  reservedInstance3YrCost: number;
  savings1Yr: number;
  savings3Yr: number;
  recommendedOption: 'pay-as-you-go' | '1-year-ri' | '3-year-ri';
}

export interface CostComparisonTableRow {
  pricingPlan: string;
  configMatch?: string;
  compute: number;
  storage: number;
  total: number;
}

export interface CostComparisonTableData {
  rows: CostComparisonTableRow[];
  summary: {
    totalMonthlyCost: number;
    bestPricingOption: string;
    costSavingsPercentage: number;
    recommendationSummary: string;
  };
}

export const ASSESSMENT_REPORT_TEMPLATE: AssessmentReportTemplate = {
  sections: {
    executiveSummary: {
      title: "1. Executive Summary – Cloud Discovery and Assessment",
      content: `This executive summary provides a comprehensive overview of the cloud discovery and assessment initiative undertaken for [Company Name]. The assessment was conducted using Azure Migrate to evaluate the current on-premises infrastructure and determine cloud readiness for migration to Microsoft Azure.\n\nKey Findings:\n• Total servers discovered:  {totalServers}\n• Servers in scope for migration:  {inScopeServers}\n• Cloud readiness assessment completed\n• Cost optimization opportunities identified\n• Migration strategy recommendations developed\n\n {readinessSummary}\n\n {costAnalysis}\n\n {recommendations}`,
      placeholders: ["totalServers", "inScopeServers", "readinessSummary", "costAnalysis", "recommendations"]
    },
    cloudDiscovery: {
      title: "2. Cloud Discovery Report – Application Workloads",
      content: `This section provides detailed insights into the discovered application workloads and their current infrastructure characteristics. The assessment covers server specifications, operating system distribution, and workload categorization.\n\nServer Infrastructure Assessment:\n {serverInfrastructure}\n\nOperating System Distribution:\n {osDistribution}\n\nVM Summary and Specifications:\n {vmSummary}\n\nDetailed Server Analysis:\nThe following table provides a comprehensive view of all discovered servers, including their current specifications, recommended Azure VM sizes, and estimated costs.\n\n[Server Details Table will be inserted here]`,
      placeholders: ["serverInfrastructure", "osDistribution", "vmSummary"]
    }
  }
};

// --- Azure Migrate Assessment Report Data Structures ---

export interface AssessmentSummary {
  tool?: string; // e.g., "Azure Migrate"
  // Add more fields as needed from Assessment_Summary
}

export interface ArchitectureAssessmentSummary {
  workloads: {
    totalVMs: number;
    windowsVMs: number;
    linuxVMs: number;
    totalCores: number;
    totalMemoryGB: number;
    totalStorageGB: number;
    averageCpuUsage: number;
    averageMemoryUsage: number;
  };
  networking: {
    totalNetworkAdapters: number;
    averageNetworkInMbps: number;
    averageNetworkOutMbps: number;
    uniqueIPRanges: number;
  };
  securityRisks: {
    machinesWithIssues: number;
    securityReadinessIssues: number;
    dataCollectionIssues: number;
  };
  storage: {
    totalDisks: number;
    premiumDisks: number;
    standardDisks: number;
    totalStorageCost: number;
  };
  costs: {
    compute: number;
    storage: number;
    security: number;
    total: number;
  };
  recommendations: {
    migrationStrategy: string;
    networkSegmentation: string;
    securityPriority: string;
  };
}

export interface AssessmentReportSummary {
  totalMachines: number;
  totalCosts: {
    payAsYouGo: number;
    reservedInstance1Yr: number;
    reservedInstance3Yr: number;
  };
  totalSavings: {
    reservedInstance1Yr: number;
    reservedInstance3Yr: number;
  };
  recommendations: {
    machinesFor1YrRI: string[];
    machinesFor3YrRI: string[];
    machinesForPayAsYouGo: string[];
  };
}

export interface AssessmentReportComparison {
  payAsYouGo: FullAssessmentReportData | null;
  reservedInstance1Yr: FullAssessmentReportData | null;
  reservedInstance3Yr: FullAssessmentReportData | null;
}

export interface AssessedMachine {
  machine: string;
  vmHost: string;
  azureVmReadiness: string;
  azureReadinessIssues: string;
  dataCollectionIssues: string;
  recommendedSize: string;
  computeMonthlyCostEstimateUsd: number;
  storageMonthlyCostEstimateUsd: number;
  estimatedMonthlySavingsHybridBenefitWindows: number;
  estimatedMonthlySavingsHybridBenefitLinux: number;
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

export interface AssessedDisk {
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

export interface AssessmentProperty {
  property: string;
  selectedValue: string;
}

export interface FullAssessmentReportData {
  summary?: AssessmentSummary;
  assessedMachines: AssessedMachine[];
  assessedDisks: AssessedDisk[];
  assessmentProperties: AssessmentProperty[];
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