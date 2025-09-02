import { NextRequest, NextResponse } from 'next/server';

// Function to generate diagram with actual Azure icons using PlantUML sprites
async function generateDiagramWithAzureIcons(summary: any): Promise<string> {
  const { workloads } = summary;
  
  console.log('[Generate Diagram] Using assessment data:', {
    totalVMs: workloads.totalVMs,
    totalDisks: workloads.totalDisks
  });
  
  // Azure icon mappings
  const iconMappings = {
    vm: { name: '10021-icon-service-Virtual-Machine', category: 'compute' },
    vnet: { name: '10061-icon-service-Virtual-Networks', category: 'networking' },
    nsg: { name: '10067-icon-service-Network-Security-Groups', category: 'networking' },
    storage: { name: '10086-icon-service-Storage-Accounts', category: 'storage' },
    loadBalancer: { name: '10062-icon-service-Load-Balancers', category: 'networking' },
    keyVault: { name: '10245-icon-service-Key-Vaults', category: 'security' },
    monitor: { name: '00001-icon-service-Monitor', category: 'monitor' },
    appGateway: { name: '10076-icon-service-Application-Gateways', category: 'networking' },
    subscription: { name: '10002-icon-service-Subscriptions', category: 'general' }
  };

  // Generate PlantUML with professional architecture styling
  let plantUml = '@startuml\n' +
    '!theme plain\n' +
    'skinparam rectangleRoundCorner 8\n' +
    "skinparam defaultFontName 'Segoe UI'\n" +
    'skinparam shadowing true\n' +
    'skinparam backgroundColor #FFFFFF\n' +
    'skinparam arrowColor #0078D4\n' +
    'skinparam arrowThickness 2\n' +
    'skinparam shadowingOffsetX 2\n' +
    'skinparam shadowingOffsetY 2\n' +
    'skinparam shadowingColor #CCCCCC\n' +
    '\n' +
    "' Professional architecture color palette\n" +
    'skinparam rectangle {\n' +
    '  BackgroundColor #F8F9FA\n' +
    '  BorderColor #0078D4\n' +
    '  BorderThickness 1\n' +
    '}\n' +
    '\n' +
    'skinparam package {\n' +
    '  BackgroundColor #F8F9FA\n' +
    '  BorderColor #0078D4\n' +
    '  BorderThickness 2\n' +
    '}\n' +
    '\n' +
    'skinparam cloud {\n' +
    '  BackgroundColor #E3F2FD\n' +
    '  BorderColor #0078D4\n' +
    '}\n'

  // Generate dynamic VM definitions based on assessment data
  const generateVMDefinitions = () => {
    const vms = workloads.vms || [];
    let vmDefinitions = '';
    let vmCount = 0;
    
    console.log('[Generate Diagram] Processing ' + vms.length + ' VMs from assessment data');
    
    // For large numbers of VMs, create a simplified representation
    if (vms.length > 10) {
      // Group VMs by tier and show summary - PRIORITY-BASED classification (no overlaps)
      let webTierCount = 0;
      let appTierCount = 0;
      let dataTierCount = 0;
      let mgmtTierCount = 0;
      
      vms.forEach(vm => {
        const cores = vm.cores || 2;
        const memory = vm.memoryMb || 4096;
        
        // Priority-based classification (highest to lowest priority)
        if (cores >= 8 || memory >= 16384) {
          // Data Tier: High-performance VMs
          dataTierCount++;
        } else if (cores >= 4 || memory >= 8192) {
          // App Tier: Medium-performance VMs
          appTierCount++;
        } else if (cores >= 2 || memory >= 4096) {
          // Web Tier: Standard VMs
          webTierCount++;
        } else {
          // Management Tier: Small VMs
          mgmtTierCount++;
        }
      });
      
      if (webTierCount > 0) {
        vmDefinitions += '    package "**Web Tier**\\n**10.0.1.0/24**" {\n';
        vmDefinitions += '      node "**' + webTierCount + ' Web Servers**\\n**Various VM Sizes**" as web\n';
        vmCount += webTierCount;
        vmDefinitions += '    }\n';
      }
      
      if (appTierCount > 0) {
        vmDefinitions += '    package "**Application Tier**\\n**10.0.2.0/24**" {\n';
        vmDefinitions += '      node "**' + appTierCount + ' App Servers**\\n**Various VM Sizes**" as app\n';
        vmCount += appTierCount;
        vmDefinitions += '    }\n';
      }
      
      if (dataTierCount > 0) {
        vmDefinitions += '    package "**Data Tier**\\n**10.0.3.0/24**" {\n';
        vmDefinitions += '      database "**' + dataTierCount + ' Database Servers**\\n**Various VM Sizes**" as db\n';
        vmCount += dataTierCount;
        vmDefinitions += '    }\n';
      }
      
      if (mgmtTierCount > 0) {
        vmDefinitions += '    package "**Management Tier**\\n**10.0.4.0/24**" {\n';
        vmDefinitions += '      node "**' + mgmtTierCount + ' Management Servers**\\n**Various VM Sizes**" as mgmt\n';
        vmCount += mgmtTierCount;
        vmDefinitions += '    }\n';
      }
      
      // Debug and validate VM classification for large VM counts
      const totalClassifiedVMs = webTierCount + appTierCount + dataTierCount + mgmtTierCount;
      console.log(`🔍 [Generate Diagram] VM Classification Results (Large Count):`);
      console.log(`   Total VMs: ${vms.length}`);
      console.log(`   Web Tier: ${webTierCount} VMs`);
      console.log(`   App Tier: ${appTierCount} VMs`);
      console.log(`   Data Tier: ${dataTierCount} VMs`);
      console.log(`   Management Tier: ${mgmtTierCount} VMs`);
      console.log(`   Total Classified: ${totalClassifiedVMs}`);
      
      if (totalClassifiedVMs !== vms.length) {
        console.log(`⚠️ [Generate Diagram] VM count mismatch: classified ${totalClassifiedVMs} vs actual ${vms.length}`);
      }
    } else {
      // For smaller numbers, show individual VMs
      const webTierVMs = [];
      const appTierVMs = [];
      const dataTierVMs = [];
      const managementTierVMs = [];
      
      vms.forEach((vm: any, index: number) => {
        const vmName = vm.machine || 'VM-' + (index + 1);
        const vmSize = vm.recommendedSize || 'Standard_D2s_v3';
        const vmCores = vm.cores || 2;
        const vmMemory = vm.memoryMb || 4096;
        
        // Priority-based classification (highest to lowest priority) - NO OVERLAPS
        if (vmCores >= 8 || vmMemory >= 16384) {
          dataTierVMs.push({ name: vmName, size: vmSize, cores: vmCores, memory: vmMemory });
        } else if (vmCores >= 4 || vmMemory >= 8192) {
          appTierVMs.push({ name: vmName, size: vmSize, cores: vmCores, memory: vmMemory });
        } else if (vmCores >= 2 || vmMemory >= 4096) {
          webTierVMs.push({ name: vmName, size: vmSize, cores: vmCores, memory: vmMemory });
        } else {
          managementTierVMs.push({ name: vmName, size: vmSize, cores: vmCores, memory: vmMemory });
        }
      });
      
      // Generate VM definitions for each tier
      if (webTierVMs.length > 0) {
        vmDefinitions += '    package "**Web Tier**\\n**10.0.1.0/24**" {\n';
        webTierVMs.forEach((vm, index) => {
          const vmId = 'web' + (index + 1);
          vmDefinitions += '      node "**' + vm.name + '**\\n**' + vm.size + '**" as ' + vmId + '\n';
          vmCount++;
        });
        vmDefinitions += '    }\n';
      }
      
      if (appTierVMs.length > 0) {
        vmDefinitions += '    package "**Application Tier**\\n**10.0.2.0/24**" {\n';
        appTierVMs.forEach((vm, index) => {
          const vmId = 'app' + (index + 1);
          vmDefinitions += '      node "**' + vm.name + '**\\n**' + vm.size + '**" as ' + vmId + '\n';
          vmCount++;
        });
        vmDefinitions += '    }\n';
      }
      
      if (dataTierVMs.length > 0) {
        vmDefinitions += '    package "**Data Tier**\\n**10.0.3.0/24**" {\n';
        dataTierVMs.forEach((vm, index) => {
          const vmId = 'db' + (index + 1);
          vmDefinitions += '      database "**' + vm.name + '**\\n**' + vm.size + '**" as ' + vmId + '\n';
          vmCount++;
        });
        vmDefinitions += '    }\n';
      }
      
      if (managementTierVMs.length > 0) {
        vmDefinitions += '    package "**Management Tier**\\n**10.0.4.0/24**" {\n';
        managementTierVMs.forEach((vm, index) => {
          const vmId = 'mgmt' + (index + 1);
          vmDefinitions += '      node "**' + vm.name + '**\\n**' + vm.size + '**" as ' + vmId + '\n';
          vmCount++;
        });
        vmDefinitions += '    }\n';
      }
      
      // Validate that total VM count matches the input for small VM counts
      const totalClassifiedVMs = webTierVMs.length + appTierVMs.length + dataTierVMs.length + managementTierVMs.length;
      console.log(`🔍 [Generate Diagram] VM Classification Results:`);
      console.log(`   Total VMs: ${vms.length}`);
      console.log(`   Web Tier: ${webTierVMs.length} VMs`);
      console.log(`   App Tier: ${appTierVMs.length} VMs`);
      console.log(`   Data Tier: ${dataTierVMs.length} VMs`);
      console.log(`   Management Tier: ${managementTierVMs.length} VMs`);
      console.log(`   Total Classified: ${totalClassifiedVMs}`);
      
      if (totalClassifiedVMs !== vms.length) {
        console.log(`⚠️ [Generate Diagram] VM count mismatch: classified ${totalClassifiedVMs} vs actual ${vms.length}`);
      }
    }
    

    
    return { vmDefinitions, vmCount };
  };
  
  const { vmDefinitions, vmCount } = generateVMDefinitions();
  
  // Generate dynamic connections based on actual VMs
  const generateVMConnections = () => {
    const vms = workloads.vms || [];
    let connections = '';
    
    // For large numbers of VMs, create simplified connections
    if (vms.length > 10) {
      const webTierCount = vms.filter(vm => (vm.cores || 2) >= 2 && (vm.memoryMb || 4096) >= 4096 && (vm.cores || 2) < 4).length;
      const appTierCount = vms.filter(vm => (vm.cores || 2) >= 4 && (vm.memoryMb || 4096) >= 8192 && (vm.cores || 2) < 8).length;
      const dataTierCount = vms.filter(vm => (vm.cores || 2) >= 8 || (vm.memoryMb || 4096) >= 16384).length;
      
      // Simplified connections for large deployments
      if (webTierCount > 0) {
        connections += 'lb -[#00C851,thickness=2]-> web : **Load Distribution**\n';
      }
      if (webTierCount > 0 && appTierCount > 0) {
        connections += 'web -[#0078D4,thickness=2]-> app : **Application Flow**\n';
      }
      if (appTierCount > 0 && dataTierCount > 0) {
        connections += 'app -[#0078D4,thickness=2]-> db : **Database Access**\n';
      }
      
      // Security and monitoring
      connections += 'nsg -[#FF0000,thickness=2]-> web : **Security Rules**\n';
      connections += 'nsg -[#FF0000,thickness=2]-> app : **Security Rules**\n';
      connections += 'nsg -[#FF0000,thickness=2]-> db : **Security Rules**\n';
      connections += 'app -[#FFB347,thickness=1]-> kv : **Secrets Access**\n';
      connections += 'db -[#4ECDC4,thickness=2]-> storage : **Data Storage**\n';
      connections += 'monitor -[#87CEEB,thickness=1]-> web : **Monitoring**\n';
      connections += 'monitor -[#87CEEB,thickness=1]-> app : **Monitoring**\n';
      connections += 'monitor -[#87CEEB,thickness=1]-> db : **Monitoring**\n';
    } else {
      // For smaller numbers, show detailed connections
      const allVMIds = [];
      let webCount = 0, appCount = 0, dbCount = 0, mgmtCount = 0;
      
      vms.forEach((vm: any, index: number) => {
        const vmCores = vm.cores || 2;
        const vmMemory = vm.memoryMb || 4096;
        
        if (vmCores >= 8 || vmMemory >= 16384) {
          dbCount++;
          allVMIds.push('db' + dbCount);
        } else if (vmCores >= 4 || vmMemory >= 8192) {
          appCount++;
          allVMIds.push('app' + appCount);
        } else if (vmCores >= 2 || vmMemory >= 4096) {
          webCount++;
          allVMIds.push('web' + webCount);
        } else {
          mgmtCount++;
          allVMIds.push('mgmt' + mgmtCount);
        }
      });
      
      // Generate load balancer connections to web tier
      if (webCount > 0) {
        for (let i = 1; i <= webCount; i++) {
          connections += 'lb -[#00C851,thickness=2]-> web' + i + ' : **Port 80/443**\n';
        }
      }
      
      // Generate application flow connections
      if (webCount > 0 && appCount > 0) {
        for (let i = 1; i <= Math.min(webCount, appCount); i++) {
          connections += 'web' + i + ' -[#0078D4,thickness=2]-> app' + i + ' : **HTTP/HTTPS**\n';
        }
      }
      
      // Generate database connections
      if (appCount > 0 && dbCount > 0) {
        for (let i = 1; i <= appCount; i++) {
          for (let j = 1; j <= dbCount; j++) {
            connections += 'app' + i + ' -[#0078D4,thickness=2]-> db' + j + ' : **Database Connection**\n';
          }
        }
      }
      
      // Generate management connections
      if (mgmtCount > 0) {
        allVMIds.forEach(vmId => {
          if (!vmId.startsWith('mgmt')) {
            connections += 'mgmt1 -[#FF6B6B,thickness=1]-> ' + vmId + ' : **SSH/RDP**\n';
          }
        });
      }
      
      // Generate security rules
      allVMIds.forEach(vmId => {
        connections += 'nsg -[#FF0000,thickness=2]-> ' + vmId + ' : **Security Rules**\n';
      });
      
      // Generate secrets access for app tier
      for (let i = 1; i <= appCount; i++) {
        connections += 'app' + i + ' -[#FFB347,thickness=1]-> kv : **Secrets Access**\n';
      }
      
      // Generate data storage connections
      for (let i = 1; i <= dbCount; i++) {
        connections += 'db' + i + ' -[#4ECDC4,thickness=2]-> storage : **Data Storage**\n';
      }
      
      // Generate monitoring connections
      allVMIds.forEach(vmId => {
        connections += 'monitor -[#87CEEB,thickness=1]-> ' + vmId + ' : **Metrics**\n';
      });
    }
    
    return connections;
  };
  
  const vmConnections = generateVMConnections();
  
  // Add the main PlantUML structure using string concatenation
  plantUml += '\n' +
    "' Azure Landing Zone Architecture\n" +
    'title **Azure Landing Zone Architecture** - Generated from Azure Migrate Assessment - ' + workloads.totalVMs + ' VMs\n' +
    '\n' +
    "' External Internet/Users\n" +
    'cloud "**Internet**\\n**External Users**" as internet\n' +
    '\n' +
    "' Azure Subscription Container\n" +
    'package "**Azure Production Subscription**" {\n' +
    '  \n' +
    "  ' Virtual Network with proper subnet structure\n" +
    '  package "**Virtual Network**\\n**10.0.0.0/16**" {\n' +
    vmDefinitions +
    '  }\n' +
    '  \n' +
    "  ' Azure PaaS Services\n" +
    '  package "**Azure Services**" {\n' +
    '    rectangle "**Application Gateway**\\n**WAF Enabled**" as agw\n' +
    '    rectangle "**Load Balancer**\\n**Standard SKU**" as lb\n' +
    '    rectangle "**Network Security Group**\\n**Custom Rules**" as nsg\n' +
    '    rectangle "**Key Vault**\\n**Premium SKU**" as kv\n' +
    '    rectangle "**Storage Account**\\n**' + (typeof workloads.totalStorageGB === 'number' ? workloads.totalStorageGB.toFixed(0) : '0') + ' GB**" as storage\n' +
    '    rectangle "**Azure Monitor**\\n**Log Analytics**" as monitor\n' +
    '  }\n' +
    '}\n' +
    '\n' +

    '\n' +
    "' Professional data flow and connections\n" +
    "' External traffic flow\n" +
    'internet -[#0078D4,thickness=3]-> agw : **HTTPS Traffic**\n' +
    'agw -[#0078D4,thickness=2]-> lb : **Load Distribution**\n' +
    '\n' +
    vmConnections +
    '\n' +
    "' Color-coded Azure architecture components\n" +
    "' Each component uses Azure color palette for visual identification\n" +
    '\n' +
    "' Professional architecture legend\n" +
    'legend right\n' +
    '  |= Component Type | Description | Purpose |\n' +
    '  | Subscription | Azure Resource Container |\n' +
    '  | Network | Connectivity & Traffic Management |\n' +
    '  | Compute | Virtual Machines & Application Servers |\n' +
    '  | Storage | Data Persistence & Backup |\n' +
    '  | Security | Access Control & Secrets Management |\n' +
    '  | Monitoring | Observability & Logging |\n' +
    '  | Gateway | Web Traffic Management & WAF |\n' +
    'endlegend\n' +
    '\n' +
    "' Professional architecture notes\n" +
    'note bottom\n' +
    '  **Enterprise Architecture**: This diagram represents a production-ready Azure Landing Zone\n' +
    '  following Microsoft Cloud Adoption Framework (CAF) best practices.\n' +
    '  \n' +
    '  **Key Features**: Multi-tier application architecture with proper network segmentation,\n' +
    '  security controls, high availability, monitoring, and cost optimization.\n' +
    '  \n' +
    '  **Compliance**: Designed for enterprise security and compliance requirements.\n' +
    'end note\n' +
    '\n' +
    '@enduml';

  return plantUml;
}

