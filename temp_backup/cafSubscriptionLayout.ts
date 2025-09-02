import { ArchitectureModel, ArchNode, ArchEdge } from '@/types/architecture';
import { placeGridRel, Bounds } from './cafSubscriptionBuilder';

export interface CafSubscriptionLayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  columnSpacing?: number;
  rowSpacing?: number;
  containerPadding?: number;
  containerMargin?: number;
}

export class CafSubscriptionLayoutEngine {
  private options: CafSubscriptionLayoutOptions;
  private nodeMap: Map<string, ArchNode> = new Map();

  constructor(options: CafSubscriptionLayoutOptions = {}) {
    this.options = {
      nodeWidth: 180,
      nodeHeight: 90,
      columnSpacing: 300,
      rowSpacing: 150,
      containerPadding: 20,
      containerMargin: 30,
      ...options
    };
  }

  applyCafSubscriptionLayout(model: ArchitectureModel): ArchitectureModel {
    // Build node map for quick lookup
    this.nodeMap.clear();
    model.nodes.forEach(node => this.nodeMap.set(node.id, node));

    // Position subscription containers
    this.positionSubscriptionContainers();
    
    // Position management services
    this.positionManagementServices();
    
    // Position connectivity hub
    this.positionConnectivityHub();
    
    // Position landing zones
    this.positionLandingZones();
    
    // Calculate container bounds based on children
    this.calculateContainerBounds(model);
    
    // Validate parent-relative geometry
    this.validateParentRelativeGeometry(model);
    
    return model;
  }

  private positionSubscriptionContainers(): void {
    const { columnSpacing, rowSpacing } = this.options;
    
    // Management Subscription
    const mgmtSub = this.nodeMap.get('sub-mgmt');
    if (mgmtSub) {
      mgmtSub.bounds = {
        x: 50,
        y: 100,
        w: 280,
        h: 200
      };
    }

    // Connectivity Subscription
    const connectivitySub = this.nodeMap.get('sub-connectivity');
    if (connectivitySub) {
      connectivitySub.bounds = {
        x: 50 + (columnSpacing || 200),
        y: 100,
        w: 280,
        h: 200
      };
    }

    // Production Landing Zone Subscription
    const prodSub = this.nodeMap.get('sub-landingzone-prod');
    if (prodSub) {
      prodSub.bounds = {
        x: 50 + ((columnSpacing || 200) * 2),
        y: 100,
        w: 280,
        h: 200
      };
    }

    // Non-Production Landing Zone Subscription
    const nonProdSub = this.nodeMap.get('sub-landingzone-nonprod');
    if (nonProdSub) {
      nonProdSub.bounds = {
        x: 50 + ((columnSpacing || 200) * 3),
        y: 100,
        w: 280,
        h: 200
      };
    }
  }

  private positionManagementServices(): void {
    const mgmtSub = this.nodeMap.get('sub-mgmt');
    if (!mgmtSub?.bounds) return;

    // Observability
    const observability = this.nodeMap.get('mgmt-observability');
    if (observability) {
      const relativeBounds = placeGridRel(0, 0, 240, 70); // Wider to accommodate both children
      observability.bounds = {
        x: mgmtSub.bounds.x + relativeBounds.x,
        y: mgmtSub.bounds.y + relativeBounds.y,
        w: relativeBounds.w,
        h: relativeBounds.h
      };
      if (observability.meta) {
        observability.meta.boundsRel = relativeBounds;
      }
    }

    // Monitor
    const monitor = this.nodeMap.get('monitor');
    if (monitor && observability?.bounds) {
      const relativeBounds = placeGridRel(0, 0, 100, 50);
      monitor.bounds = {
        x: observability.bounds.x + relativeBounds.x,
        y: observability.bounds.y + relativeBounds.y,
        w: relativeBounds.w,
        h: relativeBounds.h
      };
      if (monitor.meta) {
        monitor.meta.boundsRel = relativeBounds;
      }
    }

    // Log Analytics
    const logAnalytics = this.nodeMap.get('log-analytics');
    if (logAnalytics && observability?.bounds) {
      const relativeBounds = placeGridRel(1, 0, 100, 50);
      logAnalytics.bounds = {
        x: observability.bounds.x + relativeBounds.x,
        y: observability.bounds.y + relativeBounds.y,
        w: relativeBounds.w,
        h: relativeBounds.h
      };
      if (logAnalytics.meta) {
        logAnalytics.meta.boundsRel = relativeBounds;
      }
    }

    // Policy
    const policy = this.nodeMap.get('mgmt-policy');
    if (policy) {
      const relativeBounds = placeGridRel(0, 1, 120, 70);
      policy.bounds = {
        x: mgmtSub.bounds.x + relativeBounds.x,
        y: mgmtSub.bounds.y + relativeBounds.y,
        w: relativeBounds.w,
        h: relativeBounds.h
      };
      if (policy.meta) {
        policy.meta.boundsRel = relativeBounds;
      }
    }

    // Defender
    const defender = this.nodeMap.get('mgmt-defender');
    if (defender) {
      const relativeBounds = placeGridRel(1, 1, 120, 70);
      defender.bounds = {
        x: mgmtSub.bounds.x + relativeBounds.x,
        y: mgmtSub.bounds.y + relativeBounds.y,
        w: relativeBounds.w,
        h: relativeBounds.h
      };
      if (defender.meta) {
        defender.meta.boundsRel = relativeBounds;
      }
    }
  }

