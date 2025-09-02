import type { ArchitectureModel, ArchNode, ArchEdge, ArchitectureOptions, AacLayer } from '@/types/architecture';
import { generateGroupId, ID_PREFIXES } from '@/types/architecture';



// Validation function to ensure model integrity
export function validateModel(model: ArchitectureModel): { isValid: boolean; warnings: string[]; sanitizedModel: ArchitectureModel } {
  const warnings: string[] = [];
  const existingIds = new Set<string>();
  const sanitizedNodes: ArchNode[] = [];
  const sanitizedEdges: ArchEdge[] = [];
  
  // Validate nodes
  model.nodes.forEach((node, index) => {
    // Ensure node has a layer, default to Compute if missing
    if (!node.layer) {
      warnings.push(`Node ${node.id} missing layer, defaulting to Compute`);
      node.layer = 'Compute';
    }
    
    // Generate unique ID if there's a conflict
    let finalId = node.id;
    if (existingIds.has(finalId)) {
      const originalId = finalId;
      finalId = `${ID_PREFIXES.NODE}${node.id}_${index}`;
      warnings.push(`Duplicate node ID ${originalId} renamed to ${finalId}`);
    }
    
    existingIds.add(finalId);
    
    // Create sanitized node
    sanitizedNodes.push({
      ...node,
      id: finalId
    });
  });
  
  // Validate edges and remove duplicates/self-edges
  const edgeSet = new Set<string>();
  model.edges.forEach(edge => {
    // Skip self-edges
    if (edge.from === edge.to) {
      warnings.push(`Skipping self-edge from ${edge.from} to ${edge.to}`);
      return;
    }
    
    // Create unique edge identifier
    const edgeKey = `${edge.from}:${edge.to}:${edge.label || ''}`;
    if (edgeSet.has(edgeKey)) {
      warnings.push(`Skipping duplicate edge from ${edge.from} to ${edge.to}`);
      return;
    }
    
    edgeSet.add(edgeKey);
    
    // Ensure both nodes exist
    const fromNode = sanitizedNodes.find(n => n.id === edge.from);
    const toNode = sanitizedNodes.find(n => n.id === edge.to);
    
    if (!fromNode) {
      warnings.push(`Edge references non-existent node ${edge.from}`);
      return;
    }
    
    if (!toNode) {
      warnings.push(`Edge references non-existent node ${edge.to}`);
      return;
    }
    
    sanitizedEdges.push(edge);
  });
  
  const isValid = warnings.length === 0 || warnings.every(w => w.includes('defaulting'));
  
  return {
    isValid,
    warnings,
    sanitizedModel: { nodes: sanitizedNodes, edges: sanitizedEdges }
  };
}

