import { ArchitectureModel, ArchNode, ArchEdge, ManagementGroup, Subscription } from '../types/architecture';
import { getAzureIconPath } from './cafIconMap';

export interface CAFDrawioOptions {
  showLegend?: boolean;
  nodeWidth?: number;
  nodeHeight?: number;
  containerPadding?: number;
}

// Helper types and functions for parent-relative geometry
type Bounds = { x: number; y: number; w: number; h: number };

function placeIn(parent: Bounds, col: number, row: number, cellSize = { w: 160, h: 140 }, gap = { x: 16, y: 16 }): Bounds {
  const x = gap.x + col * (cellSize.w + gap.x);
  const y = gap.y + row * (cellSize.h + gap.y);
  return { x, y, w: cellSize.w, h: cellSize.h }; // NOTE: relative to parent
}

function getParentBounds(node: ArchNode, nodeMap: Map<string, ArchNode>): Bounds | null {
  if (!node.parentId) return null;
  const parent = nodeMap.get(node.parentId);
  return parent?.bounds || null;
}

function calculateRelativeBounds(node: ArchNode, nodeMap: Map<string, ArchNode>): Bounds {
  const parentBounds = getParentBounds(node, nodeMap);
  
  if (!parentBounds) {
    // No parent, use global coordinates
    return node.bounds || { x: 100, y: 100, w: 120, h: 70 };
  }
  
  // Convert global coordinates to parent-relative coordinates
  const globalBounds = node.bounds || { x: 100, y: 100, w: 120, h: 70 };
  return {
    x: globalBounds.x - parentBounds.x,
    y: globalBounds.y - parentBounds.y,
    w: globalBounds.w,
    h: globalBounds.h
  };
}

export function cafArchitectureToDrawioXml(
  model: ArchitectureModel,
  opts: CAFDrawioOptions = {}
): string {
  const { 
    showLegend = true, 
    nodeWidth = 120, 
    nodeHeight = 70, 
    containerPadding = 20 
  } = opts;

  // Build node map for quick lookup
  const nodeMap = new Map<string, ArchNode>();
  model.nodes.forEach(node => nodeMap.set(node.id, node));

  // Calculate diagram bounds for CAF layout
  const bounds = calculateCAFDiagramBounds(model);
  
  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2024-01-01T00:00:00.000Z" agent="5.0" etag="xxx" version="22.1.16" type="device">
  <diagram name="Azure CAF Architecture" id="azure-caf-arch">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${bounds.width}" pageHeight="${bounds.height}" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        
        <!-- Management Groups -->
        ${generateManagementGroups(model, nodeMap)}
        
        <!-- Subscription Containers -->
        ${generateSubscriptionContainers(model, nodeMap)}
        
        <!-- Nodes -->
        ${generateCAFNodes(model.nodes, nodeMap)}
        
        <!-- Edges -->
        ${generateCAFEdges(model.edges)}
        
        ${showLegend ? generateCAFLegend(bounds) : ''}
        
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

  return xml;
}

function calculateCAFDiagramBounds(model: ArchitectureModel): { width: number; height: number } {
  // For CAF layout, we use fixed dimensions based on the structure
  const width = 1400; // 4 columns * 300 + padding
  const height = 800;  // Based on number of subscriptions
  
  return { width, height };
}

function generateManagementGroups(model: ArchitectureModel, nodeMap: Map<string, ArchNode>): string {
  if (!model.managementGroups) return '';
  
  return model.managementGroups.map(mg => {
    const mgNode = model.nodes.find(n => n.id === mg.id);
    const bounds = mgNode?.bounds || { x: 50, y: 100, w: 150, h: 60 };
    const color = getManagementGroupColor(mg.type);
    
    return `
        <!-- Management Group: ${mg.name} -->
        <mxCell id="${mg.id}" value="${mg.name}" style="swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize=30;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeParentMin=0;resizeLast=0;collapsible=1;marginBottom=0;whiteSpace=wrap;html=1;fillColor=${color};strokeColor=#333333;fontColor=#ffffff;fontSize=12;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="${bounds.x}" y="${bounds.y}" width="${bounds.w}" height="${bounds.h}" as="geometry" />
        </mxCell>`;
  }).join('');
}

function generateSubscriptionContainers(model: ArchitectureModel, nodeMap: Map<string, ArchNode>): string {
  if (!model.subscriptions) return '';
  
  return model.subscriptions.map(sub => {
    const subNode = model.nodes.find(n => n.id === sub.id);
    const bounds = subNode?.bounds || { x: 250, y: 100, w: 200, h: 300 };
    const color = getSubscriptionColor(sub.type);
    
    return `
        <!-- Subscription: ${sub.name} -->
        <mxCell id="${sub.id}" value="Subscription: ${sub.name}" style="swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize=30;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeParentMin=0;resizeLast=0;collapsible=1;marginBottom=0;whiteSpace=wrap;html=1;fillColor=${color};strokeColor=#666666;fontColor=#333333;fontSize=11;fontStyle=1;opacity=80;" vertex="1" parent="1">
          <mxGeometry x="${bounds.x}" y="${bounds.y}" width="${bounds.w}" height="${bounds.h}" as="geometry" />
        </mxCell>`;
  }).join('');
}