  private positionConnectivityHub(): void {
    const connectivitySub = this.nodeMap.get('sub-connectivity');
    if (!connectivitySub?.bounds) return;

    // Hub VNet
    const hubVNet = this.nodeMap.get('hub-vnet');
    if (hubVNet) {
      const relativeBounds = placeGridRel(0, 0, 240, 160);
      hubVNet.bounds = {
        x: connectivitySub.bounds.x + relativeBounds.x,
        y: connectivitySub.bounds.y + relativeBounds.y,
        w: relativeBounds.w,
        h: relativeBounds.h
      };
      if (hubVNet.meta) {
        hubVNet.meta.boundsRel = relativeBounds;
      }
    }

    // Gateway Subnet
    const gatewaySubnet = this.nodeMap.get('subnet-hub-gateway');
    if (gatewaySubnet && hubVNet?.bounds) {
      const relativeBounds = placeGridRel(0, 0, 200, 40);
      gatewaySubnet.bounds = {
        x: hubVNet.bounds.x + relativeBounds.x,
        y: hubVNet.bounds.y + relativeBounds.y,
        w: relativeBounds.w,
        h: relativeBounds.h
      };
      if (gatewaySubnet.meta) {
        gatewaySubnet.meta.boundsRel = relativeBounds;
      }
    }

    // Firewall Subnet
    const firewallSubnet = this.nodeMap.get('subnet-hub-firewall');
    if (firewallSubnet && hubVNet?.bounds) {
      const relativeBounds = placeGridRel(0, 1, 200, 40);
      firewallSubnet.bounds = {
        x: hubVNet.bounds.x + relativeBounds.x,
        y: hubVNet.bounds.y + relativeBounds.y,
        w: relativeBounds.w,
        h: relativeBounds.h
      };
      if (firewallSubnet.meta) {
        firewallSubnet.meta.boundsRel = relativeBounds;
      }
    }

    // Azure Firewall
    const firewall = this.nodeMap.get('azure-firewall');
    if (firewall && firewallSubnet?.bounds) {
      const relativeBounds = placeGridRel(0, 0, 120, 70);
      firewall.bounds = {
        x: firewallSubnet.bounds.x + relativeBounds.x,
        y: firewallSubnet.bounds.y + relativeBounds.y,
        w: relativeBounds.w,
        h: relativeBounds.h
      };
      if (firewall.meta) {
        firewall.meta.boundsRel = relativeBounds;
      }
    }

    // Bastion Subnet
    const bastionSubnet = this.nodeMap.get('subnet-hub-bastion');
    if (bastionSubnet && hubVNet?.bounds) {
      const relativeBounds = placeGridRel(0, 2, 200, 40);
      bastionSubnet.bounds = {
        x: hubVNet.bounds.x + relativeBounds.x,
        y: hubVNet.bounds.y + relativeBounds.y,
        w: relativeBounds.w,
        h: relativeBounds.h
      };
      if (bastionSubnet.meta) {
        bastionSubnet.meta.boundsRel = relativeBounds;
      }
    }

    // Bastion
    const bastion = this.nodeMap.get('bastion');
    if (bastion && bastionSubnet?.bounds) {
      const relativeBounds = placeGridRel(0, 0, 120, 70);
      bastion.bounds = {
        x: bastionSubnet.bounds.x + relativeBounds.x,
        y: bastionSubnet.bounds.y + relativeBounds.y,
        w: relativeBounds.w,
        h: relativeBounds.h
      };
      if (bastion.meta) {
        bastion.meta.boundsRel = relativeBounds;
      }
    }
  }

  private positionLandingZones(): void {
    // Production Landing Zone
    this.positionLandingZone('prod');
    
    // Non-Production Landing Zone
    this.positionLandingZone('nonprod');
  }

