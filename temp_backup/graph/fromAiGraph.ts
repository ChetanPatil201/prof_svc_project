import type { Node, Edge } from 'reactflow';
import type { CafArchitecture } from '../ai/cafSchema';
import type { ArchitectureModel, ArchNode, ArchEdge, AacLayer } from '@/types/architecture';
import { validateCIDRRanges } from '../ai/cafSuggest';

// CAF style tokens for consistent theming
export const CAF_STYLE_TOKENS = {
  colors: {
    platform: '#0078d4', // Azure blue
    landingZone: '#107c10', // Azure green
    connectivity: '#d13438', // Azure red
    identity: '#8661c5', // Azure purple
    management: '#ff8c00', // Azure orange
    data: '#00bcf2', // Azure cyan
    security: '#68217a', // Azure dark purple
    compute: '#00b294', // Azure teal
    storage: '#ff6b35', // Azure coral
    networking: '#0078d4', // Azure blue
    observability: '#68217a', // Azure dark purple
  },
  nodeTypes: {
    subscription: 'subscription',
    vnet: 'vnet',
    subnet: 'subnet',
    service: 'service',
    tier: 'tier'
  },
  edgeTypes: {
    containment: 'containment',
    peering: 'peering',
    connectivity: 'connectivity'
  }
};

// Map CAF subscription types to colors
const SUBSCRIPTION_COLOR_MAP: Record<string, string> = {
  'platform-identity': CAF_STYLE_TOKENS.colors.identity,
  'platform-management': CAF_STYLE_TOKENS.colors.management,
  'platform-connectivity': CAF_STYLE_TOKENS.colors.connectivity,
  'landingzone-prod': CAF_STYLE_TOKENS.colors.landingZone,
  'landingzone-nonprod': CAF_STYLE_TOKENS.colors.landingZone,
  'platform-data': CAF_STYLE_TOKENS.colors.data
};

// Map service types to Azure service types
const SERVICE_TYPE_MAP: Record<string, string> = {
  'vm': 'vm',
  'vmss': 'vmss',
  'sql': 'sql',
  'storage': 'storage',
  'keyvault': 'keyvault',
  'monitor': 'monitor',
  'firewall': 'firewall',
  'bastion': 'bastion',
  'appgw': 'appgw',
  'lb': 'lb',
  'nsg': 'nsg'
};

// Map service types to layers
const SERVICE_LAYER_MAP: Record<string, AacLayer> = {
  'vm': 'Compute',
  'vmss': 'Compute',
  'sql': 'Data',
  'storage': 'Data',
  'keyvault': 'Security',
  'monitor': 'Observability',
  'firewall': 'Networking',
  'bastion': 'Networking',
  'appgw': 'Networking',
  'lb': 'Networking',
  'nsg': 'Networking'
};

/**
 * Convert ArchNode to ReactFlow Node
 */
function convertArchNodeToReactFlowNode(archNode: ArchNode, index: number): Node {
  // Determine node type for ReactFlow
  let nodeType = 'azureNode';
  if (archNode.entityType === 'subscription' || archNode.entityType === 'vnet') {
    nodeType = 'groupNode';
  }

  // Calculate position based on layer and index
  const layerPositions: Record<AacLayer, { x: number; y: number }> = {
    'Management': { x: 50, y: 50 },
    'Identity': { x: 50, y: 150 },
    'Networking': { x: 50, y: 250 },
    'Compute': { x: 50, y: 350 },
    'Data': { x: 50, y: 450 },
    'Security': { x: 50, y: 550 },
    'Observability': { x: 50, y: 650 },
    'DevOps': { x: 50, y: 750 },
    'Connectivity': { x: 50, y: 850 }
  };

  const basePosition = layerPositions[archNode.layer] || { x: 50, y: 50 };
  const position = {
    x: basePosition.x + (index * 250),
    y: basePosition.y
  };

  return {
    id: archNode.id,
    type: nodeType,
    position,
    data: {
      ...archNode,
      // Ensure all required data properties are present
      label: archNode.label,
      type: archNode.type,
      layer: archNode.layer,
      meta: archNode.meta || {}
    }
  };
}

/**
 * Convert ArchEdge to ReactFlow Edge
 */
function convertArchEdgeToReactFlowEdge(archEdge: ArchEdge): Edge {
  return {
    id: `${archEdge.from}-${archEdge.to}`,
    source: archEdge.from,
    target: archEdge.to,
    type: 'custom',
    data: {
      label: archEdge.label,
      style: archEdge.style,
      edgeType: archEdge.edgeType,
      isContainment: archEdge.isContainment
    }
  };
}