/**
 * Analyzes Azure Migrate assessment data and returns a structured summary
 * This function processes the raw assessment data to extract key metrics
 */
function analyzeMigrateReport(reportData: any): any {
  try {
    // Handle both old format (assessedMachines/assessedDisks) and new format (assessmentSummary)
    let assessedMachines = [];
    let assessedDisks = [];
    
    if (reportData.assessmentSummary) {
      // New format: use data from assessmentSummary
      const summary = reportData.assessmentSummary;
      const rawVMs = summary.workloads?.vms || [];
      
      // Map the new format to expected structure
      assessedMachines = rawVMs.map((vm: any) => ({
        machine: vm.name || `VM-${Math.random().toString(36).substr(2, 9)}`,
        recommendedSize: 'Standard_D2s_v3',
        cores: vm.cores || 2,
        memoryMb: (vm.memory || 4) * 1024,
        storageGb: 100,
        operatingSystem: vm.os || 'Windows'
      }));
    } else {
      // Old format: use assessedMachines and assessedDisks directly
      assessedMachines = reportData.assessedMachines || [];
      assessedDisks = reportData.assessedDisks || [];
    }
    
    // Calculate workload metrics
    const totalVMs = assessedMachines.length;
    const totalDisks = assessedDisks.length;
    const totalStorageGB = assessedDisks.reduce((sum: number, disk: any) => sum + (disk.sourceDiskSizeGb || 0), 0);
    
    // Set default migration strategy
    const migrationStrategy = 'Lift and Shift';
    
    // Structure VM data for diagram generation
    const vms = assessedMachines.map((machine: any) => ({
      machine: machine.machine,
      recommendedSize: machine.recommendedSize || 'Standard_D2s_v3',
      cores: machine.cores || 2,
      memoryMb: machine.memoryMb || 4096,
      storageGb: machine.storageGb || 100,
      operatingSystem: machine.operatingSystem || 'Windows'
    }));
    
    return {
      workloads: {
        totalVMs,
        totalDisks,
        totalStorageGB,
        vms,
        windowsVMs: assessedMachines.filter((m: any) => m.operatingSystem?.toLowerCase().includes('windows')).length,
        linuxVMs: assessedMachines.filter((m: any) => m.operatingSystem?.toLowerCase().includes('linux')).length
      },
      networking: {
        totalNetworkAdapters: assessedMachines.reduce((sum: number, m: any) => sum + (parseInt(m.networkAdapters) || 0), 0),
        averageBandwidth: assessedMachines.reduce((sum: number, m: any) => sum + (m.networkInMbps || 0), 0) / Math.max(totalVMs, 1)
      },
      securityRisks: {
        total: assessedMachines.filter((m: any) => m.securityReadiness !== 'Ready').length
      },
      recommendations: {
        migrationStrategy
      }
    };
  } catch (error) {
    console.error('Error analyzing migrate report:', error);
    return null;
  }
}