  private positionLandingZone(environment: string): void {
    const landingZoneSub = this.nodeMap.get(`sub-landingzone-${environment}`);
    if (!landingZoneSub?.bounds) return;

    const vnetId = `spoke-${environment}-vnet`;
    const vnet = this.nodeMap.get(vnetId);
    if (!vnet) return;

    // Position Spoke VNet
    const relativeBounds = placeGridRel(0, 0, 240, 160);
    vnet.bounds = {
      x: landingZoneSub.bounds.x + relativeBounds.x,
      y: landingZoneSub.bounds.y + relativeBounds.y,
      w: relativeBounds.w,
      h: relativeBounds.h
    };
          if (vnet.meta) {
        vnet.meta.boundsRel = relativeBounds;
      }

    // Position subnets within VNet
    const tiers = ['web', 'app', 'db'];
    tiers.forEach((tier, index) => {
      const subnetId = `subnet-${environment}-${tier}`;
      const subnet = this.nodeMap.get(subnetId);
      if (subnet && vnet.bounds) {
        const relativeBounds = placeGridRel(0, index, 200, 40);
        subnet.bounds = {
          x: vnet.bounds.x + relativeBounds.x,
          y: vnet.bounds.y + relativeBounds.y,
          w: relativeBounds.w,
          h: relativeBounds.h
        };
        if (subnet.meta) {
        subnet.meta.boundsRel = relativeBounds;
      }
      }

      // Position tier nodes within subnet
      const tierId = `tier-${environment}-${tier}`;
      const tierNode = this.nodeMap.get(tierId);
      if (tierNode && subnet?.bounds) {
        const relativeBounds = placeGridRel(0, 0, 120, 70);
        tierNode.bounds = {
          x: subnet.bounds.x + relativeBounds.x,
          y: subnet.bounds.y + relativeBounds.y,
          w: relativeBounds.w,
          h: relativeBounds.h
        };
        if (tierNode.meta) {
        tierNode.meta.boundsRel = relativeBounds;
      }
      }
    });
  }

  private calculateContainerBounds(model: ArchitectureModel): void {
    // Calculate bounds for containers based on their children
    model.nodes.forEach(node => {
      if (this.isContainer(node.entityType)) {
        this.updateContainerBounds(node);
      }
    });
  }

  private isContainer(entityType?: string): boolean {
    return entityType === 'subscription' || entityType === 'vnet' || entityType === 'subnet';
  }

  private updateContainerBounds(container: ArchNode): void {
    if (!container.children || container.children.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    container.children.forEach(childId => {
      const child = this.nodeMap.get(childId);
      if (child && child.bounds) {
        // For parent-relative coordinates, use the relative bounds
        const childBounds = child.meta?.boundsRel || child.bounds;
        minX = Math.min(minX, childBounds.x);
        minY = Math.min(minY, childBounds.y);
        maxX = Math.max(maxX, childBounds.x + childBounds.w);
        maxY = Math.max(maxY, childBounds.y + childBounds.h);
      }
    });

    if (minX !== Infinity && minY !== Infinity) {
      const { containerPadding } = this.options;
      
      // Update container bounds to accommodate all children
      const newWidth = maxX - minX + ((containerPadding || 20) * 2);
      const newHeight = maxY - minY + ((containerPadding || 20) * 2) + 30; // Space for title
      
      // Only update if the new bounds are larger than current bounds
      if (!container.bounds || newWidth > container.bounds.w || newHeight > container.bounds.h) {
        container.bounds = {
          x: container.bounds?.x || 0,
          y: container.bounds?.y || 0,
          w: Math.max(container.bounds?.w || 0, newWidth),
          h: Math.max(container.bounds?.h || 0, newHeight)
        };
      }
    }
  }

  private validateParentRelativeGeometry(model: ArchitectureModel): void {
    const errors: string[] = [];

    model.nodes.forEach(node => {
      if (node.parentId && node.meta?.boundsRel) {
        const parent = this.nodeMap.get(node.parentId);
        if (parent?.bounds) {
          const relativeBounds = node.meta.boundsRel;
          
          // Check if child fits inside parent using relative coordinates
          if (relativeBounds.x + relativeBounds.w > parent.bounds.w) {
            errors.push(`Node ${node.id} extends beyond parent width (${relativeBounds.x + relativeBounds.w} > ${parent.bounds.w})`);
          }
          if (relativeBounds.y + relativeBounds.h > parent.bounds.h) {
            errors.push(`Node ${node.id} extends beyond parent height (${relativeBounds.y + relativeBounds.h} > ${parent.bounds.h})`);
          }
          if (relativeBounds.x < 0) {
            errors.push(`Node ${node.id} has negative x coordinate relative to parent`);
          }
          if (relativeBounds.y < 0) {
            errors.push(`Node ${node.id} has negative y coordinate relative to parent`);
          }
        }
      }
    });

    if (errors.length > 0) {
      console.warn('⚠️ [CafSubscriptionLayout] Parent-relative geometry validation errors:', errors);
    } else {
      console.log('✅ [CafSubscriptionLayout] Parent-relative geometry validation passed');
    }
  }
}

// Utility function to apply CAF subscription layout to a model
export function applyCafSubscriptionLayout(model: ArchitectureModel, options?: CafSubscriptionLayoutOptions): ArchitectureModel {
  const layoutEngine = new CafSubscriptionLayoutEngine(options);
  return layoutEngine.applyCafSubscriptionLayout(model);
}
