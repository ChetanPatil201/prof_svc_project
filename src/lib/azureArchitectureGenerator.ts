import type { AssessmentReportData } from '@/types/assessmentReport';
import type { Node, Edge } from 'reactflow';

export interface AzureArchitectureData {
  nodes: Node[];
  edges: Edge[];
}

export function generateAzureArchitecture(
  assessment: AssessmentReportData,
  layout: 'hub-spoke' | 'simple' | 'caf' = 'hub-spoke',
  options: {
    showNonProd?: boolean;
    includeObservability?: boolean;
    includeSecurity?: boolean;
  } = {}
): AzureArchitectureData {
  const { showNonProd = true, includeObservability = true, includeSecurity = true } = options;
  
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let nodeId = 0;
  let edgeId = 0;

  // Helper function to add node
  const addNode = (data: any, position: { x: number; y: number }, type: string = 'azureNode') => {
    const id = `node-${nodeId++}`;
    nodes.push({
      id,
      type,
      position,
      data,
    });
    return id;
  };

  // Helper function to add edge
  const addEdge = (source: string, target: string, data?: any) => {
    edges.push({
      id: `edge-${edgeId++}`,
      source,
      target,
      type: 'custom',
      data,
    });
  };

  if (layout === 'hub-spoke') {
    // Hub VNet
    const hubVnetId = addNode(
      { 
        type: 'vnet', 
        label: 'Hub VNet', 
        layer: 'Networking', 
        meta: { addressSpace: '10.0.0.0/16' },
        description: 'Central hub for shared services'
      },
      { x: 400, y: 200 },
      'groupNode'
    );

    // Spoke VNets
    const spoke1Id = addNode(
      { 
        type: 'vnet', 
        label: 'Spoke VNet 1', 
        layer: 'Networking', 
        meta: { addressSpace: '10.1.0.0/16' },
        description: 'Application tier'
      },
      { x: 200, y: 400 },
      'groupNode'
    );

    const spoke2Id = addNode(
      { 
        type: 'vnet', 
        label: 'Spoke VNet 2', 
        layer: 'Networking', 
        meta: { addressSpace: '10.2.0.0/16' },
        description: 'Data tier'
      },
      { x: 600, y: 400 },
      'groupNode'
    );

    // Azure Firewall
    const firewallId = addNode(
      { type: 'firewall', label: 'Azure Firewall', layer: 'Security' },
      { x: 400, y: 100 }
    );

    // Load Balancer
    const lbId = addNode(
      { type: 'lb', label: 'Load Balancer', layer: 'Networking' },
      { x: 400, y: 300 }
    );

    // Generate VMs based on assessment data
    const webVMs = assessment.vmSummary?.filter(vm => 
      vm.vmName?.toLowerCase().includes('web') || 
      vm.vmName?.toLowerCase().includes('frontend')
    ) || [];
    
    const appVMs = assessment.vmSummary?.filter(vm => 
      vm.vmName?.toLowerCase().includes('app') || 
      vm.vmName?.toLowerCase().includes('middleware')
    ) || [];
    
    const dbVMs = assessment.vmSummary?.filter(vm => 
      vm.vmName?.toLowerCase().includes('db') || 
      vm.vmName?.toLowerCase().includes('database')
    ) || [];

    // Add VMs to Spoke 1 (Web/App tier)
    let vmX = 150;
    webVMs.forEach((vm, index) => {
      const vmId = addNode(
        { 
          type: 'vm', 
          label: vm.vmName || `Web VM ${index + 1}`, 
          layer: 'Compute', 
          meta: { 
            sku: vm.recommendedSku, 
            tier: 'Web',
            osType: vm.osType,
            cores: vm.cores,
            memoryGB: vm.memoryGB
          } 
        },
        { x: vmX, y: 450 }
      );
      addEdge(lbId, vmId, { label: 'Load Balance' });
      vmX += 100;
    });

    appVMs.forEach((vm, index) => {
      const vmId = addNode(
        { 
          type: 'vm', 
          label: vm.vmName || `App VM ${index + 1}`, 
          layer: 'Compute', 
          meta: { 
            sku: vm.recommendedSku, 
            tier: 'App',
            osType: vm.osType,
            cores: vm.cores,
            memoryGB: vm.memoryGB
          } 
        },
        { x: vmX, y: 450 }
      );
      addEdge(lbId, vmId, { label: 'Load Balance' });
      vmX += 100;
    });

    // Add VMs to Spoke 2 (Database tier)
    vmX = 550;
    dbVMs.forEach((vm, index) => {
      const vmId = addNode(
        { 
          type: 'vm', 
          label: vm.vmName || `DB VM ${index + 1}`, 
          layer: 'Compute', 
          meta: { 
            sku: vm.recommendedSku, 
            tier: 'Database',
            osType: vm.osType,
            cores: vm.cores,
            memoryGB: vm.memoryGB
          } 
        },
        { x: vmX, y: 450 }
      );
      vmX += 100;
    });

          // Database services
      const sqlId = addNode(
        { 
          type: 'sql', 
          label: 'Azure SQL Database', 
          layer: 'Data', 
          meta: { tier: 'Business Critical' } 
        },
        { x: 650, y: 450 }
      );

      // Storage
      const storageId = addNode(
        { 
          type: 'storage', 
          label: 'Storage Account', 
          layer: 'Data',
          meta: { tier: 'Standard' }
        },
        { x: 650, y: 350 }
      );

      // Availability Set for high availability
      const availabilitySetId = addNode(
        { 
          type: 'availability-set', 
          label: 'Availability Set', 
          layer: 'Compute',
          meta: { tier: 'High Availability' }
        },
        { x: 400, y: 500 }
      );

    // Key Vault
    const kvId = addNode(
      { type: 'keyvault', label: 'Key Vault', layer: 'Security' },
      { x: 300, y: 100 }
    );

    // Monitoring
    if (includeObservability) {
      const monitorId = addNode(
        { type: 'monitor', label: 'Azure Monitor', layer: 'Observability' },
        { x: 500, y: 100 }
      );

      const logAnalyticsId = addNode(
        { type: 'loganalytics', label: 'Log Analytics', layer: 'Observability' },
        { x: 500, y: 150 }
      );

      addEdge(monitorId, logAnalyticsId, { label: 'Logs' });
      
      // Connect monitoring to all VMs
      nodes.forEach(node => {
        if (node.data?.type === 'vm') {
          addEdge(monitorId, node.id, { label: 'Monitor' });
        }
      });
    }

    // Security connections
    if (includeSecurity) {
      addEdge(firewallId, lbId, { label: 'Traffic', style: 'solid' });
      
      // Connect Key Vault to all VMs
      nodes.forEach(node => {
        if (node.data?.type === 'vm') {
          addEdge(kvId, node.id, { label: 'Secrets', style: 'dashed' });
        }
      });
    }

    // Network connections
    addEdge(hubVnetId, spoke1Id, { label: 'VNet Peering', style: 'dashed' });
    addEdge(hubVnetId, spoke2Id, { label: 'VNet Peering', style: 'dashed' });
    addEdge(lbId, vm1Id, { label: 'Load Balance' });
    addEdge(lbId, vm2Id, { label: 'Load Balance' });
    
    // Connect DB VMs to database services
    const dbVmNodes = nodes.filter(n => n.data?.type === 'vm' && n.data?.meta?.tier === 'Database');
    dbVmNodes.forEach(dbVmNode => {
      addEdge(dbVmNode.id, sqlId, { label: 'Database' });
      addEdge(dbVmNode.id, storageId, { label: 'Storage' });
    });
    
    // Availability Set connections
    addEdge(availabilitySetId, vm1Id, { label: 'HA Group', style: 'dashed' });
    addEdge(availabilitySetId, vm2Id, { label: 'HA Group', style: 'dashed' });

  } else if (layout === 'simple') {
    // Simple architecture
    const vnetId = addNode(
      { 
        type: 'vnet', 
        label: 'Virtual Network', 
        layer: 'Networking',
        description: 'Single VNet for all resources'
      },
      { x: 400, y: 200 },
      'groupNode'
    );

    // Add VMs based on assessment
    let vmX = 300;
    assessment.vmSummary?.forEach((vm, index) => {
      const vmId = addNode(
        { 
          type: 'vm', 
          label: vm.vmName || `VM ${index + 1}`, 
          layer: 'Compute', 
          meta: { 
            sku: vm.recommendedSku,
            osType: vm.osType,
            cores: vm.cores,
            memoryGB: vm.memoryGB
          } 
        },
        { x: vmX, y: 300 }
      );
      vmX += 100;
    });

    // Add database and storage
    const sqlId = addNode(
      { type: 'sql', label: 'Azure SQL', layer: 'Data' },
      { x: 500, y: 400 }
    );

    const storageId = addNode(
      { type: 'storage', label: 'Storage', layer: 'Data' },
      { x: 300, y: 400 }
    );

    // Connect VMs to services
    const vmNodes = nodes.filter(n => n.data?.type === 'vm');
    if (vmNodes.length > 0) {
      addEdge(vmNodes[0].id, storageId, { label: 'Files' });
      if (vmNodes.length > 1) {
        addEdge(vmNodes[vmNodes.length - 1].id, sqlId, { label: 'Database' });
      }
    }

  } else if (layout === 'caf') {
    // CAF Landing Zone architecture
    const managementGroupId = addNode(
      { 
        type: 'custom', 
        label: 'Management Group', 
        layer: 'Management',
        description: 'Enterprise governance'
      },
      { x: 400, y: 50 },
      'groupNode'
    );

    const identitySubId = addNode(
      { 
        type: 'custom', 
        label: 'Identity Subscription', 
        layer: 'Identity',
        description: 'Azure AD and identity services'
      },
      { x: 200, y: 150 },
      'groupNode'
    );

    const connectivitySubId = addNode(
      { 
        type: 'custom', 
        label: 'Connectivity Subscription', 
        layer: 'Connectivity',
        description: 'Network and security services'
      },
      { x: 400, y: 150 },
      'groupNode'
    );

    const landingZoneProdId = addNode(
      { 
        type: 'custom', 
        label: 'Landing Zone - Prod', 
        layer: 'Compute',
        description: 'Production workloads'
      },
      { x: 300, y: 250 },
      'groupNode'
    );

    const landingZoneNonProdId = addNode(
      { 
        type: 'custom', 
        label: 'Landing Zone - NonProd', 
        layer: 'Compute',
        description: 'Non-production workloads'
      },
      { x: 500, y: 250 },
      'groupNode'
    );

    // Add production VMs
    const prodVMs = assessment.vmSummary?.slice(0, Math.ceil(assessment.vmSummary.length / 2)) || [];
    let vmX = 250;
    prodVMs.forEach((vm, index) => {
      const vmId = addNode(
        { 
          type: 'vm', 
          label: vm.vmName || `Prod VM ${index + 1}`, 
          layer: 'Compute', 
          meta: { 
            sku: vm.recommendedSku,
            osType: vm.osType,
            cores: vm.cores,
            memoryGB: vm.memoryGB
          } 
        },
        { x: vmX, y: 350 }
      );
      vmX += 100;
    });

    // Add non-production VMs if enabled
    if (showNonProd) {
      const nonProdVMs = assessment.vmSummary?.slice(Math.ceil(assessment.vmSummary.length / 2)) || [];
      vmX = 450;
      nonProdVMs.forEach((vm, index) => {
        const vmId = addNode(
          { 
            type: 'vm', 
            label: vm.vmName || `NonProd VM ${index + 1}`, 
            layer: 'Compute', 
            meta: { 
              sku: vm.recommendedSku,
              osType: vm.osType,
              cores: vm.cores,
              memoryGB: vm.memoryGB
            } 
          },
          { x: vmX, y: 350 }
        );
        vmX += 100;
      });

      // Add non-prod storage
      const nonProdStorageId = addNode(
        { type: 'storage', label: 'NonProd Storage', layer: 'Data' },
        { x: 550, y: 350 }
      );
      
      // Connect non-prod VMs to storage
      const nonProdVmNodes = nodes.filter(n => n.data?.type === 'vm' && n.data?.label?.includes('NonProd'));
      nonProdVmNodes.forEach(vmNode => {
        addEdge(vmNode.id, nonProdStorageId, { label: 'Storage' });
      });
    }

    const firewallId = addNode(
      { type: 'firewall', label: 'Azure Firewall', layer: 'Security' },
      { x: 400, y: 200 }
    );

    // Governance connections
    addEdge(managementGroupId, identitySubId, { label: 'Governance', style: 'dashed' });
    addEdge(managementGroupId, connectivitySubId, { label: 'Governance', style: 'dashed' });
    addEdge(managementGroupId, landingZoneProdId, { label: 'Governance', style: 'dashed' });
    addEdge(managementGroupId, landingZoneNonProdId, { label: 'Governance', style: 'dashed' });
    addEdge(connectivitySubId, firewallId, { label: 'Deploy' });
    
    // Connect firewall to VMs
    nodes.forEach(node => {
      if (node.data?.type === 'vm') {
        addEdge(firewallId, node.id, { label: 'Traffic' });
      }
    });
  }

  return { nodes, edges };
}
