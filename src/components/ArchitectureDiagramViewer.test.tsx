// Test file for the ArchitectureDiagramViewer component
// This file demonstrates how to use the component with sample data

import React from 'react';
import ArchitectureDiagramViewer from './ArchitectureDiagramViewer';

/**
 * Sample report data for testing the component
 */
export const sampleReportData = {
  assessedMachines: [
    {
      machine: "WebServer-01",
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
      machine: "AppServer-01",
      operatingSystem: "Windows Server 2019",
      cores: 8,
      memoryMb: 16384,
      storageGb: 200,
      computeMonthlyCostEstimateUsd: 300.00,
      securityMonthlyCostEstimateUsd: 50.00,
      azureReadinessIssues: "",
      securityReadiness: "Ready",
      dataCollectionIssues: "",
      networkAdapters: "2",
      ipAddress: "192.168.1.11",
      networkInMbps: 150,
      networkOutMbps: 75,
      cpuUsagePercent: 65,
      memoryUsagePercent: 80
    },
    {
      machine: "DBServer-01",
      operatingSystem: "Ubuntu 20.04 LTS",
      cores: 16,
      memoryMb: 32768,
      storageGb: 500,
      computeMonthlyCostEstimateUsd: 600.00,
      securityMonthlyCostEstimateUsd: 75.00,
      azureReadinessIssues: "",
      securityReadiness: "Ready",
      dataCollectionIssues: "",
      networkAdapters: "4",
      ipAddress: "192.168.2.10",
      networkInMbps: 200,
      networkOutMbps: 100,
      cpuUsagePercent: 85,
      memoryUsagePercent: 90
    }
  ],
  assessedDisks: [
    {
      machine: "WebServer-01",
      diskName: "WebDisk-01",
      recommendedDiskType: "Premium SSD",
      monthlyCostEstimate: 25.00,
      sourceDiskSizeGb: 100,
      targetDiskSizeGb: 100
    },
    {
      machine: "AppServer-01",
      diskName: "AppDisk-01",
      recommendedDiskType: "Premium SSD",
      monthlyCostEstimate: 50.00,
      sourceDiskSizeGb: 200,
      targetDiskSizeGb: 200
    },
    {
      machine: "DBServer-01",
      diskName: "DBDisk-01",
      recommendedDiskType: "Premium SSD",
      monthlyCostEstimate: 125.00,
      sourceDiskSizeGb: 500,
      targetDiskSizeGb: 500
    }
  ]
};

/**
 * Example usage of the ArchitectureDiagramViewer component
 */
export function ExampleUsage() {
  const handleDiagramGenerated = (response: any) => {
    console.log('✅ Diagram generated successfully:', response);
  };

  const handleError = (error: string) => {
    console.error('❌ Diagram generation failed:', error);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Architecture Diagram Viewer Demo</h1>
      
      {/* Basic usage with auto-generation */}
      <ArchitectureDiagramViewer
        reportData={sampleReportData}
        title="Production Environment Architecture"
        description="Azure Landing Zone diagram for production workloads"
        onDiagramGenerated={handleDiagramGenerated}
        onError={handleError}
      />

      {/* Manual generation example */}
      <ArchitectureDiagramViewer
        reportData={sampleReportData}
        autoGenerate={false}
        title="Manual Generation Example"
        description="Click 'Generate Diagram' to create the diagram"
      />

      {/* Custom styling example */}
      <ArchitectureDiagramViewer
        reportData={sampleReportData}
        title="Custom Styled Diagram"
        description="With custom styling and layout"
        className="max-w-4xl mx-auto"
      />
    </div>
  );
}

/**
 * Example usage in a dashboard context
 */
export function DashboardExample() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      {/* Assessment Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Assessment Summary</h2>
        <div className="space-y-2">
          <p><strong>Total VMs:</strong> {sampleReportData.assessedMachines.length}</p>
          <p><strong>Total Disks:</strong> {sampleReportData.assessedDisks.length}</p>
          <p><strong>Windows VMs:</strong> {sampleReportData.assessedMachines.filter(m => m.operatingSystem.includes('Windows')).length}</p>
          <p><strong>Linux VMs:</strong> {sampleReportData.assessedMachines.filter(m => m.operatingSystem.includes('Linux')).length}</p>
        </div>
      </div>

      {/* Architecture Diagram */}
      <ArchitectureDiagramViewer
        reportData={sampleReportData}
        title="Azure Architecture"
        description="Generated from assessment data"
        className="h-full"
      />
    </div>
  );
}

/**
 * Example with error handling and callbacks
 */
export function AdvancedExample() {
  const [diagramState, setDiagramState] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [lastGenerated, setLastGenerated] = React.useState<Date | null>(null);

  const handleDiagramGenerated = (response: any) => {
    setDiagramState('success');
    setLastGenerated(new Date());
    console.log('Diagram generated:', response);
  };

  const handleError = (error: string) => {
    setDiagramState('error');
    console.error('Error:', error);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Advanced Diagram Viewer</h2>
        <div className="text-sm text-gray-500">
          {lastGenerated && `Last generated: ${lastGenerated.toLocaleTimeString()}`}
        </div>
      </div>

      <ArchitectureDiagramViewer
        reportData={sampleReportData}
        title="Advanced Architecture Diagram"
        description="With enhanced error handling and state management"
        onDiagramGenerated={handleDiagramGenerated}
        onError={handleError}
      />

      <div className="text-sm text-gray-600">
        <p>Current state: {diagramState}</p>
        <p>This example shows how to track the diagram generation state and handle callbacks.</p>
      </div>
    </div>
  );
}

// Example usage:
// import { ExampleUsage, DashboardExample, AdvancedExample } from './ArchitectureDiagramViewer.test';
// 
// // Use in your component
// <ExampleUsage />
// <DashboardExample />
// <AdvancedExample />
