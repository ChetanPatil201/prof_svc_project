export type AacLayer = 'Connectivity' | 'Identity' | 'Management' | 'Security' | 'Networking' | 'Compute' | 'Data' | 'Observability' | 'DevOps';

export type NodeType = 'frontdoor' | 'appgw' | 'firewall' | 'bastion' | 'lb' | 'vnet' | 'subnet' | 'nsg' | 'vm' | 'vmss' | 'sql' | 'storage' | 'kv' | 'monitor' | 'loganalytics' | 'defender' | 'keyvault' | 'openai' | 'search' | 'custom';

// CAF Entity Types for containers and grouping
export type EntityType = 'managementGroup' | 'subscription' | 'vnet' | 'subnet' | 'tier' | 'service' | 'paas' | 'resourceGroup';

// CAF Subscription Types
export type SubscriptionType = 'platform-identity' | 'platform-management' | 'platform-connectivity' | 'landingzone-prod' | 'landingzone-nonprod' | 'platform-data';

// CAF Management Group Structure
export type ManagementGroupType = 'tenant-root' | 'platform' | 'landing-zones';

// ID prefix constants to prevent conflicts
export const ID_PREFIXES = {
  GROUP: 'grp_',
  NODE: 'n_',
  CONNECTIVITY: 'conn_',
  NETWORKING: 'net_',
  COMPUTE: 'comp_',
  DATA: 'data_',
  SECURITY: 'sec_',
  IDENTITY: 'id_',
  MANAGEMENT: 'mgmt_',
  OBSERVABILITY: 'obs_',
  AI: 'ai_'
} as const;

// Utility function to generate unique IDs
export function generateUniqueId(prefix: string, baseId: string, existingIds: Set<string>): string {
  let candidateId = `${prefix}${baseId}`;
  let counter = 1;
  
  while (existingIds.has(candidateId)) {
    candidateId = `${prefix}${baseId}_${counter}`;
    counter++;
  }
  
  return candidateId;
}

// Utility function to generate group IDs
export function generateGroupId(layer: AacLayer): string {
  return `${ID_PREFIXES.GROUP}${layer}`;
}

// Utility function to generate node IDs
export function generateNodeId(layer: AacLayer, baseId: string): string {
  const layerPrefix = ID_PREFIXES[layer.toUpperCase() as keyof typeof ID_PREFIXES] || ID_PREFIXES.NODE;
  return `${layerPrefix}${baseId}`;
}