/**
 * Convert AI-generated CAF architecture to React Flow graph
 */
export function convertCafToReactFlow(architecture: CafArchitecture): { nodes: Node[]; edges: Edge[] } {
  const archNodes: ArchNode[] = [];
  const archEdges: ArchEdge[] = [];
  const nodeIds = new Set<string>();
  const edgeKeys = new Set<string>();

  // Validate CIDR ranges first
  const cidrIssues = validateCIDRRanges(architecture);
  if (cidrIssues.length > 0) {
    console.warn('CIDR validation issues:', cidrIssues);
  }

  // Process subscriptions
  for (const subscription of architecture.architecture.subscriptions) {
    const subscriptionNode: ArchNode = {
      id: subscription.id,
      type: 'subscription' as any,
      label: subscription.name,
      layer: 'Management',
      entityType: 'subscription',
      subscriptionType: subscription.type,
      meta: {
        color: SUBSCRIPTION_COLOR_MAP[subscription.type] || CAF_STYLE_TOKENS.colors.platform,
        subscriptionType: subscription.type
      }
    };
    archNodes.push(subscriptionNode);
    nodeIds.add(subscription.id);

    // Process VNets in this subscription
    for (const vnet of subscription.vnets) {
      const vnetNode: ArchNode = {
        id: vnet.id,
        type: 'vnet' as any,
        label: vnet.name,
        layer: 'Networking',
        entityType: 'vnet',
        parentId: subscription.id,
        addressSpace: vnet.addressSpace,
        meta: {
          color: CAF_STYLE_TOKENS.colors.networking,
          addressSpace: vnet.addressSpace
        }
      };
      archNodes.push(vnetNode);
      nodeIds.add(vnet.id);

      // Add containment edge from subscription to VNet
      const containmentEdge: ArchEdge = {
        from: subscription.id,
        to: vnet.id,
        edgeType: 'governance',
        isContainment: true
      };
      archEdges.push(containmentEdge);

      // Process subnets in this VNet
      for (const subnet of vnet.subnets) {
        const subnetNode: ArchNode = {
          id: subnet.id,
          type: 'subnet' as any,
          label: subnet.name,
          layer: 'Networking',
          entityType: 'subnet',
          parentId: vnet.id,
          addressSpace: subnet.addressPrefix,
          vmCount: subnet.vmCount || 0,
          vmSku: subnet.vmSku,
          meta: {
            color: CAF_STYLE_TOKENS.colors.networking,
            addressPrefix: subnet.addressPrefix,
            tier: subnet.tier,
            vmCount: subnet.vmCount || 0
          }
        };
        archNodes.push(subnetNode);
        nodeIds.add(subnet.id);

        // Add containment edge from VNet to subnet
        const subnetContainmentEdge: ArchEdge = {
          from: vnet.id,
          to: subnet.id,
          edgeType: 'governance',
          isContainment: true
        };
        archEdges.push(subnetContainmentEdge);

        // Process services in this subnet
        if (subnet.services) {
          for (const service of subnet.services) {
            if (service.count > 0) {
              const serviceNode: ArchNode = {
                id: service.id,
                type: SERVICE_TYPE_MAP[service.type] as any,
                label: `${service.name} (${service.count})`,
                layer: SERVICE_LAYER_MAP[service.type] || 'Compute',
                entityType: 'service',
                parentId: subnet.id,
                vmCount: service.count,
                vmSku: service.sku,
                meta: {
                  color: getServiceColor(service.type),
                  count: service.count,
                  sku: service.sku,
                  config: service.config
                }
              };
              archNodes.push(serviceNode);
              nodeIds.add(service.id);

              // Add containment edge from subnet to service
              const serviceContainmentEdge: ArchEdge = {
                from: subnet.id,
                to: service.id,
                edgeType: 'governance',
                isContainment: true
              };
              archEdges.push(serviceContainmentEdge);
            }
          }
        }
      }
    }
  }

  // Add peering connections between VNets (hub-spoke pattern)
  if (architecture.architecture.pattern === 'hub-spoke') {
    const hubVnets = archNodes.filter(n => 
      n.entityType === 'vnet' && 
      n.parentId && 
      archNodes.find(s => s.id === n.parentId)?.subscriptionType === 'platform-connectivity'
    );
    
    const spokeVnets = archNodes.filter(n => 
      n.entityType === 'vnet' && 
      n.parentId && 
      archNodes.find(s => s.id === n.parentId)?.subscriptionType?.includes('landingzone')
    );

    for (const hubVnet of hubVnets) {
      for (const spokeVnet of spokeVnets) {
        const edgeKey = `${hubVnet.id}->${spokeVnet.id}`;
        if (!edgeKeys.has(edgeKey)) {
          archEdges.push({
            from: hubVnet.id,
            to: spokeVnet.id,
            edgeType: 'peering',
            style: 'dashed'
          });
          edgeKeys.add(edgeKey);
        }
      }
    }
  }

  // Enforce one edge per pair and validate
  const deduplicatedEdges = deduplicateEdges(archEdges);
  const validatedEdges = validateEdges(deduplicatedEdges, archNodes);

  // Convert to ReactFlow format
  const reactFlowNodes = archNodes.map((node, index) => convertArchNodeToReactFlowNode(node, index));
  const reactFlowEdges = validatedEdges.map(edge => convertArchEdgeToReactFlowEdge(edge));

  console.log('Conversion results:', {
    archNodesCount: archNodes.length,
    archEdgesCount: archEdges.length,
    reactFlowNodesCount: reactFlowNodes.length,
    reactFlowEdgesCount: reactFlowEdges.length,
    sampleNode: reactFlowNodes[0],
    sampleEdge: reactFlowEdges[0]
  });

  return {
    nodes: reactFlowNodes,
    edges: reactFlowEdges
  };
}

