// Basic types for AI diagram generation
export type AacLayer = 'Connectivity' | 'Identity' | 'Management' | 'Security' | 'Networking' | 'Compute' | 'Data' | 'Observability' | 'DevOps';

export type NodeType = 'frontdoor' | 'appgw' | 'firewall' | 'bastion' | 'lb' | 'vnet' | 'subnet' | 'nsg' | 'vm' | 'vmss' | 'sql' | 'storage' | 'kv' | 'monitor' | 'loganalytics' | 'defender' | 'keyvault' | 'openai' | 'search' | 'custom' | 'subscription';

// CAF Entity Types for containers and grouping
export type EntityType = 'managementGroup' | 'subscription' | 'vnet' | 'subnet' | 'tier' | 'service' | 'paas' | 'resourceGroup';

// CAF Subscription Types
export type SubscriptionType = 'platform-identity' | 'platform-management' | 'platform-connectivity' | 'landingzone-prod' | 'landingzone-nonprod' | 'platform-data';

// CAF Management Group Structure
export type ManagementGroupType = 'tenant-root' | 'platform' | 'landing-zones';

// Architecture layout options
export type ArchitectureLayout = 'aac' | 'pipeline' | 'caf';

// Architecture options
export interface ArchitectureOptions {
  layout?: ArchitectureLayout;
  includeOpenAI?: boolean;
  direction?: 'LR' | 'TB';
  cafOptions?: CAFOptions;
}

export interface CAFOptions {
  showNonProd?: boolean;
  includePrivateEndpoints?: boolean;
  includeObservability?: boolean;
  includeSecurity?: boolean;
  layoutPreset?: 'caf' | 'flat';
}

// Architecture advice from Azure OpenAI
export interface ArchitectureAdvice {
  recommendations: string[];
  risks: string[];
  guardrails: string[];
}

// Bounds type that supports both naming conventions
export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
  width?: number;
  height?: number;
}

// Core Architecture Model Types
export interface ArchNode {
  id: string;
  label: string;
  entityType: EntityType;
  type?: NodeType;
  nodeType?: NodeType;
  layer?: AacLayer;
  bounds?: Bounds;
  children?: string[];
  parent?: string;
  parentId?: string;
  properties?: Record<string, any>;
  metadata?: Record<string, any>;
  meta?: {
    isGrouped?: boolean;
    isHub?: boolean;
    nodeCount?: number;
    role?: string;
    bounds?: Bounds;
    boundsRel?: Bounds;
    color?: string;
    hubType?: string;
    groupType?: string;
    subscriptionType?: SubscriptionType;
    addressSpace?: string;
    addressPrefix?: string;
    count?: number;
    containedNodes?: string[];
    parentNode?: string;
  };
  subscriptionId?: string;
  mgId?: string;
  subscriptionType?: SubscriptionType;
  addressSpace?: string;
  vmCount?: number;
  vmSku?: string;
}

export interface ArchEdge {
  id: string;
  source: string;
  target: string;
  from?: string;
  to?: string;
  label?: string;
  type?: string;
  edgeType?: string;
  style?: string;
  bundleCount?: number;
  isContainment?: boolean;
  properties?: Record<string, any>;
}

export interface ManagementGroup {
  id: string;
  name: string;
  displayName: string;
  type: ManagementGroupType;
  children?: string[];
  parent?: string;
}

export interface Subscription {
  id: string;
  name: string;
  displayName: string;
  type: SubscriptionType;
  managementGroupId?: string;
  children?: string[];
  parent?: string;
}

export interface ArchitectureModel {
  nodes: ArchNode[];
  edges: ArchEdge[];
  managementGroups?: ManagementGroup[];
  subscriptions?: Subscription[];
  metadata?: Record<string, any>;
  cafOptions?: CAFOptions;
}

// Utility functions
export function generateGroupId(prefix: string, name?: string): string {
  const namePart = name ? `-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : '';
  return `${prefix}${namePart}`;
}

export const ID_PREFIXES = {
  NODE: 'node',
  MANAGEMENT_GROUP: 'mg',
  SUBSCRIPTION: 'sub',
  VNET: 'vnet',
  SUBNET: 'subnet',
  TIER: 'tier',
  SERVICE: 'svc',
  PAAS: 'paas',
  RESOURCE_GROUP: 'rg'
} as const; 