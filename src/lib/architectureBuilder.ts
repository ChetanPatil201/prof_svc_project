import type { AssessmentReportData } from '@/types/assessmentReport';
import type { ArchitectureModel, ArchNode, ArchEdge, ArchitectureOptions, AacLayer } from '@/types/architecture';
import type { DiagramOptions } from '@/types/diagramOptions';
import { DEFAULT_DIAGRAM_OPTIONS } from '@/types/diagramOptions';
import { generateUniqueId, generateGroupId, generateNodeId, ID_PREFIXES } from '@/types/architecture';
import { optimizeGraph } from './graphUtils';

export function buildArchitectureModel(
  assessment: AssessmentReportData, 
  options: ArchitectureOptions = {},
  diagramOptions: DiagramOptions = {}
): ArchitectureModel {
  const { layout = 'aac', includeOpenAI = false } = options;
  const diagramOpts = { ...DEFAULT_DIAGRAM_OPTIONS, ...diagramOptions };
  
  const nodes: ArchNode[] = [];
  const edges: ArchEdge[] = [];
  const existingIds = new Set<string>();
  
  // Determine if we need hub-spoke or single-spoke based on assessment size
  const isLargeAssessment = assessment.totalServers > 20;
  const useHubSpoke = isLargeAssessment || layout === 'aac';
  
  // Add Connectivity Layer
  addConnectivityLayer(nodes, edges, assessment, existingIds);
  
  // Add Networking Layer
  addNetworkingLayer(nodes, edges, assessment, useHubSpoke, existingIds);
  
  // Add Compute Layer
  addComputeLayer(nodes, edges, assessment, existingIds);
  
  // Add Data Layer
  addDataLayer(nodes, edges, assessment, existingIds);
  
  // Add Security Layer
  addSecurityLayer(nodes, edges, existingIds);
  
  // Add Identity Layer
  addIdentityLayer(nodes, edges, existingIds);
  
  // Add Management Layer
  addManagementLayer(nodes, edges, existingIds);
  
  // Add Observability Layer
  addObservabilityLayer(nodes, edges, existingIds);
  
  // Add AI Layer if requested
  if (includeOpenAI) {
    addAILayer(nodes, edges, existingIds);
  }
  
  return { nodes, edges };
}

function addConnectivityLayer(nodes: ArchNode[], edges: ArchEdge[], assessment: AssessmentReportData, existingIds: Set<string>) {
  // Determine ingress based on assessment characteristics
  const isGlobalWorkload = assessment.targetRegion?.includes('global') || assessment.totalServers > 50;
  
  if (isGlobalWorkload) {
    const frontdoorId = generateUniqueId(ID_PREFIXES.CONNECTIVITY, 'frontdoor', existingIds);
    nodes.push({
      id: frontdoorId,
      type: 'frontdoor',
      label: 'Azure Front Door',
      layer: 'Connectivity',
      meta: { global: true }
    });
    existingIds.add(frontdoorId);
  } else {
    const appgwId = generateUniqueId(ID_PREFIXES.CONNECTIVITY, 'appgw', existingIds);
    nodes.push({
      id: appgwId,
      type: 'appgw',
      label: 'Application Gateway',
      layer: 'Connectivity',
      meta: { regional: true }
    });
    existingIds.add(appgwId);
  }
  
  // Add Firewall if large assessment
  if (assessment.totalServers > 20) {
    const firewallId = generateUniqueId(ID_PREFIXES.CONNECTIVITY, 'firewall', existingIds);
    nodes.push({
      id: firewallId,
      type: 'firewall',
      label: 'Azure Firewall',
      layer: 'Connectivity'
    });
    existingIds.add(firewallId);
    
    // Find hub vnet to connect to
    const hubVnet = nodes.find(n => n.id.includes('hub-vnet'));
    if (hubVnet) {
      edges.push({ from: firewallId, to: hubVnet.id });
    }
  }
  
  // Add Bastion for secure access
  const bastionId = generateUniqueId(ID_PREFIXES.CONNECTIVITY, 'bastion', existingIds);
  nodes.push({
    id: bastionId,
    type: 'bastion',
    label: 'Azure Bastion',
    layer: 'Connectivity'
  });
  existingIds.add(bastionId);
}