export function architectureToMermaid(
  model: ArchitectureModel, 
  options: ArchitectureOptions = {}
): string {
  const { direction = 'LR' } = options;
  
  // Validate the model first
  const validation = validateModel(model);
  if (validation.warnings.length > 0) {
    console.warn('⚠️ [MermaidRenderer] Validation warnings:', validation.warnings);
  }
  
  const { sanitizedModel } = validation;
  
  let mermaid = `flowchart ${direction}\n`;
  
  // Define node styles
  mermaid += `\n%% Node styles\n`;
  mermaid += `classDef connectivity fill:#e1f5fe,stroke:#01579b,stroke-width:2px\n`;
  mermaid += `classDef networking fill:#f3e5f5,stroke:#4a148c,stroke-width:2px\n`;
  mermaid += `classDef compute fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px\n`;
  mermaid += `classDef grouped fill:#fff3e0,stroke:#f57c00,stroke-width:3px,color:#e65100\n`;
  mermaid += `classDef data fill:#fff3e0,stroke:#e65100,stroke-width:2px\n`;
  mermaid += `classDef security fill:#ffebee,stroke:#b71c1c,stroke-width:2px\n`;
  mermaid += `classDef identity fill:#f1f8e9,stroke:#33691e,stroke-width:2px\n`;
  mermaid += `classDef management fill:#e0f2f1,stroke:#004d40,stroke-width:2px\n`;
  mermaid += `classDef observability fill:#fce4ec,stroke:#880e4f,stroke-width:2px\n`;
  mermaid += `classDef overflow fill:#f5f5f5,stroke:#666,stroke-width:1px,stroke-dasharray:5,5\n`;
  
  // Add icon-specific styles
  mermaid += `classDef icon-vm fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px\n`;
  mermaid += `classDef icon-vnet fill:#f3e5f5,stroke:#4a148c,stroke-width:2px\n`;
  mermaid += `classDef icon-sql fill:#fff3e0,stroke:#e65100,stroke-width:2px\n`;
  mermaid += `classDef icon-storage fill:#fff3e0,stroke:#e65100,stroke-width:2px\n`;
  mermaid += `classDef icon-keyvault fill:#ffebee,stroke:#b71c1c,stroke-width:2px\n`;
  mermaid += `classDef icon-monitor fill:#fce4ec,stroke:#880e4f,stroke-width:2px\n`;
  mermaid += `classDef icon-firewall fill:#ffebee,stroke:#b71c1c,stroke-width:2px\n`;
  mermaid += `classDef icon-appgateway fill:#f3e5f5,stroke:#4a148c,stroke-width:2px\n`;
  mermaid += `classDef icon-bastion fill:#f3e5f5,stroke:#4a148c,stroke-width:2px\n`;
  mermaid += `classDef icon-loadbalancer fill:#f3e5f5,stroke:#4a148c,stroke-width:2px\n`;
  
  // Group nodes by layer
  const layerGroups = groupNodesByLayer(sanitizedModel.nodes);
  
  // Define layer order for main flow
  const mainLayerOrder: Array<keyof typeof layerGroups> = [
    'Connectivity', 'Networking', 'Compute', 'Data', 'Observability'
  ];
  
  // Add main layer subgraphs
  mainLayerOrder.forEach(layer => {
    const nodes = layerGroups[layer];
    if (nodes && nodes.length > 0) {
      const groupId = generateGroupId(layer as AacLayer);
      mermaid += `\n%% ${layer} Layer\n`;
      mermaid += `subgraph ${groupId}["${layer}"]\n`;
      
      nodes.forEach(node => {
        mermaid += renderNode(node);
      });
      
      mermaid += `end\n`;
    }
  });
  
  // Add side layer subgraphs (Identity, Security, Management)
  const sideLayers: Array<keyof typeof layerGroups> = ['Identity', 'Security', 'Management'];
  sideLayers.forEach(layer => {
    const nodes = layerGroups[layer];
    if (nodes && nodes.length > 0) {
      const groupId = generateGroupId(layer as AacLayer);
      mermaid += `\n%% ${layer} Layer\n`;
      mermaid += `subgraph ${groupId}["${layer}"]\n`;
      
      nodes.forEach(node => {
        mermaid += renderNode(node);
      });
      
      mermaid += `end\n`;
    }
  });
  
  // Add edges
  mermaid += `\n%% Edges\n`;
  sanitizedModel.edges.forEach(edge => {
    const fromId = sanitizeId(edge.from);
    const toId = sanitizeId(edge.to);
    const edgeLabel = edge.label ? `|${escapeLabel(edge.label)}|` : '';
    mermaid += `${fromId} -->${edgeLabel} ${toId}\n`;
  });
  
  // Apply styles
  mermaid += `\n%% Apply styles\n`;
  Object.entries(layerGroups).forEach(([layer, nodes]) => {
    nodes.forEach(node => {
      const nodeId = sanitizeId(node.id);
      
      // Check if this is a grouped node
      if (node.meta?.isGrouped) {
        mermaid += `${nodeId}:::grouped\n`;
      } else {
        // Apply icon-specific styling based on node type
        const nodeType = node.type?.toLowerCase() || 'custom';
        const iconClass = `icon-${nodeType}`;
        mermaid += `${nodeId}:::${iconClass}\n`;
      }
    });
  });
  
  return mermaid;
}

function groupNodesByLayer(nodes: ArchNode[]): Record<string, ArchNode[]> {
  const groups: Record<string, ArchNode[]> = {};
  
  nodes.forEach(node => {
    if (!groups[node.layer]) {
      groups[node.layer] = [];
    }
    groups[node.layer].push(node);
  });
  
  return groups;
}

function sanitizeId(id: string): string {
  // Replace special characters and spaces with underscores
  return id.replace(/[^a-zA-Z0-9]/g, '_');
}

