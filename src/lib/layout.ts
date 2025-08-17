import type { ArchitectureModel, ArchNode, ArchEdge } from '@/types/architecture';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  interLayerSpacing?: number;
  intraLayerSpacing?: number;
}

const DEFAULT_LAYOUT_OPTIONS: Required<LayoutOptions> = {
  nodeWidth: 120,
  nodeHeight: 70,
  interLayerSpacing: 140,
  intraLayerSpacing: 80
};

/**
 * Apply deterministic layout to architecture model
 * Uses layered layout with left-to-right flow
 */
export function applyElkLayout(
  model: ArchitectureModel, 
  options: LayoutOptions = {}
): ArchitectureModel {
  const opts = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
  
  // Define layer order (columns)
  const layerOrder = [
    'Connectivity',
    'Networking', 
    'Compute',
    'Data',
    'Observability',
    'Security',
    'Identity'
  ];
  
  // Group nodes by layer
  const nodesByLayer = new Map<string, ArchNode[]>();
  layerOrder.forEach(layer => {
    nodesByLayer.set(layer, []);
  });
  
  // Categorize nodes
  model.nodes.forEach(node => {
    const layer = node.layer || 'Compute';
    if (nodesByLayer.has(layer)) {
      nodesByLayer.get(layer)!.push(node);
    } else {
      // Default to Compute layer for unknown layers
      nodesByLayer.get('Compute')!.push(node);
    }
  });
  
  // Calculate positions
  let currentX = 0;
  const updatedNodes = model.nodes.map(node => {
    const layer = node.layer || 'Compute';
    const layerIndex = layerOrder.indexOf(layer);
    const layerNodes = nodesByLayer.get(layer) || [];
    const nodeIndex = layerNodes.findIndex(n => n.id === node.id);
    
    // Calculate X position (layer-based)
    const x = currentX + (layerIndex * opts.interLayerSpacing);
    
    // Calculate Y position (within layer)
    const y = nodeIndex * opts.intraLayerSpacing;
    
    // Update node with bounds
    return {
      ...node,
      meta: {
        ...node.meta,
        bounds: {
          x,
          y,
          width: opts.nodeWidth,
          height: opts.nodeHeight
        }
      }
    };
  });
  
  // Update currentX for next layer
  const maxLayerIndex = Math.max(...layerOrder.map((_, i) => i));
  currentX = maxLayerIndex * opts.interLayerSpacing;
  
  return {
    ...model,
    nodes: updatedNodes
  };
}

/**
 * Get layer bounds for grouping visualization
 */
export function getLayerBounds(
  model: ArchitectureModel,
  options: LayoutOptions = {}
): Record<string, Bounds> {
  const opts = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
  
  const layerBounds: Record<string, Bounds> = {};
  const nodesByLayer = new Map<string, ArchNode[]>();
  
  // Group nodes by layer
  model.nodes.forEach(node => {
    const layer = node.layer || 'Compute';
    if (!nodesByLayer.has(layer)) {
      nodesByLayer.set(layer, []);
    }
    nodesByLayer.get(layer)!.push(node);
  });
  
  // Calculate bounds for each layer
  nodesByLayer.forEach((nodes, layer) => {
    if (nodes.length === 0) return;
    
    const bounds = nodes.reduce((acc, node) => {
      const nodeBounds = node.meta?.bounds;
      if (!nodeBounds) return acc;
      
      return {
        x: Math.min(acc.x, nodeBounds.x),
        y: Math.min(acc.y, nodeBounds.y),
        width: Math.max(acc.width, nodeBounds.x + nodeBounds.width - acc.x),
        height: Math.max(acc.height, nodeBounds.y + nodeBounds.height - acc.y)
      };
    }, { x: Infinity, y: Infinity, width: 0, height: 0 });
    
    // Add padding
    const padding = 20;
    layerBounds[layer] = {
      x: bounds.x - padding,
      y: bounds.y - padding,
      width: bounds.width + (padding * 2),
      height: bounds.height + (padding * 2)
    };
  });
  
  return layerBounds;
}
