import { ArchitectureModel, ArchNode, ArchEdge } from '@/types/architecture';

export interface DrawioExportOptions {
  showLegend?: boolean;
  nodeWidth?: number;
  nodeHeight?: number;
  containerPadding?: number;
}

// Azure icon mapping
const AZURE_ICON_MAP: Record<string, string> = {
  // Subscriptions
  'subscription': '/azure-icons/vnet.svg',
  
  // Virtual Networks
  'vnet': '/azure-icons/vnet.svg',
  'subnet': '/azure-icons/subnet.svg',
  
  // Compute
  'vm': '/azure-icons/vm.svg',
  'tier': '/azure-icons/vm.svg',
  
  // Networking
  'firewall': '/azure-icons/firewall.svg',
  'bastion': '/azure-icons/bastion.svg',
  'loadbalancer': '/azure-icons/load-balancer.svg',
  'appgw': '/azure-icons/app-gateway.svg',
  
  // Management & Monitoring
  'observability': '/azure-icons/monitor.svg',
  'monitor': '/azure-icons/monitor.svg',
  'loganalytics': '/azure-icons/log-analytics.svg',
  'policy': '/azure-icons/nsg.svg',
  'defender': '/azure-icons/defender.svg',
  
  // Security
  'keyvault': '/azure-icons/key-vault.svg',
  'nsg': '/azure-icons/nsg.svg',
  
  // Data
  'sql': '/azure-icons/sql.svg',
  'storage': '/azure-icons/storage-blob.svg',
  
  // Default fallback
  'default': '/azure-icons/vm.svg'
};

// Style mapping for different entity types
const STYLE_MAP: Record<string, string> = {
  // Subscriptions
  'management': 'swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize=30;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeParentMin=0;resizeLast=0;collapsible=1;marginBottom=0;whiteSpace=wrap;html=1;fillColor=#e3f2fd;strokeColor=#1565c0;fontColor=#1565c0;fontSize=12;fontStyle=1;',
  'connectivity': 'swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize=30;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeParentMin=0;resizeLast=0;collapsible=1;marginBottom=0;whiteSpace=wrap;html=1;fillColor=#f3e5f5;strokeColor=#7b1fa2;fontColor=#7b1fa2;fontSize=12;fontStyle=1;',
  'landingzone': 'swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize=30;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeParentMin=0;resizeLast=0;collapsible=1;marginBottom=0;whiteSpace=wrap;html=1;fillColor=#e8f5e9;strokeColor=#2e7d32;fontColor=#2e7d32;fontSize=12;fontStyle=1;',
  
  // Virtual Networks
  'vnet': 'rounded=1;whiteSpace=wrap;html=1;fontSize=10;fontStyle=1;fillColor=#ede7f6;strokeColor=#7b1fa2;',
  'subnet': 'rounded=1;whiteSpace=wrap;html=1;fontSize=10;fontStyle=0;fillColor=#f5f5f5;strokeColor=#666666;',
  
  // Compute
  'tier': 'rounded=1;whiteSpace=wrap;html=1;fontSize=10;fontStyle=1;fillColor=#e8f5e9;strokeColor=#2e7d32;',
  
  // Services
  'service': 'rounded=1;whiteSpace=wrap;html=1;fontSize=10;fontStyle=0;fillColor=#e1f5fe;strokeColor=#0277bd;',
  
  // Default
  'default': 'rounded=1;whiteSpace=wrap;html=1;fontSize=10;fontStyle=0;fillColor=#f5f5f5;strokeColor=#666666;'
};

// Edge style mapping
const EDGE_STYLE_MAP: Record<string, string> = {
  'peering': 'endArrow=classic;html=1;strokeWidth=2;strokeColor=#1976d2;',
  'management': 'endArrow=classic;html=1;strokeWidth=2;strokeColor=#607d8b;',
  'governance': 'endArrow=classic;html=1;strokeWidth=2;strokeColor=#666666;strokeStyle=2;',
  'security': 'endArrow=classic;html=1;strokeWidth=2;strokeColor=#d32f2f;strokeStyle=2;',
  'east-west': 'endArrow=classic;html=1;strokeWidth=2;strokeColor=#42a5f5;',
  'default': 'endArrow=classic;html=1;strokeWidth=2;strokeColor=#666666;'
};