function generateCAFNodes(nodes: ArchNode[], nodeMap: Map<string, ArchNode>): string {
  return nodes.map(node => {
    const iconPath = getAzureIconPath(node.type, node.label);
    
    // Determine node style based on entity type
    const style = getNodeStyle(node.entityType, node.layer);
    
    // Determine parent based on containment hierarchy
    const parentId = node.parentId || node.subscriptionId || '1';
    
    // Calculate bounds (parent-relative if has parent, global otherwise)
    const bounds = calculateRelativeBounds(node, nodeMap);
    
    // Truncate label if too long
    const displayLabel = node.label.length > 24 ? node.label.substring(0, 21) + '...' : node.label;
    
    return `
        <!-- Node: ${node.label} -->
        <mxCell id="${node.id}" value="${displayLabel}" style="${style}" vertex="1" parent="${parentId}">
          <mxGeometry x="${bounds.x}" y="${bounds.y}" width="${bounds.w}" height="${bounds.h}" as="geometry" />
        </mxCell>
        <mxCell id="${node.id}-icon" value="" style="shape=image;imageAspect=0;aspect=fixed;verticalLabelPosition=bottom;verticalAlign=top;image=${iconPath};" vertex="1" parent="${parentId}">
          <mxGeometry x="${bounds.x + 5}" y="${bounds.y + 5}" width="30" height="30" as="geometry" />
        </mxCell>`;
  }).join('');
}

function generateCAFEdges(edges: ArchEdge[]): string {
  return edges.map(edge => {
    const style = getEdgeStyle(edge.edgeType, edge.style);
    const label = edge.bundleCount ? `${edge.label} ×${edge.bundleCount}` : edge.label;
    
    return `
        <!-- Edge: ${edge.from} -> ${edge.to} -->
        <mxCell id="edge-${edge.from}-${edge.to}" value="${label || ''}" style="${style}" edge="1" parent="1" source="${edge.from}" target="${edge.to}">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>`;
  }).join('');
}

function generateCAFLegend(bounds: { width: number; height: number }): string {
  const legendX = bounds.width - 250;
  const legendY = 50;
  
  return `
        <!-- Legend -->
        <mxCell id="legend-container" value="Legend" style="swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize=30;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeParentMin=0;resizeLast=0;collapsible=1;marginBottom=0;whiteSpace=wrap;html=1;fillColor=#f8f9fa;strokeColor=#666666;fontColor=#333333;fontSize=12;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="${legendX}" y="${legendY}" width="200" height="250" as="geometry" />
        </mxCell>
        
        <!-- Legend Items -->
        <mxCell id="legend-vnet" value="Virtual Networks" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="legend-container">
          <mxGeometry x="10" y="40" width="120" height="20" as="geometry" />
        </mxCell>
        <mxCell id="legend-vnet-color" value="" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f3e5f5;strokeColor=#7b1fa2;" vertex="1" parent="legend-container">
          <mxGeometry x="140" y="40" width="20" height="15" as="geometry" />
        </mxCell>
        
        <mxCell id="legend-subnet" value="Subnets" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="legend-container">
          <mxGeometry x="10" y="65" width="120" height="20" as="geometry" />
        </mxCell>
        <mxCell id="legend-subnet-color" value="" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e8f5e8;strokeColor=#388e3c;" vertex="1" parent="legend-container">
          <mxGeometry x="140" y="65" width="20" height="15" as="geometry" />
        </mxCell>
        
        <mxCell id="legend-tier" value="Tier Nodes" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="legend-container">
          <mxGeometry x="10" y="90" width="120" height="20" as="geometry" />
        </mxCell>
        <mxCell id="legend-tier-color" value="" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e1f5fe;strokeColor=#0277bd;" vertex="1" parent="legend-container">
          <mxGeometry x="140" y="90" width="20" height="15" as="geometry" />
        </mxCell>
        
        <mxCell id="legend-peering" value="VNet Peering" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="legend-container">
          <mxGeometry x="10" y="115" width="120" height="20" as="geometry" />
        </mxCell>
        <mxCell id="legend-peering-line" value="" style="endArrow=classic;html=1;strokeColor=#1976d2;strokeWidth=2;" edge="1" parent="legend-container">
          <mxGeometry width="50" height="50" relative="1" as="geometry">
            <mxPoint x="140" y="125" as="sourcePoint" />
            <mxPoint x="170" y="125" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        
        <mxCell id="legend-pe" value="Private Endpoint" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="legend-container">
          <mxGeometry x="10" y="140" width="120" height="20" as="geometry" />
        </mxCell>
        <mxCell id="legend-pe-line" value="" style="endArrow=classic;html=1;strokeColor=#f57c00;strokeWidth=2;" edge="1" parent="legend-container">
          <mxGeometry width="50" height="50" relative="1" as="geometry">
            <mxPoint x="140" y="150" as="sourcePoint" />
            <mxPoint x="170" y="150" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        
        <mxCell id="legend-management" value="Management" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="legend-container">
          <mxGeometry x="10" y="165" width="120" height="20" as="geometry" />
        </mxCell>
        <mxCell id="legend-management-line" value="" style="endArrow=classic;html=1;strokeColor=#607d8b;strokeWidth=2;" edge="1" parent="legend-container">
          <mxGeometry width="50" height="50" relative="1" as="geometry">
            <mxPoint x="140" y="175" as="sourcePoint" />
            <mxPoint x="170" y="175" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        
        <mxCell id="legend-dashed" value="Dashed = Governance" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=10;fontStyle=2;" vertex="1" parent="legend-container">
          <mxGeometry x="10" y="190" width="120" height="20" as="geometry" />
        </mxCell>
        <mxCell id="legend-dashed-line" value="" style="endArrow=classic;html=1;strokeColor=#666666;strokeWidth=2;strokeStyle=2;" edge="1" parent="legend-container">
          <mxGeometry width="50" height="50" relative="1" as="geometry">
            <mxPoint x="140" y="200" as="sourcePoint" />
            <mxPoint x="170" y="200" as="targetPoint" />
          </mxGeometry>
        </mxCell>`;
}