function addNetworkingLayer(nodes: ArchNode[], edges: ArchEdge[], assessment: AssessmentReportData, useHubSpoke: boolean, existingIds: Set<string>) {
  if (useHubSpoke) {
    // Hub VNet
    const hubVnetId = generateUniqueId(ID_PREFIXES.NETWORKING, 'hub-vnet', existingIds);
    nodes.push({
      id: hubVnetId,
      type: 'vnet',
      label: 'Hub VNet',
      layer: 'Networking',
      meta: { type: 'hub' }
    });
    existingIds.add(hubVnetId);
    
    // Spoke VNet
    const spokeVnetId = generateUniqueId(ID_PREFIXES.NETWORKING, 'spoke-vnet', existingIds);
    nodes.push({
      id: spokeVnetId,
      type: 'vnet',
      label: 'Spoke VNet',
      layer: 'Networking',
      meta: { type: 'spoke' }
    });
    existingIds.add(spokeVnetId);
    
    edges.push({ from: hubVnetId, to: spokeVnetId, label: 'VNet Peering' });
  } else {
    // Single VNet
    const mainVnetId = generateUniqueId(ID_PREFIXES.NETWORKING, 'main-vnet', existingIds);
    nodes.push({
      id: mainVnetId,
      type: 'vnet',
      label: 'Main VNet',
      layer: 'Networking'
    });
    existingIds.add(mainVnetId);
  }
  
  const vnetId = useHubSpoke ? nodes.find(n => n.id.includes('spoke-vnet'))?.id : nodes.find(n => n.id.includes('main-vnet'))?.id;
  
  if (!vnetId) return;
  
  // Add subnets
  const subnets = [
    { baseId: 'web-subnet', label: 'Web Subnet', layer: 'Networking' as AacLayer },
    { baseId: 'app-subnet', label: 'App Subnet', layer: 'Networking' as AacLayer },
    { baseId: 'db-subnet', label: 'DB Subnet', layer: 'Networking' as AacLayer }
  ];
  
  subnets.forEach(subnet => {
    const subnetId = generateUniqueId(ID_PREFIXES.NETWORKING, subnet.baseId, existingIds);
    nodes.push({
      id: subnetId,
      type: 'subnet',
      label: subnet.label,
      layer: subnet.layer,
      group: vnetId
    });
    existingIds.add(subnetId);
    
    edges.push({ from: vnetId, to: subnetId });
  });
  
  // Add NSGs for each subnet
  subnets.forEach(subnet => {
    const nsgId = generateUniqueId(ID_PREFIXES.NETWORKING, `${subnet.baseId}-nsg`, existingIds);
    const subnetNode = nodes.find(n => n.id.includes(subnet.baseId));
    if (subnetNode) {
      nodes.push({
        id: nsgId,
        type: 'nsg',
        label: `${subnet.label} NSG`,
        layer: 'Networking'
      });
      existingIds.add(nsgId);
      
      edges.push({ from: nsgId, to: subnetNode.id });
    }
  });
  
  // Add Load Balancer if multiple VMs
  if (assessment.totalServers > 5) {
    const lbId = generateUniqueId(ID_PREFIXES.NETWORKING, 'lb', existingIds);
    nodes.push({
      id: lbId,
      type: 'lb',
      label: 'Load Balancer',
      layer: 'Networking'
    });
    existingIds.add(lbId);
    
    const webSubnet = nodes.find(n => n.id.includes('web-subnet'));
    if (webSubnet) {
      edges.push({ from: lbId, to: webSubnet.id });
    }
  }
}

function addComputeLayer(nodes: ArchNode[], edges: ArchEdge[], assessment: AssessmentReportData, existingIds: Set<string>) {
  if (!assessment.vmSummary || assessment.vmSummary.length === 0) {
    // Add placeholder VM if no assessment data
    const vmPlaceholderId = generateUniqueId(ID_PREFIXES.COMPUTE, 'vm-placeholder', existingIds);
    nodes.push({
      id: vmPlaceholderId,
      type: 'vm',
      label: 'VM (Placeholder)',
      layer: 'Compute',
      meta: { placeholder: true }
    });
    existingIds.add(vmPlaceholderId);
    
    const webSubnet = nodes.find(n => n.id.includes('web-subnet'));
    if (webSubnet) {
      edges.push({ from: webSubnet.id, to: vmPlaceholderId });
    }
    return;
  }
  
  // Group VMs by role/type for better organization
  const vmGroups = groupVMsByRole(assessment.vmSummary);
  
  Object.entries(vmGroups).forEach(([role, vms], groupIndex) => {
    const groupId = generateGroupId('Compute');
    
    vms.forEach((vm, vmIndex) => {
      const vmId = generateNodeId('Compute', `vm-${role}-${vmIndex}`);
      const vmLabel = `${vm.vmName || `VM-${vmIndex + 1}`} (${vm.recommendedSize || 'Standard_D2s_v5'})`;
      
      nodes.push({
        id: vmId,
        type: 'vm',
        label: vmLabel,
        layer: 'Compute',
        group: groupId,
        meta: {
          role,
          cores: vm.cores,
          memoryGB: vm.memoryGB,
          recommendedSize: vm.recommendedSize,
          operatingSystem: vm.operatingSystem
        }
      });
      
      // Connect to appropriate subnet based on role
      const subnetId = getSubnetForRole(role);
      const subnetNode = nodes.find(n => n.id.includes(subnetId));
      if (subnetNode) {
        edges.push({ from: subnetNode.id, to: vmId });
      }
    });
  });
}