export function exportToDrawioXml(model: ArchitectureModel, options: DrawioExportOptions = {}): string {
  const { 
    showLegend = true, 
    nodeWidth = 120, 
    nodeHeight = 70, 
    containerPadding = 20 
  } = options;

  // Validate model before export
  const validationErrors = validateModel(model);
  if (validationErrors.length > 0) {
    console.warn('⚠️ [DrawioExporter] Validation errors:', validationErrors);
  }

  // Calculate diagram bounds
  const bounds = calculateDiagramBounds(model);
  
  // Build node map for quick lookup
  const nodeMap = new Map<string, ArchNode>();
  model.nodes.forEach(node => nodeMap.set(node.id, node));

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2024-01-01T00:00:00.000Z" agent="5.0" etag="xxx" version="22.1.16" type="device">
  <diagram name="Azure CAF Subscription Architecture" id="azure-caf-subscription">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${bounds.width}" pageHeight="${bounds.height}" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        
        <!-- Generate nodes in hierarchical order -->
        ${generateHierarchicalNodes(model.nodes, nodeMap)}
        
        <!-- Edges -->
        ${generateEdges(model.edges)}
        
        ${showLegend ? generateLegend(bounds) : ''}
        
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

  return xml;
}



function generateHierarchicalNodes(nodes: ArchNode[], nodeMap: Map<string, ArchNode>): string {
  let xml = '';
  
  // 1. Generate subscription containers first
  const subscriptionNodes = nodes.filter(node => node.entityType === 'subscription');
  subscriptionNodes.forEach(node => {
    const bounds = node.bounds || { x: 100, y: 100, w: 280, h: 200 };
    const style = getSubscriptionStyle(node.subscriptionType);
    
    xml += `
        <!-- Subscription: ${node.label} -->
        <mxCell id="${node.id}" value="${node.label}" style="${style}" vertex="1" parent="1">
          <mxGeometry x="${bounds.x}" y="${bounds.y}" width="${bounds.w}" height="${bounds.h}" as="geometry" />
        </mxCell>`;
  });
  
  // 2. Generate VNet containers (children of subscriptions)
  const vnetNodes = nodes.filter(node => node.entityType === 'vnet');
  vnetNodes.forEach(node => {
    const bounds = calculateRelativeBounds(node, nodeMap);
    const style = getNodeStyle(node.entityType, node.subscriptionType);
    const parentId = node.parentId || '1';
    const displayLabel = node.label.length > 24 ? node.label.substring(0, 21) + '...' : node.label;
    
    xml += `
        <!-- VNet: ${node.label} -->
        <mxCell id="${node.id}" value="${displayLabel}" style="${style}" vertex="1" parent="${parentId}">
          <mxGeometry x="${bounds.x}" y="${bounds.y}" width="${bounds.w}" height="${bounds.h}" as="geometry" />
        </mxCell>`;
  });
  
  // 3. Generate subnet containers (children of VNets)
  const subnetNodes = nodes.filter(node => node.entityType === 'subnet');
  subnetNodes.forEach(node => {
    const bounds = calculateRelativeBounds(node, nodeMap);
    const style = getNodeStyle(node.entityType, node.subscriptionType);
    const parentId = node.parentId || '1';
    const displayLabel = node.label.length > 24 ? node.label.substring(0, 21) + '...' : node.label;
    
    xml += `
        <!-- Subnet: ${node.label} -->
        <mxCell id="${node.id}" value="${displayLabel}" style="${style}" vertex="1" parent="${parentId}">
          <mxGeometry x="${bounds.x}" y="${bounds.y}" width="${bounds.w}" height="${bounds.h}" as="geometry" />
        </mxCell>`;
  });
  
  // 4. Generate service nodes (children of subnets or subscriptions)
  const serviceNodes = nodes.filter(node => 
    node.entityType !== 'subscription' && 
    node.entityType !== 'vnet' && 
    node.entityType !== 'subnet'
  );
  serviceNodes.forEach(node => {
    const iconPath = getAzureIconPath(node.type, node.label);
    const parentId = node.parentId || '1';
    const bounds = calculateRelativeBounds(node, nodeMap);
    const displayLabel = node.label.length > 24 ? node.label.substring(0, 21) + '...' : node.label;
    
    xml += `
        <!-- Service: ${node.label} -->
        <mxCell id="${node.id}" value="${displayLabel}" style="shape=image;imageAspect=0;aspect=fixed;verticalLabelPosition=bottom;verticalAlign=top;image=${iconPath};whiteSpace=wrap;html=1;fontSize=10;fontStyle=0;fillColor=#e1f5fe;strokeColor=#0277bd;" vertex="1" parent="${parentId}">
          <mxGeometry x="${bounds.x}" y="${bounds.y}" width="${bounds.w}" height="${bounds.h}" as="geometry" />
        </mxCell>`;
  });
  
  return xml;
}