function getManagementGroupColor(type: string): string {
  switch (type) {
    case 'tenant-root': return '#2e7d32';
    case 'platform': return '#1976d2';
    case 'landing-zones': return '#f57c00';
    default: return '#666666';
  }
}

function getSubscriptionColor(type: string): string {
  if (type.startsWith('platform-')) {
    return '#e3f2fd';
  } else if (type.startsWith('landingzone-')) {
    return '#fff3e0';
  } else {
    return '#f5f5f5';
  }
}

function getNodeStyle(entityType?: string, layer?: string): string {
  const baseStyle = 'rounded=1;whiteSpace=wrap;html=1;fontSize=10;fontStyle=0;';
  
  if (entityType === 'vnet') {
    return `${baseStyle}fillColor=#f3e5f5;strokeColor=#7b1fa2;fontStyle=1;`;
  } else if (entityType === 'tier') {
    return `${baseStyle}fillColor=#e8f5e8;strokeColor=#388e3c;fontStyle=1;`;
  } else if (entityType === 'service') {
    return `${baseStyle}fillColor=#e1f5fe;strokeColor=#0277bd;`;
  } else if (entityType === 'paas') {
    return `${baseStyle}fillColor=#fff3e0;strokeColor=#f57c00;`;
  } else {
    return `${baseStyle}fillColor=#f5f5f5;strokeColor=#666666;`;
  }
}

function getEdgeStyle(edgeType?: string, style?: string): string {
  const baseStyle = 'endArrow=classic;html=1;strokeWidth=2;';
  
  if (style === 'dashed') {
    return `${baseStyle}strokeColor=#666666;strokeStyle=2;`;
  } else if (edgeType === 'peering') {
    return `${baseStyle}strokeColor=#1976d2;`;
  } else if (edgeType === 'private-endpoint') {
    return `${baseStyle}strokeColor=#f57c00;`;
  } else if (edgeType === 'policy-diagnostics') {
    return `${baseStyle}strokeColor=#388e3c;`;
  } else if (edgeType === 'security') {
    return `${baseStyle}strokeColor=#d32f2f;`;
  } else if (edgeType === 'ingress') {
    return `${baseStyle}strokeColor=#4caf50;`;
  } else if (edgeType === 'east-west') {
    return `${baseStyle}strokeColor=#2196f3;`;
  } else if (edgeType === 'egress') {
    return `${baseStyle}strokeColor=#ff9800;`;
  } else if (edgeType === 'bastion') {
    return `${baseStyle}strokeColor=#9c27b0;`;
  } else if (edgeType === 'management') {
    return `${baseStyle}strokeColor=#607d8b;`;
  } else if (edgeType === 'governance') {
    return `${baseStyle}strokeColor=#795548;strokeStyle=2;`;
  } else {
    return `${baseStyle}strokeColor=#666666;`;
  }
}