function addDataLayer(nodes: ArchNode[], edges: ArchEdge[], assessment: AssessmentReportData, existingIds: Set<string>) {
  // Add Storage Account
  const storageId = generateUniqueId(ID_PREFIXES.DATA, 'storage', existingIds);
  nodes.push({
    id: storageId,
    type: 'storage',
    label: 'Storage Account',
    layer: 'Data',
    meta: { type: 'general-purpose' }
  });
  existingIds.add(storageId);
  
  // Add SQL Database if there are database workloads
  const hasDatabaseWorkloads = assessment.vmSummary?.some(vm => 
    vm.vmName?.toLowerCase().includes('db') || 
    vm.vmName?.toLowerCase().includes('sql') ||
    vm.vmName?.toLowerCase().includes('database')
  );
  
  if (hasDatabaseWorkloads || assessment.totalServers > 10) {
    const sqlDbId = generateUniqueId(ID_PREFIXES.DATA, 'sql-db', existingIds);
    nodes.push({
      id: sqlDbId,
      type: 'sql',
      label: 'Azure SQL Database',
      layer: 'Data',
      meta: { type: 'managed' }
    });
    existingIds.add(sqlDbId);
    
    const dbSubnet = nodes.find(n => n.id.includes('db-subnet'));
    if (dbSubnet) {
      edges.push({ from: dbSubnet.id, to: sqlDbId });
    }
  }
  
  // Connect storage to compute
  const appSubnet = nodes.find(n => n.id.includes('app-subnet'));
  if (appSubnet) {
    edges.push({ from: appSubnet.id, to: storageId });
  }
}

function addSecurityLayer(nodes: ArchNode[], edges: ArchEdge[], existingIds: Set<string>) {
  // Add Key Vault
  const keyvaultId = generateUniqueId(ID_PREFIXES.SECURITY, 'keyvault', existingIds);
  nodes.push({
    id: keyvaultId,
    type: 'keyvault',
    label: 'Key Vault',
    layer: 'Security'
  });
  existingIds.add(keyvaultId);
  
  // Add Defender for Cloud
  const defenderId = generateUniqueId(ID_PREFIXES.SECURITY, 'defender', existingIds);
  nodes.push({
    id: defenderId,
    type: 'defender',
    label: 'Defender for Cloud',
    layer: 'Security'
  });
  existingIds.add(defenderId);
  
  // Connect security components to all layers
  const networkNodes = nodes.filter(node => node.layer === 'Networking');
  networkNodes.forEach(node => {
    edges.push({ from: keyvaultId, to: node.id });
    edges.push({ from: defenderId, to: node.id });
  });
}

function addIdentityLayer(nodes: ArchNode[], edges: ArchEdge[], existingIds: Set<string>) {
  const identityId = generateUniqueId(ID_PREFIXES.IDENTITY, 'identity', existingIds);
  nodes.push({
    id: identityId,
    type: 'custom',
    label: 'Azure AD',
    layer: 'Identity'
  });
  existingIds.add(identityId);
  
  // Connect identity to all compute resources
  const computeNodes = nodes.filter(node => node.layer === 'Compute');
  computeNodes.forEach(node => {
    edges.push({ from: identityId, to: node.id });
  });
}

function addManagementLayer(nodes: ArchNode[], edges: ArchEdge[], existingIds: Set<string>) {
  const policyId = generateUniqueId(ID_PREFIXES.MANAGEMENT, 'policy', existingIds);
  nodes.push({
    id: policyId,
    type: 'custom',
    label: 'Azure Policy',
    layer: 'Management'
  });
  existingIds.add(policyId);
  
  // Connect policy to all resources
  const resourceNodes = nodes.filter(node => 
    node.layer === 'Compute' || node.layer === 'Data' || node.layer === 'Networking'
  );
  resourceNodes.forEach(node => {
    edges.push({ from: policyId, to: node.id });
  });
}

function addObservabilityLayer(nodes: ArchNode[], edges: ArchEdge[], existingIds: Set<string>) {
  // Add Azure Monitor
  const monitorId = generateUniqueId(ID_PREFIXES.OBSERVABILITY, 'monitor', existingIds);
  nodes.push({
    id: monitorId,
    type: 'monitor',
    label: 'Azure Monitor',
    layer: 'Observability'
  });
  existingIds.add(monitorId);
  
  // Add Log Analytics
  const loganalyticsId = generateUniqueId(ID_PREFIXES.OBSERVABILITY, 'loganalytics', existingIds);
  nodes.push({
    id: loganalyticsId,
    type: 'loganalytics',
    label: 'Log Analytics',
    layer: 'Observability'
  });
  existingIds.add(loganalyticsId);
  
  // Connect observability to all resources
  const resourceNodes = nodes.filter(node => 
    node.layer === 'Compute' || node.layer === 'Data' || node.layer === 'Networking'
  );
  resourceNodes.forEach(node => {
    edges.push({ from: monitorId, to: node.id });
    edges.push({ from: loganalyticsId, to: node.id });
  });
}