function generateEdges(edges: ArchEdge[]): string {
  // Deduplicate edges and count multiples
  const edgeMap = new Map<string, ArchEdge>();
  
  edges.forEach(edge => {
    const key = `${edge.from}-${edge.to}`;
    if (edgeMap.has(key)) {
      const existing = edgeMap.get(key)!;
      existing.bundleCount = (existing.bundleCount || 1) + 1;
    } else {
      edgeMap.set(key, { ...edge, bundleCount: 1 });
    }
  });

  return Array.from(edgeMap.values()).map(edge => {
    const style = getEdgeStyle(edge.edgeType, edge.style);
    const label = edge.bundleCount && edge.bundleCount > 1 ? `${edge.label} ×${edge.bundleCount}` : edge.label;
    
    return `
        <!-- Edge: ${edge.from} -> ${edge.to} -->
        <mxCell id="edge-${edge.from}-${edge.to}" value="${label || ''}" style="${style}" edge="1" parent="1" source="${edge.from}" target="${edge.to}">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>`;
  }).join('');
}

function generateLegend(bounds: { width: number; height: number }): string {
  const legendX = bounds.width - 250;
  const legendY = 50;
  
  return `
        <!-- Legend -->
        <mxCell id="legend-container" value="Legend" style="swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize=30;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeParentMin=0;resizeLast=0;collapsible=1;marginBottom=0;whiteSpace=wrap;html=1;fillColor=#f8f9fa;strokeColor=#666666;fontColor=#333333;fontSize=12;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="${legendX}" y="${legendY}" width="200" height="200" as="geometry" />
        </mxCell>
        
        <!-- Legend Items -->
        <mxCell id="legend-mgmt" value="Management" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="legend-container">
          <mxGeometry x="10" y="40" width="120" height="20" as="geometry" />
        </mxCell>
        <mxCell id="legend-mgmt-color" value="" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e3f2fd;strokeColor=#1565c0;" vertex="1" parent="legend-container">
          <mxGeometry x="140" y="40" width="20" height="15" as="geometry" />
        </mxCell>
        
        <mxCell id="legend-connectivity" value="Connectivity" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="legend-container">
          <mxGeometry x="10" y="65" width="120" height="20" as="geometry" />
        </mxCell>
        <mxCell id="legend-connectivity-color" value="" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f3e5f5;strokeColor=#7b1fa2;" vertex="1" parent="legend-container">
          <mxGeometry x="140" y="65" width="20" height="15" as="geometry" />
        </mxCell>
        
        <mxCell id="legend-landingzone" value="Landing Zone" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="legend-container">
          <mxGeometry x="10" y="90" width="120" height="20" as="geometry" />
        </mxCell>
        <mxCell id="legend-landingzone-color" value="" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e8f5e9;strokeColor=#2e7d32;" vertex="1" parent="legend-container">
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
        
        <mxCell id="legend-governance" value="Governance" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="legend-container">
          <mxGeometry x="10" y="140" width="120" height="20" as="geometry" />
        </mxCell>
        <mxCell id="legend-governance-line" value="" style="endArrow=classic;html=1;strokeColor=#666666;strokeWidth=2;strokeStyle=2;" edge="1" parent="legend-container">
          <mxGeometry width="50" height="50" relative="1" as="geometry">
            <mxPoint x="140" y="150" as="sourcePoint" />
            <mxPoint x="170" y="150" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        
        <mxCell id="legend-appflow" value="App Flow" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="legend-container">
          <mxGeometry x="10" y="165" width="120" height="20" as="geometry" />
        </mxCell>
        <mxCell id="legend-appflow-line" value="" style="endArrow=classic;html=1;strokeColor=#42a5f5;strokeWidth=2;" edge="1" parent="legend-container">
          <mxGeometry width="50" height="50" relative="1" as="geometry">
            <mxPoint x="140" y="175" as="sourcePoint" />
            <mxPoint x="170" y="175" as="targetPoint" />
          </mxGeometry>
        </mxCell>`;
}

function getAzureIconPath(type: string, label: string): string {
  const iconKey = type.toLowerCase();
  return AZURE_ICON_MAP[iconKey] || AZURE_ICON_MAP['default'];
}

function getSubscriptionStyle(subscriptionType?: string): string {
  if (subscriptionType === 'management') {
    return STYLE_MAP['management'];
  } else if (subscriptionType === 'connectivity') {
    return STYLE_MAP['connectivity'];
  } else if (subscriptionType === 'landingzone') {
    return STYLE_MAP['landingzone'];
  }
  return STYLE_MAP['default'];
}

