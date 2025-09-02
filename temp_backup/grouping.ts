import type { ArchitectureModel, ArchNode, ArchEdge, NodeType, AacLayer } from '@/types/architecture';

export type GroupLevel = 'tier' | 'subnet' | 'service';

export interface GroupingResult {
  model: ArchitectureModel;
  grouping: Record<string, string[]>;
}

/**
 * Group architecture nodes by different levels to reduce complexity
 * No overflow diamonds - only clean grouping
 */
export function groupArchitecture(model: ArchitectureModel, level: GroupLevel): GroupingResult {

  
  switch (level) {
    case 'tier':
      return groupByTier(model);
    case 'subnet':
      return groupBySubnet(model);
    case 'service':
      return groupByService(model);
    default:
      return { model, grouping: {} };
  }
}

/**
 * Group nodes by application tiers (Web, App, DB)
 */
function groupByTier(model: ArchitectureModel): GroupingResult {
  const grouping: Record<string, string[]> = {};
  const groupedNodes: ArchNode[] = [];
  const groupedEdges: ArchEdge[] = [];
  
  // Define tier groups
  const tierGroups = {
    'web-tier': {
      label: 'Web Tier',
      type: 'vm' as NodeType,
      layer: 'Compute' as AacLayer,
      nodes: [] as string[]
    },
    'app-tier': {
      label: 'Application Tier',
      type: 'vm' as NodeType,
      layer: 'Compute' as AacLayer,
      nodes: [] as string[]
    },
    'db-tier': {
      label: 'Database Tier',
      type: 'sql' as NodeType,
      layer: 'Data' as AacLayer,
      nodes: [] as string[]
    },
    'networking': {
      label: 'Networking',
      type: 'vnet' as NodeType,
      layer: 'Networking' as AacLayer,
      nodes: [] as string[]
    },
    'security': {
      label: 'Security',
      type: 'keyvault' as NodeType,
      layer: 'Security' as AacLayer,
      nodes: [] as string[]
    },
    'observability': {
      label: 'Observability',
      type: 'monitor' as NodeType,
      layer: 'Observability' as AacLayer,
      nodes: [] as string[]
    }
  };
  
  // Categorize nodes into tiers
  model.nodes.forEach(node => {
    if (node.meta?.isHub) {
      // Skip existing hub nodes
      return;
    }
    
    const nodeType = node.type?.toLowerCase() || '';
    const nodeLabel = node.label?.toLowerCase() || '';
    
    if (nodeType.includes('web') || nodeLabel.includes('web') || nodeLabel.includes('frontend')) {
      tierGroups['web-tier'].nodes.push(node.id);
    } else if (nodeType.includes('app') || nodeLabel.includes('app') || nodeLabel.includes('api')) {
      tierGroups['app-tier'].nodes.push(node.id);
    } else if (nodeType.includes('sql') || nodeType.includes('db') || nodeType.includes('database')) {
      tierGroups['db-tier'].nodes.push(node.id);
    } else if (nodeType.includes('vnet') || nodeType.includes('subnet') || nodeType.includes('nsg')) {
      tierGroups['networking'].nodes.push(node.id);
    } else if (nodeType.includes('key') || nodeType.includes('defender') || nodeType.includes('policy')) {
      tierGroups['security'].nodes.push(node.id);
    } else if (nodeType.includes('monitor') || nodeType.includes('log') || nodeType.includes('insights')) {
      tierGroups['observability'].nodes.push(node.id);
    } else {
      // Default to app tier for unknown types
      tierGroups['app-tier'].nodes.push(node.id);
    }
  });
  
  // Create grouped nodes
  Object.entries(tierGroups).forEach(([groupId, group]) => {
    if (group.nodes.length > 0) {
      const groupedNode: ArchNode = {
        id: groupId,
        type: group.type,
        label: group.label,
        layer: group.layer,
        meta: {
          isGrouped: true,
          groupType: 'tier',
          containedNodes: group.nodes,
          nodeCount: group.nodes.length
        }
      };
      
      groupedNodes.push(groupedNode);
      grouping[groupId] = group.nodes;
    }
  });
  
  // Process edges to connect grouped nodes
  const edgeMap = new Map<string, { from: string; to: string; labels: string[]; count: number }>();
  
  model.edges.forEach(edge => {
    // Find which groups the source and target belong to
    const sourceGroup = findNodeGroup(edge.from, tierGroups);
    const targetGroup = findNodeGroup(edge.to, tierGroups);
    
    if (sourceGroup && targetGroup && sourceGroup !== targetGroup) {
      const edgeKey = `${sourceGroup}->${targetGroup}`;
      
      if (!edgeMap.has(edgeKey)) {
        edgeMap.set(edgeKey, {
          from: sourceGroup,
          to: targetGroup,
          labels: edge.label ? [edge.label] : [],
          count: 1
        });
      } else {
        const existing = edgeMap.get(edgeKey)!;
        existing.count++;
        if (edge.label && !existing.labels.includes(edge.label)) {
          existing.labels.push(edge.label);
        }
      }
    }
  });
  
  // Create grouped edges
  edgeMap.forEach((edgeData, key) => {
    const label = edgeData.count > 1 
      ? `${edgeData.labels.join(', ')} ×${edgeData.count}`.trim()
      : edgeData.labels[0] || undefined;
      
    groupedEdges.push({
      from: edgeData.from,
      to: edgeData.to,
      label
    });
  });
  
  return {
    model: { nodes: groupedNodes, edges: groupedEdges },
    grouping
  };
}

