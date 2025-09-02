import { ArchitectureModel, ArchNode, ArchEdge, ManagementGroup, Subscription } from '@/types/architecture';

export interface CAFLayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  columnSpacing?: number;
  rowSpacing?: number;
  containerPadding?: number;
}

export class CAFLayoutEngine {
  private options: CAFLayoutOptions;
  private columnAnchors: { [key: string]: number } = {};
  private rowAnchors: { [key: string]: number } = {};

  constructor(options: CAFLayoutOptions = {}) {
    this.options = {
      nodeWidth: 120,
      nodeHeight: 70,
      columnSpacing: 180,
      rowSpacing: 90,
      containerPadding: 20,
      ...options
    };
  }

  applyCAFLayout(model: ArchitectureModel): ArchitectureModel {
    if (!model.managementGroups || !model.subscriptions) {
      return model;
    }

    // Calculate column anchors
    this.calculateColumnAnchors();
    
    // Calculate row anchors for subscriptions
    this.calculateRowAnchors(model);
    
    // Position management groups
    this.positionManagementGroups(model);
    
    // Position subscription containers
    this.positionSubscriptionContainers(model);
    
    // Position nodes within containers
    this.positionNodesWithinContainers(model);
    
    // Position edges
    this.positionEdges(model);
    
    return model;
  }

  private calculateColumnAnchors(): void {
    const { columnSpacing } = this.options;
    
    // Fixed column positions for CAF structure
    this.columnAnchors = {
      'management-groups': 50,
      'platform-subscriptions': 50 + columnSpacing,
      'landing-zone-subscriptions': 50 + (columnSpacing * 2),
      'shared-paas': 50 + (columnSpacing * 3)
    };
  }

  private calculateRowAnchors(model: ArchitectureModel): void {
    const { rowSpacing } = this.options;
    let currentRow = 100;

    // Platform subscriptions (stacked vertically)
    const platformSubs = model.subscriptions!.filter(sub => 
      sub.type.startsWith('platform-')
    );
    
    platformSubs.forEach((sub, index) => {
      this.rowAnchors[sub.id] = currentRow + (index * rowSpacing);
    });

    currentRow += platformSubs.length * rowSpacing + 50;

    // Landing zone subscriptions (side by side)
    const landingZoneSubs = model.subscriptions!.filter(sub => 
      sub.type.startsWith('landingzone-')
    );
    
    landingZoneSubs.forEach((sub, index) => {
      this.rowAnchors[sub.id] = currentRow + (index * rowSpacing);
    });
  }

  private positionManagementGroups(model: ArchitectureModel): void {
    const mgColumn = this.columnAnchors['management-groups'];
    
    model.managementGroups!.forEach((mg, index) => {
      const y = 100 + (index * 80);
      
      // Position the management group container
      mg.meta = {
        ...mg.meta,
        bounds: {
          x: mgColumn,
          y: y,
          w: 150,
          h: 60
        }
      };
    });
  }

  private positionSubscriptionContainers(model: ArchitectureModel): void {
    model.subscriptions!.forEach(sub => {
      let column: number;
      
      if (sub.type.startsWith('platform-')) {
        column = this.columnAnchors['platform-subscriptions'];
      } else if (sub.type.startsWith('landingzone-')) {
        column = this.columnAnchors['landing-zone-subscriptions'];
      } else {
        column = this.columnAnchors['shared-paas'];
      }
      
      const row = this.rowAnchors[sub.id] || 100;
      
      sub.meta = {
        ...sub.meta,
        bounds: {
          x: column,
          y: row,
          w: 200,
          h: 300
        }
      };
    });
  }

  private positionNodesWithinContainers(model: ArchitectureModel): void {
    const { nodeWidth, nodeHeight, containerPadding } = this.options;
    
    model.subscriptions!.forEach(sub => {
      const containerBounds = sub.meta?.bounds;
      if (!containerBounds) return;
      
      const nodesInSubscription = model.nodes.filter(node => 
        node.subscriptionId === sub.id
      );
      
      // Group nodes by type for better organization
      const vnetNodes = nodesInSubscription.filter(n => n.entityType === 'vnet');
      const serviceNodes = nodesInSubscription.filter(n => n.entityType === 'service');
      const tierNodes = nodesInSubscription.filter(n => n.entityType === 'tier');
      const paasNodes = nodesInSubscription.filter(n => n.entityType === 'paas');
      
      let currentY = containerBounds.y + containerPadding + 30; // Space for title
      
      // Position VNet nodes at the top
      vnetNodes.forEach((node, index) => {
        node.bounds = {
          x: containerBounds.x + containerPadding,
          y: currentY + (index * (nodeHeight + 10)),
          w: nodeWidth,
          h: nodeHeight
        };
      });
      
      currentY += vnetNodes.length * (nodeHeight + 10) + 20;
      
      // Position service nodes
      serviceNodes.forEach((node, index) => {
        node.bounds = {
          x: containerBounds.x + containerPadding,
          y: currentY + (index * (nodeHeight + 10)),
          w: nodeWidth,
          h: nodeHeight
        };
      });
      
      currentY += serviceNodes.length * (nodeHeight + 10) + 20;
      
      // Position tier nodes
      tierNodes.forEach((node, index) => {
        node.bounds = {
          x: containerBounds.x + containerPadding,
          y: currentY + (index * (nodeHeight + 10)),
          w: nodeWidth,
          h: nodeHeight
        };
      });
      
      currentY += tierNodes.length * (nodeHeight + 10) + 20;
      
      // Position PaaS nodes
      paasNodes.forEach((node, index) => {
        node.bounds = {
          x: containerBounds.x + containerPadding,
          y: currentY + (index * (nodeHeight + 10)),
          w: nodeWidth,
          h: nodeHeight
        };
      });
    });
  }

  private positionEdges(model: ArchitectureModel): void {
    // For now, we'll let the Draw.io generator handle edge positioning
    // This could be enhanced to calculate edge waypoints for better routing
    model.edges.forEach(edge => {
      // Add metadata for edge positioning if needed
      edge.meta = {
        ...edge.meta,
        routed: true
      };
    });
  }

  // Helper method to get container bounds for a subscription
  getSubscriptionBounds(subscriptionId: string): { x: number; y: number; w: number; h: number } | null {
    // This would be used by the Draw.io generator to position containers
    return null;
  }

  // Helper method to get node bounds
  getNodeBounds(nodeId: string): { x: number; y: number; w: number; h: number } | null {
    // This would be used by the Draw.io generator to position nodes
    return null;
  }
}

// Utility function to apply CAF layout to a model
export function applyCAFLayout(model: ArchitectureModel, options?: CAFLayoutOptions): ArchitectureModel {
  const layoutEngine = new CAFLayoutEngine(options);
  return layoutEngine.applyCAFLayout(model);
}
