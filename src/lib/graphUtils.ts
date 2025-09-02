import type { ArchitectureModel, ArchNode, ArchEdge } from '@/types/architecture';
import type { DiagramOptions } from '@/types/diagramOptions';
import { DEFAULT_DIAGRAM_OPTIONS } from '@/types/diagramOptions';
import { applyGrouping } from './grouping';

/**
 * Bundle edges at group level to ensure ≤1 connector per visible pair
 */
export function bundleEdgesAtGroupLevel(
  model: ArchitectureModel, 
  grouping: Record<string, string[]>
): ArchitectureModel {
  const edgeMap = new Map<string, { from: string; to: string; labels: string[]; count: number }>();
  
  // Process each edge
  model.edges.forEach(edge => {
    const sourceGroup = findNodeGroup(edge.from, grouping);
    const targetGroup = findNodeGroup(edge.to, grouping);
    
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
  
  // Convert to edges with count labels
  const bundledEdges = Array.from(edgeMap.values()).map(e => ({
    from: e.from,
    to: e.to,
    label: e.count > 1 ? `×${e.count}` : e.labels[0] || undefined
  }));
  
  return { ...model, edges: bundledEdges };
}

/**
 * Find which group a node belongs to
 */
function findNodeGroup(nodeId: string, grouping: Record<string, string[]>): string | null {
  for (const [groupId, nodeIds] of Object.entries(grouping)) {
    if (nodeIds.includes(nodeId)) {
      return groupId;
    }
  }
  return null;
}

/**
 * Remove duplicate edges and self-edges from the architecture model
 */
export function dedupeEdges(model: ArchitectureModel): ArchitectureModel {
  const uniqueEdges = new Map<string, ArchEdge>();
  
  for (const edge of model.edges) {
    // Skip self-edges
    if (edge.from === edge.to) {
      continue;
    }
    
    // Create a unique key for the edge (direction matters)
    const edgeKey = `${edge.from}->${edge.to}`;
    
    if (!uniqueEdges.has(edgeKey)) {
      uniqueEdges.set(edgeKey, edge);
    }
  }
  
  return {
    ...model,
    edges: Array.from(uniqueEdges.values())
  };
}

/**
 * Merge duplicate edges between the same components into a single edge with count labels
 */
export function mergeDuplicateEdges(model: ArchitectureModel, showCounts = true): ArchitectureModel {
  const seen = new Map<string, { from: string; to: string; label?: string; count: number }>();

  for (const edge of model.edges) {
    // Skip self-edges
    if (edge.from === edge.to) {
      continue;
    }
    
    const key = `${edge.from}-->${edge.to}`;
    if (!seen.has(key)) {
      seen.set(key, { 
        from: edge.from, 
        to: edge.to, 
        label: edge.label, 
        count: 1 
      });
    } else {
      const existing = seen.get(key)!;
      existing.count += 1;
      // Optionally merge labels if they're different
      if (edge.label && edge.label !== existing.label) {
        existing.label = existing.label 
          ? `${existing.label}, ${edge.label}` 
          : edge.label;
      }
    }
  }

  const mergedEdges = Array.from(seen.values()).map(e => ({
    from: e.from,
    to: e.to,
    label: showCounts && e.count > 1 
      ? `${e.label ?? ''} ×${e.count}`.trim() 
      : e.label
  }));

  return { ...model, edges: mergedEdges };
}

/**
 * Count incoming and outgoing edges for each node
 */
function getNodeConnectorCounts(model: ArchitectureModel): Map<string, { incoming: number; outgoing: number; total: number }> {
  const counts = new Map<string, { incoming: number; outgoing: number; total: number }>();
  
  // Initialize counts for all nodes
  for (const node of model.nodes) {
    counts.set(node.id, { incoming: 0, outgoing: 0, total: 0 });
  }
  
  // Count edges
  for (const edge of model.edges) {
    const fromCounts = counts.get(edge.from);
    const toCounts = counts.get(edge.to);
    
    if (fromCounts) {
      fromCounts.outgoing++;
      fromCounts.total++;
    }
    
    if (toCounts) {
      toCounts.incoming++;
      toCounts.total++;
    }
  }
  
  return counts;
}

/**
 * Create a secondary overflow hub for a specific node
 */
function createSecondaryOverflowHub(
  parentNodeId: string, 
  parentNode: ArchNode, 
  existingIds: Set<string>, 
  overflowCount: number
): ArchNode {
  let hubId = `hub_${parentNodeId}_overflow_${overflowCount}`;
  
  while (existingIds.has(hubId)) {
    overflowCount++;
    hubId = `hub_${parentNodeId}_overflow_${overflowCount}`;
  }
  
  existingIds.add(hubId);
  
  return {
    id: hubId,
    type: 'custom',
    label: 'More connections',
    layer: parentNode.layer,
    meta: { 
      isHub: true, 
      hubType: 'overflow', 
      parentNode: parentNodeId,
      overflowLevel: overflowCount,
      tooltip: `Aggregated connections from ${parentNode.label || parentNodeId}`
    }
  };
}

/**
 * Recursively limit connectors per node by creating overflow hubs as needed
 */
export function limitConnectors(
  model: ArchitectureModel, 
  options: DiagramOptions = {}
): ArchitectureModel {
  try {
    const opts = { ...DEFAULT_DIAGRAM_OPTIONS, ...options };
    const maxConnectors = opts.maxConnectorsPerNode;
    
    // Validate input model
    if (!model || !model.nodes || !model.edges) {
      console.warn('⚠️ [GraphUtils] Invalid model provided to limitConnectors');
      return model;
    }
    
    // Ensure nodes and edges are arrays
    if (!Array.isArray(model.nodes) || !Array.isArray(model.edges)) {
      console.warn('⚠️ [GraphUtils] Model nodes or edges are not arrays');
      return model;
    }
    
    let currentModel = { ...model };
    let iteration = 0;
    const maxIterations = 100; // Safety limit to prevent infinite loops
    
    while (iteration < maxIterations) {
      const connectorCounts = getNodeConnectorCounts(currentModel);
      let hasOverflow = false;
      
      // Check if any node exceeds the connector limit
      for (const [nodeId, counts] of connectorCounts) {
        if (counts.total <= maxConnectors) {
          continue;
        }
        
        hasOverflow = true;
        const node = currentModel.nodes.find(n => n && n.id === nodeId);
        if (!node) {
          console.warn(`⚠️ [GraphUtils] Node ${nodeId} not found in model`);
          continue;
        }
        
        console.log(`🔍 [GraphUtils] Creating overflow hub for node ${nodeId} (${counts.total} > ${maxConnectors})`);
        
        // Create overflow hub for this node
        const existingIds = new Set(currentModel.nodes.map(n => n && n.id).filter(Boolean));
        const overflowHub = createSecondaryOverflowHub(nodeId, node, existingIds, 1);
        
        if (!overflowHub || !overflowHub.id) {
          console.warn(`⚠️ [GraphUtils] Failed to create overflow hub for node ${nodeId}`);
          continue;
        }
        
        // Get all edges connected to this node
        const connectedEdges = currentModel.edges.filter(edge => 
          edge.from === nodeId || edge.to === nodeId
        );
        
        if (connectedEdges.length === 0) {
          console.warn(`⚠️ [GraphUtils] Node ${nodeId} has no connected edges, skipping`);
          continue;
        }
        
        // Reroute all edges through the overflow hub to ensure the node stays within limit
        const newEdges: ArchEdge[] = [];
        for (const edge of connectedEdges) {
          // Validate edge structure
          if (!edge || typeof edge.from !== 'string' || typeof edge.to !== 'string') {
            console.warn(`⚠️ [GraphUtils] Invalid edge structure:`, edge);
            continue;
          }
          
          try {
            if (edge.from === nodeId) {
              // Outgoing edge: node -> overflowHub -> target
              newEdges.push({ from: nodeId, to: overflowHub.id });
              newEdges.push({ from: overflowHub.id, to: edge.to });
            } else if (edge.to === nodeId) {
              // Incoming edge: source -> overflowHub -> node
              newEdges.push({ from: edge.from, to: overflowHub.id });
              newEdges.push({ from: overflowHub.id, to: nodeId });
            } else {
              console.warn(`⚠️ [GraphUtils] Edge ${edge.from} -> ${edge.to} not connected to node ${nodeId}`);
            }
          } catch (edgeError) {
            console.warn(`⚠️ [GraphUtils] Error processing edge ${edge.from} -> ${edge.to}:`, edgeError);
          }
        }
        
        // Remove all edges connected to this node and add new ones through the hub
        const remainingEdges = currentModel.edges.filter(edge => 
          edge.from !== nodeId && edge.to !== nodeId
        );
        
        // Ensure we have valid arrays before updating the model
        if (!Array.isArray(remainingEdges) || !Array.isArray(newEdges)) {
          console.warn(`⚠️ [GraphUtils] Invalid edge arrays, skipping update for node ${nodeId}`);
          continue;
        }
        
        currentModel = {
          nodes: [...currentModel.nodes, overflowHub],
          edges: [...remainingEdges, ...newEdges]
        };
        
        break; // Process one node at a time to avoid conflicts
      }
      
      if (!hasOverflow) {
        console.log(`✅ [GraphUtils] All nodes are within connector limit after ${iteration} iterations`);
        break;
      }
      
      iteration++;
    }
    
    if (iteration >= maxIterations) {
      console.warn(`⚠️ [GraphUtils] Reached maximum iterations (${maxIterations}) while limiting connectors`);
    }
    
    // Final validation
    const finalCounts = getNodeConnectorCounts(currentModel);
    for (const [nodeId, counts] of finalCounts) {
      if (counts.total > maxConnectors) {
        console.error(`❌ [GraphUtils] FATAL: Node ${nodeId} still has ${counts.total} connectors (limit: ${maxConnectors})`);
      }
    }
    
    return currentModel;
  } catch (error) {
    console.error('❌ [GraphUtils] Error in limitConnectors:', error);
    // Return the original model if optimization fails
    return model;
  }
}

/**
 * Validate that no node exceeds the connector limit
 */
export function validateModel(
  model: ArchitectureModel, 
  options: DiagramOptions = {}
): { isValid: boolean; errors: string[] } {
  const opts = { ...DEFAULT_DIAGRAM_OPTIONS, ...options };
  const maxConnectors = opts.maxConnectorsPerNode;
  const errors: string[] = [];
  
  const connectorCounts = getNodeConnectorCounts(model);
  
  for (const [nodeId, counts] of connectorCounts) {
    // Skip validation for grouped nodes since they represent multiple nodes
    const node = model.nodes.find(n => n.id === nodeId);
    if (node?.meta?.isGrouped) {
      console.log(`🔍 [GraphUtils] Skipping validation for grouped node: ${nodeId}`);
      continue;
    }
    
    if (counts.total > maxConnectors) {
      const nodeLabel = node?.label || nodeId;
      errors.push(`Node "${nodeLabel}" (${nodeId}) has ${counts.total} connectors, exceeding limit of ${maxConnectors}`);
    }
  }
  
  if (errors.length > 0) {
    console.error(`❌ [GraphUtils] Model validation failed with ${errors.length} errors:`);
    errors.forEach(error => console.error(`  - ${error}`));
  } else {
    console.log(`✅ [GraphUtils] Model validation passed - all nodes within connector limit`);
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Apply all graph optimizations in the correct order
 */
export function optimizeGraph(
  model: ArchitectureModel, 
  options: DiagramOptions = {}
): ArchitectureModel {
  const opts = { ...DEFAULT_DIAGRAM_OPTIONS, ...options };
  
  // Step 1: Deduplicate edges (remove exact duplicates)
  let optimized = dedupeEdges(model);
  
  // Step 2: Merge duplicate edges between same components with count labels
  optimized = mergeDuplicateEdges(optimized, opts.showEdgeCounts);
  
  // Step 3: Apply grouping if specified (replaces overflow hubs)
  if (opts.groupLevel && opts.groupLevel !== 'none') {
    console.log(`🔍 [GraphUtils] Applying ${opts.groupLevel} grouping to model`);
    optimized = applyGrouping(optimized, opts.groupLevel);
    console.log(`✅ [GraphUtils] Grouping applied: ${optimized.nodes.length} nodes, ${optimized.edges.length} edges`);
  }
  
  // Step 4: Limit connectors per node (only if not grouped)
  if (!opts.groupLevel || opts.groupLevel === 'none') {
    console.log(`🔍 [GraphUtils] Applying connector limiting (max: ${opts.maxConnectorsPerNode})`);
    optimized = limitConnectors(optimized, options);
  }
  
  // Step 5: Validate the final model
  const validation = validateModel(optimized, options);
  if (!validation.isValid) {
    console.warn(`⚠️ [GraphUtils] Model validation failed after optimization, but continuing`);
  } else {
    console.log(`✅ [GraphUtils] Model validation passed`);
  }
  
  return optimized;
}

