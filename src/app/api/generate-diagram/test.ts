// Test file for the generate-diagram API route
// This file can be used to test the API functionality

export const sampleReportData = {
  assessedMachines: [
    {
      machine: "VM-001",
      operatingSystem: "Windows Server 2019",
      cores: 4,
      memoryMb: 8192,
      storageGb: 100,
      computeMonthlyCostEstimateUsd: 150.00,
      securityMonthlyCostEstimateUsd: 25.00,
      azureReadinessIssues: "",
      securityReadiness: "Ready",
      dataCollectionIssues: "",
      networkAdapters: "2",
      ipAddress: "192.168.1.10",
      networkInMbps: 100,
      networkOutMbps: 50,
      cpuUsagePercent: 45,
      memoryUsagePercent: 60
    },
    {
      machine: "VM-002",
      operatingSystem: "Ubuntu 20.04 LTS",
      cores: 2,
      memoryMb: 4096,
      storageGb: 50,
      computeMonthlyCostEstimateUsd: 75.00,
      securityMonthlyCostEstimateUsd: 15.00,
      azureReadinessIssues: "",
      securityReadiness: "Ready",
      dataCollectionIssues: "",
      networkAdapters: "1",
      ipAddress: "192.168.1.11",
      networkInMbps: 50,
      networkOutMbps: 25,
      cpuUsagePercent: 30,
      memoryUsagePercent: 40
    }
  ],
  assessedDisks: [
    {
      machine: "VM-001",
      diskName: "Disk-001",
      recommendedDiskType: "Premium SSD",
      monthlyCostEstimate: 25.00,
      sourceDiskSizeGb: 100,
      targetDiskSizeGb: 100
    },
    {
      machine: "VM-002",
      diskName: "Disk-002",
      recommendedDiskType: "Standard SSD",
      monthlyCostEstimate: 15.00,
      sourceDiskSizeGb: 50,
      targetDiskSizeGb: 50
    }
  ]
};

// Example usage:
// curl -X POST http://localhost:3000/api/generate-diagram \
//   -H "Content-Type: application/json" \
//   -d '{"reportData": sampleReportData}'
