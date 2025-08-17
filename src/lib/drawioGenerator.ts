import { ArchitectureModel, ArchNode, ArchEdge } from '../types/architecture';
import { getDrawioIconForNodeType } from './azureIconMap';
import type { Bounds } from './layout';

export interface DrawioOptions {
  showLegend?: boolean;
  nodeWidth?: number;
  nodeHeight?: number;
}

export function architectureToDrawioXml(
  model: ArchitectureModel,
  opts: DrawioOptions = {}
): string {
  const { showLegend = true, nodeWidth = 120, nodeHeight = 70 } = opts;

  // Calculate diagram bounds
  const bounds = calculateDiagramBounds(model);
  
  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2024-01-01T00:00:00.000Z" agent="5.0" etag="xxx" version="22.1.16" type="device">
  <diagram name="Azure Architecture" id="azure-arch">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${bounds.width}" pageHeight="${bounds.height}" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        
        <!-- Layer Groups -->
        ${generateLayerGroups(model)}
        
        <!-- Nodes -->
        ${generateNodes(model.nodes)}
        
        <!-- Edges -->
        ${generateEdges(model.edges)}
        
        ${showLegend ? generateLegend(bounds) : ''}
        
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

  return xml;
}

function calculateDiagramBounds(model: ArchitectureModel): Bounds {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  model.nodes.forEach(node => {
    const bounds = node.meta?.bounds;
    if (bounds) {
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.w);
      maxY = Math.max(maxY, bounds.y + bounds.h);
    }
  });
  
  // Add padding
  const padding = 100;
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + (padding * 2),
    height: maxY - minY + (padding * 2)
  };
}

function generateLayerGroups(model: ArchitectureModel): string {
  const layerOrder = ['Connectivity', 'Networking', 'Compute', 'Data', 'Observability', 'Security', 'Identity'];
  const layerColors: Record<string, string> = {
    'Connectivity': '#e1f5fe',
    'Networking': '#f3e5f5',
    'Compute': '#e8f5e8',
    'Data': '#fff3e0',
    'Observability': '#fce4ec',
    'Security': '#ffebee',
    'Identity': '#f1f8e9'
  };
  
  return layerOrder.map((layer, index) => {
    const nodes = model.nodes.filter(n => n.layer === layer);
    if (nodes.length === 0) return '';
    
    const bounds = calculateLayerBounds(nodes);
    const color = layerColors[layer] || '#f5f5f5';
    
    return `
        <!-- Layer: ${layer} -->
        <mxCell id="layer-${index}" value="${layer}" style="swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize=30;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;whiteSpace=wrap;html=1;fillColor=${color};strokeColor=#666666;fontColor=#333333;opacity=50;" vertex="1" parent="1">
          <mxGeometry x="${bounds.x - 20}" y="${bounds.y - 20}" width="${bounds.width + 40}" height="${bounds.height + 40}" as="geometry" />
        </mxCell>`;
  }).join('');
}