/**
 * Get color for service type
 */
function getServiceColor(serviceType: string): string {
  switch (serviceType) {
    case 'vm':
    case 'vmss':
      return CAF_STYLE_TOKENS.colors.compute;
    case 'sql':
    case 'storage':
      return CAF_STYLE_TOKENS.colors.storage;
    case 'keyvault':
      return CAF_STYLE_TOKENS.colors.security;
    case 'monitor':
      return CAF_STYLE_TOKENS.colors.observability;
    case 'firewall':
    case 'bastion':
    case 'appgw':
    case 'lb':
    case 'nsg':
      return CAF_STYLE_TOKENS.colors.networking;
    default:
      return CAF_STYLE_TOKENS.colors.platform;
  }
}

/**
 * Remove duplicate edges and self-edges
 */
function deduplicateEdges(edges: ArchEdge[]): ArchEdge[] {
  const uniqueEdges = new Map<string, ArchEdge>();
  
  for (const edge of edges) {
    // Skip self-edges
    if (edge.from === edge.to) {
      continue;
    }
    
    // Create unique key for edge
    const edgeKey = `${edge.from}->${edge.to}`;
    
    if (!uniqueEdges.has(edgeKey)) {
      uniqueEdges.set(edgeKey, edge);
    }
  }
  
  return Array.from(uniqueEdges.values());
}

/**
 * Validate edges against nodes
 */
function validateEdges(edges: ArchEdge[], nodes: ArchNode[]): ArchEdge[] {
  const nodeIds = new Set(nodes.map(n => n.id));
  
  return edges.filter(edge => {
    // Check if both nodes exist
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      console.warn(`Edge references non-existent node: ${edge.from} -> ${edge.to}`);
      return false;
    }
    
    return true;
  });
}

/**
 * Apply dagre layout to the graph
 */
export function applyDagreLayout(model: ArchitectureModel): ArchitectureModel {
  // This would integrate with dagre for automatic layout
  // For now, we'll use a simple hierarchical layout
  
  const nodes = [...model.nodes];
  const edges = [...model.edges];
  
  // Simple hierarchical positioning
  let yOffset = 0;
  const layerHeight = 150;
  
  // Group nodes by layer
  const nodesByLayer = new Map<AacLayer, ArchNode[]>();
  for (const node of nodes) {
    if (!nodesByLayer.has(node.layer)) {
      nodesByLayer.set(node.layer, []);
    }
    nodesByLayer.get(node.layer)!.push(node);
  }
  
  // Position nodes by layer
  for (const [layer, layerNodes] of nodesByLayer) {
    let xOffset = 50;
    const nodeWidth = 200;
    const nodeSpacing = 50;
    
    for (const node of layerNodes) {
      node.bounds = {
        x: xOffset,
        y: yOffset,
        w: nodeWidth,
        h: 80
      };
      xOffset += nodeWidth + nodeSpacing;
    }
    
    yOffset += layerHeight;
  }
  
  return { nodes, edges, cafOptions: model.cafOptions };
}

/**
 * Clamp node sizes to reasonable bounds
 */
export function clampNodeSizes(model: ArchitectureModel): ArchitectureModel {
  const nodes = model.nodes.map(node => {
    if (node.bounds) {
      node.bounds.w = Math.max(100, Math.min(400, node.bounds.w));
      node.bounds.h = Math.max(60, Math.min(120, node.bounds.h));
    }
    return node;
  });
  
  return { ...model, nodes };
}