function addAILayer(nodes: ArchNode[], edges: ArchEdge[], existingIds: Set<string>) {
  // Add Azure OpenAI
  const openaiId = generateUniqueId(ID_PREFIXES.AI, 'openai', existingIds);
  nodes.push({
    id: openaiId,
    type: 'openai',
    label: 'Azure OpenAI',
    layer: 'Compute'
  });
  existingIds.add(openaiId);
  
  // Add Azure Cognitive Search
  const searchId = generateUniqueId(ID_PREFIXES.AI, 'search', existingIds);
  nodes.push({
    id: searchId,
    type: 'search',
    label: 'Azure Cognitive Search',
    layer: 'Compute'
  });
  existingIds.add(searchId);
  
  // Connect AI services to app subnet
  const appSubnet = nodes.find(n => n.id.includes('app-subnet'));
  if (appSubnet) {
    edges.push({ from: appSubnet.id, to: openaiId });
    edges.push({ from: appSubnet.id, to: searchId });
  }
}

function groupVMsByRole(vmSummary: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  
  vmSummary.forEach(vm => {
    const vmName = vm.vmName || '';
    let role = 'general';
    
    // Determine role based on VM name or characteristics
    if (vmName.toLowerCase().includes('web') || vmName.toLowerCase().includes('frontend')) {
      role = 'web';
    } else if (vmName.toLowerCase().includes('app') || vmName.toLowerCase().includes('middleware')) {
      role = 'app';
    } else if (vmName.toLowerCase().includes('db') || vmName.toLowerCase().includes('sql') || vmName.toLowerCase().includes('database')) {
      role = 'database';
    } else if (vmName.toLowerCase().includes('file') || vmName.toLowerCase().includes('storage')) {
      role = 'storage';
    }
    
    if (!groups[role]) {
      groups[role] = [];
    }
    groups[role].push(vm);
  });
  
  return groups;
}

function getSubnetForRole(role: string): string {
  switch (role) {
    case 'web':
      return 'web-subnet';
    case 'app':
      return 'app-subnet';
    case 'database':
    case 'db':
      return 'db-subnet';
    default:
      return 'app-subnet';
  }
}

// New function to build architecture model specifically from assessment data
export function buildArchitectureModelFromAssessment(
  assessment: AssessmentReportData, 
  diagramOptions: DiagramOptions = {}
): ArchitectureModel {


  const nodes: ArchNode[] = [];
  const edges: ArchEdge[] = [];
  const existingIds = new Set<string>();
  const diagramOpts = { ...DEFAULT_DIAGRAM_OPTIONS, ...diagramOptions };
  
  // Determine architecture complexity based on assessment
  const isLargeAssessment = assessment.totalServers > 20;
  const useHubSpoke = isLargeAssessment;
  
  // Add Connectivity Layer
  addConnectivityLayerFromAssessment(nodes, edges, assessment, existingIds);
  
  // Add Networking Layer
  addNetworkingLayerFromAssessment(nodes, edges, assessment, useHubSpoke, existingIds, diagramOpts);
  
  // Add Compute Layer with actual VM data
  addComputeLayerFromAssessment(nodes, edges, assessment, existingIds, diagramOpts);
  
  // Add Data Layer with actual storage requirements
  addDataLayerFromAssessment(nodes, edges, assessment, existingIds);
  
  // Add Security Layer
  addSecurityLayerFromAssessment(nodes, edges, assessment, existingIds, diagramOpts);
  
  // Add Identity Layer
  addIdentityLayerFromAssessment(nodes, edges, assessment, existingIds);
  
  // Add Management Layer
  addManagementLayerFromAssessment(nodes, edges, assessment, existingIds, diagramOpts);
  
  // Add Observability Layer
  addObservabilityLayerFromAssessment(nodes, edges, assessment, existingIds, diagramOpts);
  

  
  return { nodes, edges };
}

function addConnectivityLayerFromAssessment(nodes: ArchNode[], edges: ArchEdge[], assessment: AssessmentReportData, existingIds: Set<string>) {
  // Determine ingress based on assessment characteristics
  const isGlobalWorkload = assessment.targetRegion?.includes('global') || assessment.totalServers > 50;
  
  if (isGlobalWorkload) {
    const frontdoorId = generateUniqueId(ID_PREFIXES.CONNECTIVITY, 'frontdoor', existingIds);
    nodes.push({
      id: frontdoorId,
      type: 'frontdoor',
      label: 'Azure Front Door',
      layer: 'Connectivity',
      meta: { global: true, region: assessment.targetRegion }
    });
    existingIds.add(frontdoorId);
  } else {
    const appgwId = generateUniqueId(ID_PREFIXES.CONNECTIVITY, 'appgw', existingIds);
    nodes.push({
      id: appgwId,
      type: 'appgw',
      label: 'Application Gateway',
      layer: 'Connectivity',
      meta: { regional: true, region: assessment.targetRegion }
    });
    existingIds.add(appgwId);
  }
  
  // Add Firewall if large assessment or if there are security requirements
  if (assessment.totalServers > 20 || assessment.totalServers > 10) {
    const firewallId = generateUniqueId(ID_PREFIXES.CONNECTIVITY, 'firewall', existingIds);
    nodes.push({
      id: firewallId,
      type: 'firewall',
      label: 'Azure Firewall',
      layer: 'Connectivity',
      meta: { region: assessment.targetRegion }
    });
    existingIds.add(firewallId);
    
    if (nodes.some(n => n.id.includes('hub-vnet'))) {
      const hubVnet = nodes.find(n => n.id.includes('hub-vnet'));
      if (hubVnet) {
        edges.push({ from: firewallId, to: hubVnet.id });
      }
    }
  }
  
  // Add Bastion for secure access
  const bastionId = generateUniqueId(ID_PREFIXES.CONNECTIVITY, 'bastion', existingIds);
  nodes.push({
    id: bastionId,
    type: 'bastion',
    label: 'Azure Bastion',
    layer: 'Connectivity',
    meta: { region: assessment.targetRegion }
  });
  existingIds.add(bastionId);
}