function escapeLabel(label: string): string {
  // Escape special characters in Mermaid labels
  return label.replace(/"/g, '&quot;').replace(/\n/g, '<br>');
}

function renderNode(node: ArchNode): string {
  const nodeId = sanitizeId(node.id);
  const nodeLabel = escapeLabel(node.label);
  
  // Add Azure service symbols to make nodes more recognizable
  const getAzureSymbol = (nodeType: string): string => {
    switch (nodeType?.toLowerCase()) {
      case 'vm': return '🖥️ ';
      case 'vnet': return '🌐 ';
      case 'sql': return '🗄️ ';
      case 'storage': return '📦 ';
      case 'keyvault': return '🔐 ';
      case 'monitor': return '📊 ';
      case 'firewall': return '🔥 ';
      case 'appgateway': return '🚪 ';
      case 'bastion': return '🏰 ';
      case 'loadbalancer': return '⚖️ ';
      case 'identity': return '👤 ';
      case 'policy': return '📋 ';
      default: return '☁️ ';
    }
  };
  
  const symbol = getAzureSymbol(node.type);
  
  // Check if this is a grouped node
  if (node.meta?.isGrouped) {
    const nodeCount = node.meta.nodeCount || 0;
    const countLabel = nodeCount > 1 ? ` (${nodeCount} nodes)` : '';
    // Use text-based representation for grouped nodes with Azure symbol
    return `  ${nodeId}["${symbol}${nodeLabel}${countLabel}"]\n`;
  } else {
    // Use text-based representation for regular nodes with Azure symbol
    return `  ${nodeId}["${symbol}${nodeLabel}"]\n`;
  }
}



// Alternative renderer for more complex layouts
export function architectureToMermaidAdvanced(
  model: ArchitectureModel,
  options: ArchitectureOptions = {}
): string {
  const { direction = 'LR' } = options;
  
  // Validate the model first
  const validation = validateModel(model);
  if (validation.warnings.length > 0) {
    console.warn('Mermaid validation warnings:', validation.warnings);
  }
  
  const { sanitizedModel } = validation;
  
  let mermaid = `flowchart ${direction}\n`;
  
  // Define node styles with more sophisticated styling
  mermaid += `\n%% Node styles\n`;
  mermaid += `classDef connectivity fill:#e3f2fd,stroke:#1976d2,stroke-width:3px,color:#0d47a1\n`;
  mermaid += `classDef networking fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px,color:#4a148c\n`;
  mermaid += `classDef compute fill:#e8f5e8,stroke:#388e3c,stroke-width:3px,color:#1b5e20\n`;
  mermaid += `classDef data fill:#fff3e0,stroke:#f57c00,stroke-width:3px,color:#e65100\n`;
  mermaid += `classDef security fill:#ffebee,stroke:#d32f2f,stroke-width:3px,color:#b71c1c\n`;
  mermaid += `classDef identity fill:#f1f8e9,stroke:#689f38,stroke-width:3px,color:#33691e\n`;
  mermaid += `classDef management fill:#e0f2f1,stroke:#00796b,stroke-width:3px,color:#004d40\n`;
  mermaid += `classDef observability fill:#fce4ec,stroke:#c2185b,stroke-width:3px,color:#880e4f\n`;
  
  // Group nodes by layer and create subgraphs
  const layerGroups = groupNodesByLayer(sanitizedModel.nodes);
  
  // Define layer order for left-to-right flow
  const layerOrder = [
    'Connectivity',
    'Networking', 
    'Compute',
    'Data',
    'Observability'
  ];
  
  // Create subgraphs for main layers
  layerOrder.forEach(layer => {
    const nodes = layerGroups[layer];
    if (nodes && nodes.length > 0) {
      const groupId = generateGroupId(layer);
      mermaid += `\n%% ${layer} Layer\n`;
      mermaid += `subgraph ${groupId}["${layer} Layer"]\n`;
      
      // Sort nodes within layer for better organization
      const sortedNodes = sortNodesWithinLayer(nodes, layer);
      
      sortedNodes.forEach(node => {
        mermaid += renderNode(node);
      });
      
      mermaid += `end\n`;
    }
  });
  
  // Create side subgraphs for cross-cutting concerns
  const sideLayers = ['Identity', 'Security', 'Management'];
  sideLayers.forEach(layer => {
    const nodes = layerGroups[layer];
    if (nodes && nodes.length > 0) {
      const groupId = generateGroupId(layer);
      mermaid += `\n%% ${layer} Layer\n`;
      mermaid += `subgraph ${groupId}["${layer}"]\n`;
      
      nodes.forEach(node => {
        mermaid += renderNode(node);
      });
      
      mermaid += `end\n`;
    }
  });
  
  // Add edges with better organization
  mermaid += `\n%% Edges\n`;
  
  // Group edges by type for better visualization
  const connectivityEdges = sanitizedModel.edges.filter(edge => 
    isConnectivityEdge(edge, sanitizedModel.nodes)
  );
  const dataEdges = sanitizedModel.edges.filter(edge => 
    isDataEdge(edge, sanitizedModel.nodes)
  );
  const securityEdges = sanitizedModel.edges.filter(edge => 
    isSecurityEdge(edge, sanitizedModel.nodes)
  );
  
  // Add connectivity edges first
  connectivityEdges.forEach(edge => {
    const fromId = sanitizeId(edge.from);
    const toId = sanitizeId(edge.to);
    const edgeLabel = edge.label ? `|${escapeLabel(edge.label)}|` : '';
    mermaid += `${fromId} -.->${edgeLabel} ${toId}\n`;
  });
  
  // Add data edges
  dataEdges.forEach(edge => {
    const fromId = sanitizeId(edge.from);
    const toId = sanitizeId(edge.to);
    const edgeLabel = edge.label ? `|${escapeLabel(edge.label)}|` : '';
    mermaid += `${fromId} -->${edgeLabel} ${toId}\n`;
  });
  
  // Add security edges
  securityEdges.forEach(edge => {
    const fromId = sanitizeId(edge.from);
    const toId = sanitizeId(edge.to);
    const edgeLabel = edge.label ? `|${escapeLabel(edge.label)}|` : '';
    mermaid += `${fromId} -.->${edgeLabel} ${toId}\n`;
  });
  
  // Apply styles
  mermaid += `\n%% Apply styles\n`;
  Object.entries(layerGroups).forEach(([layer, nodes]) => {
    nodes.forEach(node => {
      const nodeId = sanitizeId(node.id);
      const layerClass = layer.toLowerCase();
      mermaid += `${nodeId}:::${layerClass}\n`;
    });
  });
  
  return mermaid;
}

function sortNodesWithinLayer(nodes: ArchNode[], layer: string): ArchNode[] {
  // Sort nodes within a layer for better organization
  switch (layer) {
    case 'Connectivity':
      // Sort: Front Door/App Gateway first, then Firewall, then Bastion
      return nodes.sort((a, b) => {
        const order = { frontdoor: 1, appgw: 2, firewall: 3, bastion: 4 };
        return (order[a.type as keyof typeof order] || 5) - (order[b.type as keyof typeof order] || 5);
      });
    case 'Networking':
      // Sort: VNets first, then subnets, then NSGs
      return nodes.sort((a, b) => {
        const order = { vnet: 1, subnet: 2, nsg: 3, lb: 4 };
        return (order[a.type as keyof typeof order] || 5) - (order[b.type as keyof typeof order] || 5);
      });
    case 'Compute':
      // Sort: VMs by role (web, app, database)
      return nodes.sort((a, b) => {
        const roleOrder = { web: 1, app: 2, database: 3, general: 4 };
        const aRole = a.meta?.role || 'general';
        const bRole = b.meta?.role || 'general';
        return (roleOrder[aRole as keyof typeof roleOrder] || 5) - (roleOrder[bRole as keyof typeof roleOrder] || 5);
      });
    default:
      return nodes;
  }
}

function isConnectivityEdge(edge: ArchEdge, nodes: ArchNode[]): boolean {
  const fromNode = nodes.find(n => n.id === edge.from);
  const toNode = nodes.find(n => n.id === edge.to);
  return fromNode?.layer === 'Connectivity' || toNode?.layer === 'Connectivity';
}

function isDataEdge(edge: ArchEdge, nodes: ArchNode[]): boolean {
  const fromNode = nodes.find(n => n.id === edge.from);
  const toNode = nodes.find(n => n.id === edge.to);
  return fromNode?.layer === 'Data' || toNode?.layer === 'Data';
}

function isSecurityEdge(edge: ArchEdge, nodes: ArchNode[]): boolean {
  const fromNode = nodes.find(n => n.id === edge.from);
  const toNode = nodes.find(n => n.id === edge.to);
  return fromNode?.layer === 'Security' || toNode?.layer === 'Security';
} 