/**
 * API Route to generate architecture diagrams with Azure icons
 * Provides both PlantUML diagram and icon metadata for frontend rendering
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('[Generate Diagram with Icons API] Processing request...');
    
    // Parse request body
    const body = await request.json();
    const { reportData } = body;

    if (!reportData) {
      return NextResponse.json(
        { success: false, error: 'Missing reportData in request body' },
        { status: 400 }
      );
    }

    // Analyze the assessment data
    console.log('[Generate Diagram with Icons API] Analyzing assessment data...');
    const assessmentSummary = await analyzeMigrateReport(reportData);
    
    if (!assessmentSummary) {
      return NextResponse.json(
        { success: false, error: 'Failed to analyze assessment data' },
        { status: 422 }
      );
    }

    console.log('[Generate Diagram with Icons API] Analyzed ' + assessmentSummary.workloads.totalVMs + ' VMs, ' + assessmentSummary.workloads.totalDisks + ' disks');

    // Generate the PlantUML diagram with Azure icons
    console.log('[Generate Diagram with Icons API] Generating diagram with Azure icons...');
    const plantUmlCode = await generateDiagramWithAzureIcons(assessmentSummary);

    // Define Azure icon mappings for frontend use
    const azureIcons = {
      subscription: {
        name: '10002-icon-service-Subscriptions',
        category: 'general',
        description: 'Azure Subscription'
      },
      vnet: {
        name: '10061-icon-service-Virtual-Networks',
        category: 'networking',
        description: 'Virtual Network'
      },
      vm: {
        name: '10021-icon-service-Virtual-Machine',
        category: 'compute',
        description: 'Virtual Machine'
      },
      nsg: {
        name: '10067-icon-service-Network-Security-Groups',
        category: 'networking',
        description: 'Network Security Group'
      },
      storage: {
        name: '10086-icon-service-Storage-Accounts',
        category: 'storage',
        description: 'Storage Account'
      },
      loadBalancer: {
        name: '10062-icon-service-Load-Balancers',
        category: 'networking',
        description: 'Load Balancer'
      },
      keyVault: {
        name: '10245-icon-service-Key-Vaults',
        category: 'security',
        description: 'Key Vault'
      },
      monitor: {
        name: '00001-icon-service-Monitor',
        category: 'monitor',
        description: 'Monitor'
      },
      appGateway: {
        name: '10076-icon-service-Application-Gateways',
        category: 'networking',
        description: 'Application Gateway'
      }
    };

    // Generate icon URLs
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const iconUrls = Object.entries(azureIcons).reduce((acc, [key, icon]) => {
      acc[key] = baseUrl + '/api/azure-icons?icon=' + icon.name + '&category=' + icon.category;
      return acc;
    }, {} as Record<string, string>);

    const processingTime = Date.now() - startTime;

    console.log('[Generate Diagram with Icons API] Diagram generated successfully');

    return NextResponse.json({
      success: true,
      blueprint: plantUmlCode,
      azureIcons,
      iconUrls,
      processingTime,
      summary: {
        totalVMs: assessmentSummary.workloads.totalVMs,
        migrationStrategy: assessmentSummary.recommendations.migrationStrategy
      }
    }, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[Generate Diagram with Icons API] Error:', errorMessage);
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