function getNodeStyle(entityType?: string, subscriptionType?: string): string {
  if (entityType === 'vnet') {
    return STYLE_MAP['vnet'];
  } else if (entityType === 'subnet') {
    return STYLE_MAP['subnet'];
  } else if (entityType === 'tier') {
    return STYLE_MAP['tier'];
  } else if (entityType === 'service') {
    return STYLE_MAP['service'];
  }
  return STYLE_MAP['default'];
}

function getEdgeStyle(edgeType?: string, style?: string): string {
  if (style === 'dashed') {
    return EDGE_STYLE_MAP['governance'];
  } else if (edgeType === 'peering') {
    return EDGE_STYLE_MAP['peering'];
  } else if (edgeType === 'management') {
    return EDGE_STYLE_MAP['management'];
  } else if (edgeType === 'governance') {
    return EDGE_STYLE_MAP['governance'];
  } else if (edgeType === 'security') {
    return EDGE_STYLE_MAP['security'];
  } else if (edgeType === 'east-west') {
    return EDGE_STYLE_MAP['east-west'];
  }
  return EDGE_STYLE_MAP['default'];
}

function calculateRelativeBounds(node: ArchNode, nodeMap: Map<string, ArchNode>): { x: number; y: number; w: number; h: number } {
  const parentBounds = getParentBounds(node, nodeMap);
  
  if (!parentBounds) {
    // No parent, use global coordinates
    return node.bounds || { x: 100, y: 100, w: 120, h: 70 };
  }
  
  // Use parent-relative coordinates if available
  if (node.meta?.boundsRel) {
    return node.meta.boundsRel;
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

function getParentBounds(node: ArchNode, nodeMap: Map<string, ArchNode>): { x: number; y: number; w: number; h: number } | null {
  if (!node.parentId) return null;
  const parent = nodeMap.get(node.parentId);
  return parent?.bounds || null;
}

function calculateDiagramBounds(model: ArchitectureModel): { width: number; height: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  model.nodes.forEach(node => {
    if (node.bounds) {
      minX = Math.min(minX, node.bounds.x);
      minY = Math.min(minY, node.bounds.y);
      maxX = Math.max(maxX, node.bounds.x + node.bounds.w);
      maxY = Math.max(maxY, node.bounds.y + node.bounds.h);
    }
  });

  if (minX === Infinity) {
    return { width: 1200, height: 800 };
  }

  return {
    width: Math.max(1200, maxX - minX + 200),
    height: Math.max(800, maxY - minY + 200)
  };
}

function validateModel(model: ArchitectureModel): string[] {
  const errors: string[] = [];
  const nodeMap = new Map<string, ArchNode>();
  const edgeSet = new Set<string>();

  // Build node map
  model.nodes.forEach(node => nodeMap.set(node.id, node));

  // Validate nodes
  model.nodes.forEach(node => {
    // Check if child fits inside parent using relative bounds
    if (node.parentId && node.meta?.boundsRel) {
      const parent = nodeMap.get(node.parentId);
      if (parent?.bounds) {
        const relativeBounds = node.meta.boundsRel;
        if (relativeBounds.x + relativeBounds.w > parent.bounds.w) {
          errors.push(`Node ${node.id} extends beyond parent width`);
        }
        if (relativeBounds.y + relativeBounds.h > parent.bounds.h) {
          errors.push(`Node ${node.id} extends beyond parent height`);
        }
        if (relativeBounds.x < 0) {
          errors.push(`Node ${node.id} has negative x coordinate relative to parent`);
        }
        if (relativeBounds.y < 0) {
          errors.push(`Node ${node.id} has negative y coordinate relative to parent`);
        }
      }
    }

    // Check if icon resolves
    const iconPath = getAzureIconPath(node.type, node.label);
    if (!iconPath) {
      errors.push(`No icon found for node type: ${node.type}`);
    }
  });

  // Validate edges (check for duplicates)
  model.edges.forEach(edge => {
    const edgeKey = `${edge.from}-${edge.to}`;
    if (edgeSet.has(edgeKey)) {
      errors.push(`Duplicate edge: ${edge.from} -> ${edge.to}`);
    }
    edgeSet.add(edgeKey);

    // Check if source and target nodes exist
    if (!nodeMap.has(edge.from)) {
      errors.push(`Edge source node not found: ${edge.from}`);
    }
    if (!nodeMap.has(edge.to)) {
      errors.push(`Edge target node not found: ${edge.to}`);
    }
  });

  return errors;
}