function addNetworkingLayerFromAssessment(nodes: ArchNode[], edges: ArchEdge[], assessment: AssessmentReportData, useHubSpoke: boolean, existingIds: Set<string>, diagramOpts: Required<DiagramOptions>) {
  if (useHubSpoke) {
    const hubVnetId = generateUniqueId(ID_PREFIXES.NETWORKING, 'hub-vnet', existingIds);
    nodes.push({
      id: hubVnetId,
      type: 'vnet',
      label: `Hub VNet (${assessment.targetRegion || 'East US'})`,
      layer: 'Networking',
      meta: { type: 'hub', region: assessment.targetRegion }
    });
    existingIds.add(hubVnetId);
    
    const spokeVnetId = generateUniqueId(ID_PREFIXES.NETWORKING, 'spoke-vnet', existingIds);
    nodes.push({
      id: spokeVnetId,
      type: 'vnet',
      label: `Spoke VNet (${assessment.targetRegion || 'East US'})`,
      layer: 'Networking',
      meta: { type: 'spoke', region: assessment.targetRegion }
    });
    existingIds.add(spokeVnetId);
    
    edges.push({ from: hubVnetId, to: spokeVnetId, label: 'VNet Peering' });
  } else {
    const mainVnetId = generateUniqueId(ID_PREFIXES.NETWORKING, 'main-vnet', existingIds);
    nodes.push({
      id: mainVnetId,
      type: 'vnet',
      label: `Main VNet (${assessment.targetRegion || 'East US'})`,
      layer: 'Networking',
      meta: { region: assessment.targetRegion }
    });
    existingIds.add(mainVnetId);
  }
  
  const vnetId = useHubSpoke ? nodes.find(n => n.id.includes('spoke-vnet'))?.id : nodes.find(n => n.id.includes('main-vnet'))?.id;
  
  if (!vnetId) return;
  
  // Add subnets based on VM distribution
  const subnets = [
    { baseId: 'web-subnet', label: 'Web Subnet', layer: 'Networking' as AacLayer },
    { baseId: 'app-subnet', label: 'App Subnet', layer: 'Networking' as AacLayer },
    { baseId: 'db-subnet', label: 'DB Subnet', layer: 'Networking' as AacLayer }
  ];
  
  subnets.forEach(subnet => {
    const subnetId = generateUniqueId(ID_PREFIXES.NETWORKING, subnet.baseId, existingIds);
    nodes.push({
      id: subnetId,
      type: 'subnet',
      label: subnet.label,
      layer: subnet.layer,
      group: vnetId,
      meta: { region: assessment.targetRegion }
    });
    existingIds.add(subnetId);
    
    edges.push({ from: vnetId, to: subnetId });
    
    // Add subnet hub if networking aggregation is enabled
    if (diagramOpts.aggregateNetworking) {
      const subnetHubId = generateUniqueId(`hub_net_${subnet.baseId}`, 'hub', existingIds);
      nodes.push({
        id: subnetHubId,
        type: 'custom',
        label: `${subnet.label} Hub`,
        layer: 'Networking',
        meta: { region: assessment.targetRegion, isHub: true, hubType: 'subnet', subnet: subnet.baseId }
      });
      existingIds.add(subnetHubId);
      
      // Connect subnet hub to subnet
      edges.push({ from: subnetHubId, to: subnetId });
    }
  });
  
  // Add NSGs for each subnet (only if not in minimal detail level)
  if (diagramOpts.detailLevel !== 'minimal') {
    subnets.forEach(subnet => {
      const nsgId = generateUniqueId(ID_PREFIXES.NETWORKING, `${subnet.baseId}-nsg`, existingIds);
      nodes.push({
        id: nsgId,
        type: 'nsg',
        label: `${subnet.label} NSG`,
        layer: 'Networking',
        meta: { region: assessment.targetRegion }
      });
      existingIds.add(nsgId);
      
      const subnetNode = nodes.find(n => n.id.includes(subnet.baseId));
      if (subnetNode) {
        edges.push({ from: nsgId, to: subnetNode.id });
      }
    });
  }
  
  // Add Load Balancer if multiple VMs
  if (assessment.totalServers > 5) {
    const lbId = generateUniqueId(ID_PREFIXES.NETWORKING, 'lb', existingIds);
    nodes.push({
      id: lbId,
      type: 'lb',
      label: 'Load Balancer',
      layer: 'Networking',
      meta: { region: assessment.targetRegion }
    });
    existingIds.add(lbId);
    
    const webSubnet = nodes.find(n => n.id.includes('web-subnet'));
    if (webSubnet) {
      edges.push({ from: lbId, to: webSubnet.id });
    }
  }
}

