// Test file for the generateDiagramBlueprint utility function
// This file demonstrates how to use the function and provides sample data

import { generateDiagramBlueprint, generateSimpleTestDiagram, type AssessmentSummary } from './generateDiagramBlueprint';

/**
 * Sample assessment summary data for testing
 */
export const sampleAssessmentSummary: AssessmentSummary = {
  workloads: {
    totalVMs: 5,
    windowsVMs: 3,
    linuxVMs: 2,
    totalCores: 16,
    totalMemoryGB: 64,
    totalStorageGB: 500,
    averageCpuUsage: 45,
    averageMemoryUsage: 60,
    vmNames: ['WebServer-01', 'AppServer-01', 'DBServer-01', 'LinuxApp-01', 'LinuxDB-01'],
    vmTypes: ['Web Server', 'Application Server', 'Database Server', 'Application Server', 'Database Server'],
    dependencies: ['Web -> App', 'App -> Database', 'Linux App -> Linux Database']
  },
  networking: {
    totalNetworkAdapters: 8,
    averageNetworkInMbps: 75,
    averageNetworkOutMbps: 40,
    uniqueIPRanges: 2,
    vnetIPs: ['10.0.0.0/16'],
    subnetRanges: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24', '10.0.4.0/24']
  },
  securityRisks: {
    machinesWithIssues: 1,
    securityReadinessIssues: 1,
    dataCollectionIssues: 0
  },
  costEstimates: {
    compute: 450.00,
    storage: 125.00,
    security: 75.00,
    total: 650.00
  },
  recommendations: {
    migrationStrategy: 'Lift and Shift',
    networkSegmentation: 'Multi-subnet',
    securityPriority: 'High'
  }
};

/**
 * Example usage of the generateDiagramBlueprint function
 */
export async function exampleUsage() {
  try {
    console.log('🔄 Generating diagram blueprint...');
    
    // Generate diagram using the utility function
    const plantUmlCode = await generateDiagramBlueprint(sampleAssessmentSummary, {
      maxTokens: 3000,
      temperature: 0.2,
      includeSecurityGroups: true,
      includeLoadBalancers: true
    });
    
    console.log('✅ Diagram generated successfully!');
    console.log('📊 PlantUML Code:');
    console.log(plantUmlCode);
    
    return plantUmlCode;
  } catch (error) {
    console.error('❌ Error generating diagram:', error);
    throw error;
  }
}

/**
 * Example usage with simple test diagram
 */
export function exampleSimpleDiagram() {
  console.log('🔄 Generating simple test diagram...');
  
  const simpleDiagram = generateSimpleTestDiagram();
  
  console.log('✅ Simple diagram generated!');
  console.log('📊 PlantUML Code:');
  console.log(simpleDiagram);
  
  return simpleDiagram;
}

/**
 * Example of how to use the function in a Next.js API route
 */
export async function exampleApiUsage() {
  // This is how you would use it in an API route
  const response = await fetch('/api/generate-diagram', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reportData: {
        assessedMachines: [
          {
            machine: "VM-001",
            operatingSystem: "Windows Server 2019",
            cores: 4,
            memoryMb: 8192,
            storageGb: 100,
            computeMonthlyCostEstimateUsd: 150.00,
            securityMonthlyCostEstimateUsd: 25.00,
            networkAdapters: "2",
            ipAddress: "192.168.1.10",
            networkInMbps: 100,
            networkOutMbps: 50,
            cpuUsagePercent: 45,
            memoryUsagePercent: 60
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
          }
        ]
      }
    })
  });

  const { blueprint } = await response.json();
  return blueprint;
}

// Example usage:
// import { exampleUsage, exampleSimpleDiagram } from './generateDiagramBlueprint.test';
// 
// // Generate a full diagram
// const diagram = await exampleUsage();
// 
// // Generate a simple test diagram
// const simpleDiagram = exampleSimpleDiagram();
