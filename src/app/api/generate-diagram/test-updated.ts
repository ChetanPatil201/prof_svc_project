// Test file for the updated generate-diagram API route
// This file demonstrates the enhanced functionality with retry logic and better error handling

export const testReportData = {
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

export const invalidReportData = {
  // Missing required arrays
  someOtherData: "test"
};

export const emptyReportData = {
  assessedMachines: [],
  assessedDisks: []
};

// Example usage with fetch
export async function testApiRoute() {
  try {
    console.log('🔄 Testing updated generate-diagram API route...');
    
    const response = await fetch('/api/generate-diagram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportData: testReportData
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ API call successful!');
      console.log('📊 Response:', {
        success: result.success,
        processingTime: result.processingTime,
        summary: result.summary,
        blueprintLength: result.blueprint?.length || 0
      });
      
      if (result.blueprint) {
        console.log('🎨 PlantUML Code Preview:');
        console.log(result.blueprint.substring(0, 200) + '...');
      }
    } else {
      console.error('❌ API call failed:', {
        status: response.status,
        statusText: response.statusText,
        error: result.error
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Test error handling
export async function testErrorHandling() {
  console.log('🔄 Testing error handling...');
  
  // Test with invalid data
  try {
    const response = await fetch('/api/generate-diagram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportData: invalidReportData
      })
    });

    const result = await response.json();
    console.log('📊 Invalid data test result:', {
      status: response.status,
      success: result.success,
      error: result.error
    });
  } catch (error) {
    console.error('❌ Invalid data test failed:', error);
  }
  
  // Test with empty data
  try {
    const response = await fetch('/api/generate-diagram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportData: emptyReportData
      })
    });

    const result = await response.json();
    console.log('📊 Empty data test result:', {
      status: response.status,
      success: result.success,
      error: result.error
    });
  } catch (error) {
    console.error('❌ Empty data test failed:', error);
  }
}

// Example usage:
// import { testApiRoute, testErrorHandling } from './test-updated';
// 
// // Test the main functionality
// await testApiRoute();
// 
// // Test error handling
// await testErrorHandling();