function addComputeLayerFromAssessment(nodes: ArchNode[], edges: ArchEdge[], assessment: AssessmentReportData, existingIds: Set<string>, diagramOpts?: Required<DiagramOptions>) {
  if (!assessment.vmSummary || assessment.vmSummary.length === 0) {
    console.warn('⚠️ [ArchitectureBuilder] No VM summary data available');
    const vmPlaceholderId = generateUniqueId(ID_PREFIXES.COMPUTE, 'vm-placeholder', existingIds);
    nodes.push({
      id: vmPlaceholderId,
      type: 'vm',
      label: 'VM (No Assessment Data)',
      layer: 'Compute',
      meta: { placeholder: true }
    });
    existingIds.add(vmPlaceholderId);
    
    const webSubnet = nodes.find(n => n.id.includes('web-subnet'));
    if (webSubnet) {
      edges.push({ from: webSubnet.id, to: vmPlaceholderId });
    }
    return;
  }
  

  
  // Group VMs by role/type for better organization
  const vmGroups = groupVMsByRoleFromAssessment(assessment.vmSummary);
  
  Object.entries(vmGroups).forEach(([role, vms], groupIndex) => {
    const groupId = generateGroupId('Compute');
    
    vms.forEach((vm, vmIndex) => {
      const vmId = generateNodeId('Compute', `vm-${role}-${vmIndex}`);
      const vmLabel = `${vm.vmName || `VM-${vmIndex + 1}`} (${vm.recommendedSize || 'Standard_D2s_v5'})`;
      
      nodes.push({
        id: vmId,
        type: 'vm',
        label: vmLabel,
        layer: 'Compute',
        group: groupId,
        meta: {
          role,
          cores: vm.cores,
          memoryGB: vm.memoryGB,
          recommendedSize: vm.recommendedSize,
          operatingSystem: vm.operatingSystem,
          region: assessment.targetRegion,
          readiness: vm.readiness,
          inScope: vm.inScope
        }
      });
      existingIds.add(vmId);
      
      // Connect to appropriate subnet based on role
      const subnetId = getSubnetForRoleFromAssessment(role);
      const subnetNode = nodes.find(n => n.id.includes(subnetId));
      
      if (subnetNode) {
        if (diagramOpts?.aggregateNetworking) {
          // Route through subnet hub if networking aggregation is enabled
          const subnetHubNode = nodes.find(n => 
            n.meta?.isHub && n.meta?.hubType === 'subnet' && n.meta?.subnet === subnetId
          );
          if (subnetHubNode) {
            edges.push({ from: subnetHubNode.id, to: vmId });
          } else {
            // Fallback to direct connection if hub not found
            edges.push({ from: subnetNode.id, to: vmId });
          }
        } else {
          // Direct connection to subnet
          edges.push({ from: subnetNode.id, to: vmId });
        }
      }
    });
  });
}

function addDataLayerFromAssessment(nodes: ArchNode[], edges: ArchEdge[], assessment: AssessmentReportData, existingIds: Set<string>) {
  // Add Storage Account with actual storage requirements
  const totalStorageGB = assessment.totalStorageTB * 1024;
  const storageId = generateUniqueId(ID_PREFIXES.DATA, 'storage', existingIds);
  nodes.push({
    id: storageId,
    type: 'storage',
            label: `Storage Account (${typeof totalStorageGB === 'number' ? totalStorageGB.toFixed(0) : '0'} GB)`,
    layer: 'Data',
    meta: { 
      type: 'general-purpose',
      totalStorageGB,
      region: assessment.targetRegion
    }
  });
  existingIds.add(storageId);
  
  // Add SQL Database if there are database workloads
  const hasDatabaseWorkloads = assessment.vmSummary?.some(vm => 
    vm.vmName?.toLowerCase().includes('db') || 
    vm.vmName?.toLowerCase().includes('sql') ||
    vm.vmName?.toLowerCase().includes('database')
  );
  
  if (hasDatabaseWorkloads || assessment.totalServers > 10) {
    const sqlDbId = generateUniqueId(ID_PREFIXES.DATA, 'sql-db', existingIds);
    nodes.push({
      id: sqlDbId,
      type: 'sql',
      label: 'Azure SQL Database',
      layer: 'Data',
      meta: { 
        type: 'managed',
        region: assessment.targetRegion
      }
    });
    existingIds.add(sqlDbId);
    
    const dbSubnet = nodes.find(n => n.id.includes('db-subnet'));
    if (dbSubnet) {
      edges.push({ from: dbSubnet.id, to: sqlDbId });
    }
  }
  
  // Connect storage to compute
  const appSubnet = nodes.find(n => n.id.includes('app-subnet'));
  if (appSubnet) {
    edges.push({ from: appSubnet.id, to: storageId });
  }
}