export interface ArchNode {
  id: string;
  type: NodeType;
  label: string;
  layer: AacLayer;
  group?: string;
  meta?: Record<string, any>;
  // CAF extensions
  entityType?: EntityType;
  subscriptionId?: string;
  mgId?: string;
  subscriptionType?: SubscriptionType;
  addressSpace?: string;
  vmCount?: number;
  vmSku?: string;
  // Containment hierarchy
  parentId?: string;
  children?: string[]; // Array of child node IDs
  bounds?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface ArchEdge {
  from: string;
  to: string;
  label?: string;
  // CAF extensions
  edgeType?: 'governance' | 'peering' | 'private-endpoint' | 'policy-diagnostics' | 'security' | 'ingress' | 'east-west' | 'egress' | 'bastion' | 'management';
  style?: 'dashed' | 'solid';
  bundleCount?: number;
  // Containment validation
  isContainment?: boolean; // True if this edge represents containment
}

export interface ArchitectureModel {
  nodes: ArchNode[];
  edges: ArchEdge[];
  // CAF extensions
  managementGroups?: ManagementGroup[];
  subscriptions?: Subscription[];
  cafOptions?: CAFOptions;
}

export interface ManagementGroup {
  id: string;
  name: string;
  type: ManagementGroupType;
  parentId?: string;
  children?: string[]; // subscription IDs
}

export interface Subscription {
  id: string;
  name: string;
  type: SubscriptionType;
  mgId: string;
  vnets?: VNet[];
  resourceGroups?: ResourceGroup[];
}

export interface VNet {
  id: string;
  name: string;
  addressSpace: string;
  subnets: Subnet[];
  subscriptionId: string;
}

export interface Subnet {
  id: string;
  name: string;
  addressPrefix: string;
  vnetId: string;
  tier?: 'web' | 'app' | 'db';
  vmCount?: number;
  vmSku?: string;
}

export interface ResourceGroup {
  id: string;
  name: string;
  subscriptionId: string;
  resources: string[]; // node IDs
}

export interface CAFOptions {
  showNonProd?: boolean;
  includePrivateEndpoints?: boolean;
  includeObservability?: boolean;
  includeSecurity?: boolean;
  layoutPreset?: 'caf' | 'flat';
}

// AAC Landing Zone Components
export const AAC_COMPONENTS = {
  // Connectivity Layer
  FRONT_DOOR: { type: 'frontdoor' as NodeType, layer: 'Connectivity' as AacLayer, label: 'Azure Front Door' },
  APP_GATEWAY: { type: 'appgw' as NodeType, layer: 'Connectivity' as AacLayer, label: 'Application Gateway' },
  FIREWALL: { type: 'firewall' as NodeType, layer: 'Connectivity' as AacLayer, label: 'Azure Firewall' },
  BASTION: { type: 'bastion' as NodeType, layer: 'Connectivity' as AacLayer, label: 'Azure Bastion' },
  
  // Networking Layer
  HUB_VNET: { type: 'vnet' as NodeType, layer: 'Networking' as AacLayer, label: 'Hub VNet' },
  SPOKE_VNET: { type: 'vnet' as NodeType, layer: 'Networking' as AacLayer, label: 'Spoke VNet' },
  WEB_SUBNET: { type: 'subnet' as NodeType, layer: 'Networking' as AacLayer, label: 'Web Subnet' },
  APP_SUBNET: { type: 'subnet' as NodeType, layer: 'Networking' as AacLayer, label: 'App Subnet' },
  DB_SUBNET: { type: 'subnet' as NodeType, layer: 'Networking' as AacLayer, label: 'DB Subnet' },
  NSG: { type: 'nsg' as NodeType, layer: 'Networking' as AacLayer, label: 'NSG' },
  LOAD_BALANCER: { type: 'lb' as NodeType, layer: 'Networking' as AacLayer, label: 'Load Balancer' },
  
  // Compute Layer
  VM: { type: 'vm' as NodeType, layer: 'Compute' as AacLayer, label: 'Virtual Machine' },
  VMSS: { type: 'vmss' as NodeType, layer: 'Compute' as AacLayer, label: 'VM Scale Set' },
  
  // Data Layer
  SQL_DB: { type: 'sql' as NodeType, layer: 'Data' as AacLayer, label: 'Azure SQL Database' },
  STORAGE: { type: 'storage' as NodeType, layer: 'Data' as AacLayer, label: 'Storage Account' },
  
  // Security Layer
  KEY_VAULT: { type: 'keyvault' as NodeType, layer: 'Security' as AacLayer, label: 'Key Vault' },
  DEFENDER: { type: 'defender' as NodeType, layer: 'Security' as AacLayer, label: 'Defender for Cloud' },
  
  // Identity Layer
  IDENTITY: { type: 'custom' as NodeType, layer: 'Identity' as AacLayer, label: 'Azure AD' },
  
  // Management Layer
  POLICY: { type: 'custom' as NodeType, layer: 'Management' as AacLayer, label: 'Azure Policy' },
  
  // Observability Layer
  MONITOR: { type: 'monitor' as NodeType, layer: 'Observability' as AacLayer, label: 'Azure Monitor' },
  LOG_ANALYTICS: { type: 'loganalytics' as NodeType, layer: 'Observability' as AacLayer, label: 'Log Analytics' },
  
  // AI Layer
  OPENAI: { type: 'openai' as NodeType, layer: 'Compute' as AacLayer, label: 'Azure OpenAI' },
  SEARCH: { type: 'search' as NodeType, layer: 'Compute' as AacLayer, label: 'Azure Cognitive Search' },
} as const;

// Architecture layout options
export type ArchitectureLayout = 'aac' | 'pipeline' | 'caf';

// Architecture options
export interface ArchitectureOptions {
  layout?: ArchitectureLayout;
  includeOpenAI?: boolean;
  direction?: 'LR' | 'TB';
  cafOptions?: CAFOptions;
}

// Architecture advice from Azure OpenAI
export interface ArchitectureAdvice {
  recommendations: string[];
  risks: string[];
  guardrails: string[];
} 