/**
 * Group nodes by subnet
 */
function groupBySubnet(model: ArchitectureModel): GroupingResult {
  const grouping: Record<string, string[]> = {};
  const groupedNodes: ArchNode[] = [];
  const groupedEdges: ArchEdge[] = [];
  
  // Define subnet groups
  const subnetGroups = {
    'web-subnet': {
      label: 'Web Subnet',
      type: 'subnet' as NodeType,
      layer: 'Networking' as AacLayer,
      nodes: [] as string[]
    },
    'app-subnet': {
      label: 'Application Subnet',
      type: 'subnet' as NodeType,
      layer: 'Networking' as AacLayer,
      nodes: [] as string[]
    },
    'db-subnet': {
      label: 'Database Subnet',
      type: 'subnet' as NodeType,
      layer: 'Networking' as AacLayer,
      nodes: [] as string[]
    },
    'management-subnet': {
      label: 'Management Subnet',
      type: 'subnet' as NodeType,
      layer: 'Networking' as AacLayer,
      nodes: [] as string[]
    }
  };
  
  // Categorize nodes by subnet
  model.nodes.forEach(node => {
    if (node.meta?.isHub) {
      return;
    }
    
    const nodeLabel = node.label?.toLowerCase() || '';
    const nodeType = node.type?.toLowerCase() || '';
    
    if (nodeLabel.includes('web') || nodeType.includes('web')) {
      subnetGroups['web-subnet'].nodes.push(node.id);
    } else if (nodeLabel.includes('app') || nodeType.includes('app') || nodeType.includes('api')) {
      subnetGroups['app-subnet'].nodes.push(node.id);
    } else if (nodeLabel.includes('db') || nodeType.includes('sql') || nodeType.includes('database')) {
      subnetGroups['db-subnet'].nodes.push(node.id);
    } else {
      subnetGroups['management-subnet'].nodes.push(node.id);
    }
  });
  
  // Create grouped nodes
  Object.entries(subnetGroups).forEach(([groupId, group]) => {
    if (group.nodes.length > 0) {
      const groupedNode: ArchNode = {
        id: groupId,
        type: group.type,
        label: group.label,
        layer: group.layer,
        meta: {
          isGrouped: true,
          groupType: 'subnet',
          containedNodes: group.nodes,
          nodeCount: group.nodes.length
        }
      };
      
      groupedNodes.push(groupedNode);
      grouping[groupId] = group.nodes;
    }
  });
  
  // Process edges (similar to tier grouping)
  const edgeMap = new Map<string, { from: string; to: string; labels: string[]; count: number }>();
  
  model.edges.forEach(edge => {
    const sourceGroup = findNodeGroup(edge.from, subnetGroups);
    const targetGroup = findNodeGroup(edge.to, subnetGroups);
    
    if (sourceGroup && targetGroup && sourceGroup !== targetGroup) {
      const edgeKey = `${sourceGroup}->${targetGroup}`;
      
      if (!edgeMap.has(edgeKey)) {
        edgeMap.set(edgeKey, {
          from: sourceGroup,
          to: targetGroup,
          labels: edge.label ? [edge.label] : [],
          count: 1
        });
      } else {
        const existing = edgeMap.get(edgeKey)!;
        existing.count++;
        if (edge.label && !existing.labels.includes(edge.label)) {
          existing.labels.push(edge.label);
        }
      }
    }
  });
  
  // Create grouped edges
  edgeMap.forEach((edgeData, key) => {
    const label = edgeData.count > 1 
      ? `${edgeData.labels.join(', ')} ×${edgeData.count}`.trim()
      : edgeData.labels[0] || undefined;
      
    groupedEdges.push({
      from: edgeData.from,
      to: edgeData.to,
      label
    });
  });
  
  return {
    model: { nodes: groupedNodes, edges: groupedEdges },
    grouping
  };
}