function addSecurityLayerFromAssessment(nodes: ArchNode[], edges: ArchEdge[], assessment: AssessmentReportData, existingIds: Set<string>, diagramOpts: Required<DiagramOptions>) {
  // Handle different detail levels
  if (diagramOpts.detailLevel === 'minimal') {
    // Create a single Security hub for minimal view
    const securityHubId = generateUniqueId('hub_sec', 'security', existingIds);
    nodes.push({
      id: securityHubId,
      type: 'custom',
      label: 'Security',
      layer: 'Security',
      meta: { region: assessment.targetRegion, isHub: true, hubType: 'security' }
    });
    existingIds.add(securityHubId);
    
    // Connect security hub to all layers
    const resourceNodes = nodes.filter(node => 
      node.layer === 'Compute' || node.layer === 'Data' || node.layer === 'Networking'
    );
    resourceNodes.forEach(node => {
      edges.push({ from: securityHubId, to: node.id });
    });
  } else {
    // Standard or detailed view - create individual security components
    const keyvaultId = generateUniqueId(ID_PREFIXES.SECURITY, 'keyvault', existingIds);
    nodes.push({
      id: keyvaultId,
      type: 'keyvault',
      label: 'Key Vault',
      layer: 'Security',
      meta: { region: assessment.targetRegion }
    });
    existingIds.add(keyvaultId);
    
    const defenderId = generateUniqueId(ID_PREFIXES.SECURITY, 'defender', existingIds);
    nodes.push({
      id: defenderId,
      type: 'defender',
      label: 'Defender for Cloud',
      layer: 'Security',
      meta: { region: assessment.targetRegion }
    });
    existingIds.add(defenderId);
    
    // Add Policy for standard/detailed views
    const policyId = generateUniqueId(ID_PREFIXES.SECURITY, 'policy', existingIds);
    nodes.push({
      id: policyId,
      type: 'custom',
      label: 'Azure Policy',
      layer: 'Security',
      meta: { region: assessment.targetRegion }
    });
    existingIds.add(policyId);
    
    if (diagramOpts.aggregateSecurity) {
      // Create security hub and route through it
      const securityHubId = generateUniqueId('hub_sec', 'security', existingIds);
      nodes.push({
        id: securityHubId,
        type: 'custom',
        label: 'Security Hub',
        layer: 'Security',
        meta: { region: assessment.targetRegion, isHub: true, hubType: 'security' }
      });
      existingIds.add(securityHubId);
      
      // Connect individual security components to hub
      edges.push({ from: keyvaultId, to: securityHubId });
      edges.push({ from: defenderId, to: securityHubId });
      edges.push({ from: policyId, to: securityHubId });
      
      // Connect hub to all resources
      const resourceNodes = nodes.filter(node => 
        node.layer === 'Compute' || node.layer === 'Data' || node.layer === 'Networking'
      );
      resourceNodes.forEach(node => {
        edges.push({ from: securityHubId, to: node.id });
      });
    } else {
      // Direct connections (for detailed view when not aggregating)
      const resourceNodes = nodes.filter(node => 
        node.layer === 'Compute' || node.layer === 'Data' || node.layer === 'Networking'
      );
      resourceNodes.forEach(node => {
        edges.push({ from: keyvaultId, to: node.id });
        edges.push({ from: defenderId, to: node.id });
        edges.push({ from: policyId, to: node.id });
      });
    }
  }
}

function addIdentityLayerFromAssessment(nodes: ArchNode[], edges: ArchEdge[], assessment: AssessmentReportData, existingIds: Set<string>) {
  const identityId = generateUniqueId(ID_PREFIXES.IDENTITY, 'identity', existingIds);
  nodes.push({
    id: identityId,
    type: 'custom',
    label: 'Azure AD',
    layer: 'Identity',
    meta: { region: 'global' }
  });
  existingIds.add(identityId);
  
  // Connect identity to all compute resources
  const computeNodes = nodes.filter(node => node.layer === 'Compute');
  computeNodes.forEach(node => {
    edges.push({ from: identityId, to: node.id });
  });
}

function addManagementLayerFromAssessment(nodes: ArchNode[], edges: ArchEdge[], assessment: AssessmentReportData, existingIds: Set<string>, diagramOpts: Required<DiagramOptions>) {
  const policyId = generateUniqueId(ID_PREFIXES.MANAGEMENT, 'policy', existingIds);
  nodes.push({
    id: policyId,
    type: 'custom',
    label: 'Azure Policy',
    layer: 'Management',
    meta: { region: assessment.targetRegion }
  });
  existingIds.add(policyId);
  
  // Connect policy to all resources
  const resourceNodes = nodes.filter(node => 
    node.layer === 'Compute' || node.layer === 'Data' || node.layer === 'Networking'
  );
  resourceNodes.forEach(node => {
    edges.push({ from: policyId, to: node.id });
  });
}