function calculateLayerBounds(nodes: ArchNode[]): Bounds {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  nodes.forEach(node => {
    const bounds = node.meta?.bounds;
    if (bounds) {
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.w);
      maxY = Math.max(maxY, bounds.y + bounds.h);
    }
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function generateNodes(nodes: ArchNode[]): string {
  return nodes.map(node => {
    const bounds = node.meta?.bounds;
    if (!bounds) return '';

    const iconPath = getDrawioIconForNodeType(node.type || 'custom');
    const label = truncateLabel(node.label, 24);

    // Check if this is a grouped node
    if (node.meta?.isGrouped) {
      const nodeCount = node.meta.nodeCount || 0;
      const countLabel = nodeCount > 1 ? ` (${nodeCount} nodes)` : '';
      
      return `
        <!-- Grouped Node: ${node.id} -->
        <mxCell id="node-${node.id}" value="${label}${countLabel}" style="shape=image;image=${iconPath};imageWidth=48;imageHeight=48;labelPosition=bottom;verticalLabelPosition=middle;align=center;verticalAlign=top;fontSize=10;fontColor=#333333;strokeColor=#f57c00;strokeWidth=3;fillColor=#ffffff;" vertex="1" parent="1">
          <mxGeometry x="${bounds.x}" y="${bounds.y}" width="48" height="72" as="geometry" />
        </mxCell>`;
    } else {
      return `
        <!-- Node: ${node.id} -->
        <mxCell id="node-${node.id}" value="${label}" style="shape=image;image=${iconPath};imageWidth=48;imageHeight=48;labelPosition=bottom;verticalLabelPosition=middle;align=center;verticalAlign=top;fontSize=10;fontColor=#333333;strokeColor=#0078d4;strokeWidth=2;fillColor=#ffffff;" vertex="1" parent="1">
          <mxGeometry x="${bounds.x}" y="${bounds.y}" width="48" height="72" as="geometry" />
        </mxCell>`;
    }
  }).join('');
}

function generateEdges(edges: ArchEdge[]): string {
  return edges.map((edge, index) => {
    // Handle edge labels (including count labels)
    const edgeLabel = edge.label ? ` value="${edge.label}"` : '';
    const labelStyle = edge.label ? 'labelBackgroundColor=#ffffff;labelBorderColor=#cccccc;labelBorderWidth=1;fontSize=8;fontColor=#666666;' : '';

    return `
        <!-- Edge: ${edge.from} -> ${edge.to} -->
        <mxCell id="edge-${index}" edge="1" parent="1" source="node-${edge.from}" target="node-${edge.to}"${edgeLabel}>
          <mxGeometry relative="1" as="geometry" />
          <mxCell id="edge-style-${index}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#666666;strokeWidth=2;${labelStyle}" edge="1" parent="edge-${index}" />
        </mxCell>`;
  }).join('');
}

function generateLegend(bounds: Bounds): string {
  const legendX = bounds.x + bounds.width - 200;
  const legendY = bounds.y + 20;
  
  return `
        <!-- Legend -->
        <mxCell id="legend" value="Legend" style="swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize=30;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;whiteSpace=wrap;html=1;fillColor=#f8f9fa;strokeColor=#dee2e6;fontColor=#495057;" vertex="1" parent="1">
          <mxGeometry x="${legendX}" y="${legendY}" width="180" height="120" as="geometry" />
        </mxCell>
        
        <!-- Legend Items -->
        <mxCell id="legend-grouped" value="Grouped Node (×N)" style="shape=image;image=/azure-icons/vm.svg;imageWidth=24;imageHeight=24;labelPosition=right;verticalLabelPosition=middle;align=left;verticalAlign=middle;fontSize=10;fontColor=#333333;strokeColor=#f57c00;strokeWidth=2;fillColor=#ffffff;" vertex="1" parent="legend">
          <mxGeometry x="10" y="40" width="24" height="36" as="geometry" />
        </mxCell>
        
        <mxCell id="legend-edge" value="Edge with count (×N)" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=10;fontColor=#666666;" vertex="1" parent="legend">
          <mxGeometry x="10" y="80" width="160" height="20" as="geometry" />
        </mxCell>`;
}

function truncateLabel(label: string, maxLength: number): string {
  if (label.length <= maxLength) return label;
  return label.substring(0, maxLength - 3) + '...';
}

// Validation functions
export function validateArchitectureModel(model: ArchitectureModel): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for unique IDs
  const nodeIds = new Set<string>();
  model.nodes.forEach(node => {
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node ID: ${node.id}`);
    }
    nodeIds.add(node.id);
  });

  // Check for self-edges
  model.edges.forEach(edge => {
    if (edge.from === edge.to) {
      errors.push(`Self-edge detected: ${edge.from} -> ${edge.to}`);
    }
  });

  // Check connector limits
  const connectorCount = new Map<string, number>();
  model.edges.forEach(edge => {
    connectorCount.set(edge.from, (connectorCount.get(edge.from) || 0) + 1);
    connectorCount.set(edge.to, (connectorCount.get(edge.to) || 0) + 1);
  });

  connectorCount.forEach((count, nodeId) => {
    if (count > 6) {
      errors.push(`Node ${nodeId} has too many connectors: ${count} (max 6)`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}