/**
 * Group nodes by service type (collapse observability/security into single nodes)
 */
function groupByService(model: ArchitectureModel): GroupingResult {

  const grouping: Record<string, string[]> = {};
  const groupedNodes: ArchNode[] = [];
  const groupedEdges: ArchEdge[] = [];
  
  // Define service groups
  const serviceGroups = {
    'observability': {
      label: 'Observability',
      type: 'monitor' as NodeType,
      layer: 'Observability' as AacLayer,
      nodes: [] as string[]
    },
    'security': {
      label: 'Security',
      type: 'keyvault' as NodeType,
      layer: 'Security' as AacLayer,
      nodes: [] as string[]
    },
    'networking': {
      label: 'Networking',
      type: 'vnet' as NodeType,
      layer: 'Networking' as AacLayer,
      nodes: [] as string[]
    }
  };
  
  // Categorize nodes by service
  model.nodes.forEach(node => {
    if (node.meta?.isHub) {
      return;
    }
    
    const nodeType = node.type?.toLowerCase() || '';
    const nodeLabel = node.label?.toLowerCase() || '';
    
    if (nodeType.includes('monitor') || nodeType.includes('log') || nodeType.includes('insights') || nodeLabel.includes('monitor') || nodeLabel.includes('log')) {
      serviceGroups['observability'].nodes.push(node.id);
    } else if (nodeType.includes('key') || nodeType.includes('defender') || nodeType.includes('policy') || nodeLabel.includes('policy') || nodeLabel.includes('defender') || nodeLabel.includes('key')) {
      serviceGroups['security'].nodes.push(node.id);
    } else if (nodeType.includes('vnet') || nodeType.includes('subnet') || nodeType.includes('nsg') || nodeLabel.includes('vnet') || nodeLabel.includes('subnet') || nodeLabel.includes('networking')) {
      serviceGroups['networking'].nodes.push(node.id);
    } else {
      // Keep other nodes as individual nodes
      groupedNodes.push(node);
    }
  });
  
  // Create grouped nodes for services
  Object.entries(serviceGroups).forEach(([groupId, group]) => {
    if (group.nodes.length > 0) {
      const groupedNode: ArchNode = {
        id: groupId,
        type: group.type,
        label: group.label,
        layer: group.layer,
        meta: {
          isGrouped: true,
          groupType: 'service',
          containedNodes: group.nodes,
          nodeCount: group.nodes.length
        }
      };
      
      groupedNodes.push(groupedNode);
      grouping[groupId] = group.nodes;
    }
  });
  
  // Process edges
  const edgeMap = new Map<string, { from: string; to: string; labels: string[]; count: number }>();
  
  model.edges.forEach(edge => {
    const sourceGroup = findNodeGroup(edge.from, serviceGroups);
    const targetGroup = findNodeGroup(edge.to, serviceGroups);
    
    // Handle edges between grouped and individual nodes
    const sourceId = sourceGroup || edge.from;
    const targetId = targetGroup || edge.to;
    
    if (sourceId !== targetId) {
      const edgeKey = `${sourceId}->${targetId}`;
      
      if (!edgeMap.has(edgeKey)) {
        edgeMap.set(edgeKey, {
          from: sourceId,
          to: targetId,
          labels: edge.label ? [edge.label] : [],
          count: 1
        });
      } else {
        const existing = edgeMap.get(edgeKey)!;
        existing.count++;
        if (edge.label && !existing.labels.includes(edge.label)) {
          existing.labels.push(edge.label);
        }
      }
    }
  });
  
  // Create grouped edges
  edgeMap.forEach((edgeData, key) => {
    const label = edgeData.count > 1 
      ? `${edgeData.labels.join(', ')} ×${edgeData.count}`.trim()
      : edgeData.labels[0] || undefined;
      
    groupedEdges.push({
      from: edgeData.from,
      to: edgeData.to,
      label
    });
  });
  
  return {
    model: { nodes: groupedNodes, edges: groupedEdges },
    grouping
  };
}

/**
 * Helper function to find which group a node belongs to
 */
function findNodeGroup(nodeId: string, groups: Record<string, { nodes: string[] }>): string | null {
  for (const [groupId, group] of Object.entries(groups)) {
    if (group.nodes.includes(nodeId)) {
      return groupId;
    }
  }
  return null;
}

/**
 * Apply grouping to an architecture model
 */
export function applyGrouping(model: ArchitectureModel, level: GroupLevel): ArchitectureModel {
  const result = groupArchitecture(model, level);
  return result.model;
}