function addObservabilityLayerFromAssessment(nodes: ArchNode[], edges: ArchEdge[], assessment: AssessmentReportData, existingIds: Set<string>, diagramOpts: Required<DiagramOptions>) {
  // Handle different detail levels
  if (diagramOpts.detailLevel === 'minimal') {
    // Create a single Observability hub for minimal view
    const observabilityHubId = generateUniqueId('hub_obs', 'observability', existingIds);
    nodes.push({
      id: observabilityHubId,
      type: 'custom',
      label: 'Observability',
      layer: 'Observability',
      meta: { region: assessment.targetRegion, isHub: true, hubType: 'observability' }
    });
    existingIds.add(observabilityHubId);
    
    // Connect observability hub to all resources
    const resourceNodes = nodes.filter(node => 
      node.layer === 'Compute' || node.layer === 'Data' || node.layer === 'Networking'
    );
    resourceNodes.forEach(node => {
      edges.push({ from: observabilityHubId, to: node.id });
    });
  } else {
    // Standard or detailed view - create individual observability components
    const monitorId = generateUniqueId(ID_PREFIXES.OBSERVABILITY, 'monitor', existingIds);
    nodes.push({
      id: monitorId,
      type: 'monitor',
      label: 'Azure Monitor',
      layer: 'Observability',
      meta: { region: assessment.targetRegion }
    });
    existingIds.add(monitorId);
    
    const loganalyticsId = generateUniqueId(ID_PREFIXES.OBSERVABILITY, 'loganalytics', existingIds);
    nodes.push({
      id: loganalyticsId,
      type: 'loganalytics',
      label: 'Log Analytics',
      layer: 'Observability',
      meta: { region: assessment.targetRegion }
    });
    existingIds.add(loganalyticsId);
    
    if (diagramOpts.aggregateObservability) {
      // Create observability hub and route through it
      const observabilityHubId = generateUniqueId('hub_obs', 'observability', existingIds);
      nodes.push({
        id: observabilityHubId,
        type: 'custom',
        label: 'Observability Hub',
        layer: 'Observability',
        meta: { region: assessment.targetRegion, isHub: true, hubType: 'observability' }
      });
      existingIds.add(observabilityHubId);
      
      // Connect individual observability components to hub
      edges.push({ from: monitorId, to: observabilityHubId });
      edges.push({ from: loganalyticsId, to: observabilityHubId });
      
      // Connect hub to all resources
      const resourceNodes = nodes.filter(node => 
        node.layer === 'Compute' || node.layer === 'Data' || node.layer === 'Networking'
      );
      resourceNodes.forEach(node => {
        edges.push({ from: observabilityHubId, to: node.id });
      });
    } else {
      // Direct connections (for detailed view when not aggregating)
      const resourceNodes = nodes.filter(node => 
        node.layer === 'Compute' || node.layer === 'Data' || node.layer === 'Networking'
      );
      resourceNodes.forEach(node => {
        edges.push({ from: monitorId, to: node.id });
        edges.push({ from: loganalyticsId, to: node.id });
      });
    }
  }
}

function groupVMsByRoleFromAssessment(vmSummary: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  
  vmSummary.forEach(vm => {
    const vmName = vm.vmName || '';
    let role = 'general';
    
    // Determine role based on VM name or characteristics
    if (vmName.toLowerCase().includes('web') || vmName.toLowerCase().includes('frontend')) {
      role = 'web';
    } else if (vmName.toLowerCase().includes('app') || vmName.toLowerCase().includes('middleware')) {
      role = 'app';
    } else if (vmName.toLowerCase().includes('db') || vmName.toLowerCase().includes('sql') || vmName.toLowerCase().includes('database')) {
      role = 'database';
    } else if (vmName.toLowerCase().includes('file') || vmName.toLowerCase().includes('storage')) {
      role = 'storage';
    }
    
    if (!groups[role]) {
      groups[role] = [];
    }
    groups[role].push(vm);
  });
  
  return groups;
}

function getSubnetForRoleFromAssessment(role: string): string {
  switch (role) {
    case 'web':
      return 'web-subnet';
    case 'app':
      return 'app-subnet';
    case 'database':
    case 'db':
      return 'db-subnet';
    default:
      return 'app-subnet';
  }
}

// Enhanced function that builds and optimizes the architecture model
export function buildOptimizedArchitectureModelFromAssessment(
  assessment: AssessmentReportData, 
  diagramOptions: DiagramOptions = {}
): ArchitectureModel {
  // Build the base architecture model
  const baseModel = buildArchitectureModelFromAssessment(assessment, diagramOptions);
  
  // Apply optimizations based on diagram options
  const optimizedModel = optimizeGraph(baseModel, diagramOptions);
  

  
  return optimizedModel;
} 