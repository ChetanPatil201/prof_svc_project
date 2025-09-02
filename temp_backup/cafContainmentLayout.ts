import { ArchitectureModel, ArchNode, ArchEdge } from '@/types/architecture';

export interface CAFContainmentLayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  columnSpacing?: number;
  rowSpacing?: number;
  containerPadding?: number;
  containerMargin?: number;
}

export class CAFContainmentLayoutEngine {
  private options: CAFContainmentLayoutOptions;
  private columnAnchors: { [key: string]: number } = {};
  private nodeMap: Map<string, ArchNode> = new Map();

  constructor(options: CAFContainmentLayoutOptions = {}) {
    this.options = {
      nodeWidth: 120,
      nodeHeight: 70,
      columnSpacing: 220,
      rowSpacing: 120,
      containerPadding: 20,
      containerMargin: 30,
      ...options
    };
  }

  applyCAFContainmentLayout(model: ArchitectureModel): ArchitectureModel {
    // Build node map for quick lookup
    this.nodeMap.clear();
    model.nodes.forEach(node => this.nodeMap.set(node.id, node));

    // Calculate column anchors for CAF Landing Zone layout
    this.calculateColumnAnchors();
    
    // Position management groups
    this.positionManagementGroups(model);
    
    // Position subscription containers
    this.positionSubscriptionContainers(model);
    
    // Position VNets within subscriptions
    this.positionVNets(model);
    
    // Position subnets within VNets
    this.positionSubnets(model);
    
    // Position tier nodes within subnets
    this.positionTierNodes(model);
    
    // Position platform services
    this.positionPlatformServices(model);
    
    // Position data services
    this.positionDataServices(model);
    
    // Calculate container bounds based on children
    this.calculateContainerBounds(model);
    
    return model;
  }

  private calculateColumnAnchors(): void {
    const { columnSpacing } = this.options;
    
    // CAF Landing Zone column layout
    this.columnAnchors = {
      'management-groups': 50,
      'platform-connectivity': 50 + columnSpacing,
      'platform-management': 50 + (columnSpacing * 2),
      'landingzone-prod': 50 + (columnSpacing * 3),
      'landingzone-nonprod': 50 + (columnSpacing * 4),
      'shared-data': 50 + (columnSpacing * 5)
    };
  }

  private positionManagementGroups(model: ArchitectureModel): void {
    const mgColumn = this.columnAnchors['management-groups'];
    let currentY = 100;

    // Tenant Root Group
    const tenantRoot = this.nodeMap.get('mg-tenant-root');
    if (tenantRoot) {
      tenantRoot.bounds = {
        x: mgColumn,
        y: currentY,
        w: 180,
        h: 60
      };
      currentY += 80;
    }

    // Platform Management Group
    const platform = this.nodeMap.get('mg-platform');
    if (platform) {
      platform.bounds = {
        x: mgColumn,
        y: currentY,
        w: 180,
        h: 60
      };
      currentY += 80;
    }

    // Landing Zones Management Group
    const landingZones = this.nodeMap.get('mg-landing-zones');
    if (landingZones) {
      landingZones.bounds = {
        x: mgColumn,
        y: currentY,
        w: 180,
        h: 60
      };
    }
  }

  private positionSubscriptionContainers(model: ArchitectureModel): void {
    const { rowSpacing } = this.options;
    let currentY = 100;

    // Platform-Connectivity Subscription
    const platformConnectivity = this.nodeMap.get('sub-platform-connectivity');
    if (platformConnectivity) {
      platformConnectivity.bounds = {
        x: this.columnAnchors['platform-connectivity'],
        y: currentY,
        w: 200,
        h: 400 // Will be adjusted based on children
      };
      currentY += rowSpacing;
    }

    // Platform-Management Subscription
    const platformManagement = this.nodeMap.get('sub-platform-management');
    if (platformManagement) {
      platformManagement.bounds = {
        x: this.columnAnchors['platform-management'],
        y: currentY,
        w: 200,
        h: 300 // Will be adjusted based on children
      };
      currentY += rowSpacing;
    }

    // LandingZone-Prod Subscription
    const landingZoneProd = this.nodeMap.get('sub-landingzone-prod');
    if (landingZoneProd) {
      landingZoneProd.bounds = {
        x: this.columnAnchors['landingzone-prod'],
        y: currentY,
        w: 200,
        h: 400 // Will be adjusted based on children
      };
      currentY += rowSpacing;
    }

    // LandingZone-NonProd Subscription (optional)
    const landingZoneNonProd = this.nodeMap.get('sub-landingzone-nonprod');
    if (landingZoneNonProd) {
      landingZoneNonProd.bounds = {
        x: this.columnAnchors['landingzone-nonprod'],
        y: currentY,
        w: 200,
        h: 400 // Will be adjusted based on children
      };
      currentY += rowSpacing;
    }

    // Platform-Data Subscription
    const platformData = this.nodeMap.get('sub-platform-data');
    if (platformData) {
      platformData.bounds = {
        x: this.columnAnchors['shared-data'],
        y: currentY,
        w: 200,
        h: 200 // Will be adjusted based on children
      };
    }
  }

  private positionVNets(model: ArchitectureModel): void {
    const { containerPadding } = this.options;

    // Hub VNet
    const hubVNet = this.nodeMap.get('vnet-hub');
    if (hubVNet) {
      const parent = this.nodeMap.get(hubVNet.parentId!);
      if (parent && parent.bounds) {
        hubVNet.bounds = {
          x: parent.bounds.x + containerPadding,
          y: parent.bounds.y + containerPadding + 30, // Space for title
          w: parent.bounds.w - (containerPadding * 2),
          h: 200 // Will be adjusted based on children
        };
      }
    }

    // Spoke VNet - Production
    const spokeVNetProd = this.nodeMap.get('vnet-spoke-prod');
    if (spokeVNetProd) {
      const parent = this.nodeMap.get(spokeVNetProd.parentId!);
      if (parent && parent.bounds) {
        spokeVNetProd.bounds = {
          x: parent.bounds.x + containerPadding,
          y: parent.bounds.y + containerPadding + 30,
          w: parent.bounds.w - (containerPadding * 2),
          h: 200 // Will be adjusted based on children
        };
      }
    }

    // Spoke VNet - Non-Production
    const spokeVNetNonProd = this.nodeMap.get('vnet-spoke-nonprod');
    if (spokeVNetNonProd) {
      const parent = this.nodeMap.get(spokeVNetNonProd.parentId!);
      if (parent && parent.bounds) {
        spokeVNetNonProd.bounds = {
          x: parent.bounds.x + containerPadding,
          y: parent.bounds.y + containerPadding + 30,
          w: parent.bounds.w - (containerPadding * 2),
          h: 200 // Will be adjusted based on children
        };
      }
    }
  }

  private positionSubnets(model: ArchitectureModel): void {
    const { containerPadding, nodeHeight } = this.options;

    // Position subnets within their parent VNets
    model.nodes.forEach(node => {
      if (node.entityType === 'subnet' && node.parentId) {
        const parent = this.nodeMap.get(node.parentId);
        if (parent && parent.bounds) {
          // Calculate position based on subnet type
          const subnetIndex = this.getSubnetIndex(node.id);
          const subnetY = parent.bounds.y + containerPadding + 30 + (subnetIndex * (nodeHeight + 10));
          
          node.bounds = {
            x: parent.bounds.x + containerPadding,
            y: subnetY,
            w: parent.bounds.w - (containerPadding * 2),
            h: nodeHeight + 20 // Extra height for tier nodes
          };
        }
      }
    });
  }

  private getSubnetIndex(subnetId: string): number {
    const subnetOrder = [
      'subnet-hub-azurefirewall', 'subnet-hub-bastion', 'subnet-hub-gateway', 'subnet-hub-dns',
      'subnet-prod-web', 'subnet-prod-app', 'subnet-prod-db',
      'subnet-nonprod-web', 'subnet-nonprod-app', 'subnet-nonprod-db'
    ];
    return subnetOrder.indexOf(subnetId);
  }

  private positionTierNodes(model: ArchitectureModel): void {
    const { nodeWidth, nodeHeight, containerPadding } = this.options;

    // Position tier nodes within their parent subnets
    model.nodes.forEach(node => {
      if (node.entityType === 'tier' && node.parentId) {
        const parent = this.nodeMap.get(node.parentId);
        if (parent && parent.bounds) {
          node.bounds = {
            x: parent.bounds.x + containerPadding,
            y: parent.bounds.y + containerPadding + 20, // Space for subnet label
            w: nodeWidth,
            h: nodeHeight
          };
        }
      }
    });
  }

  private positionPlatformServices(model: ArchitectureModel): void {
    const { nodeWidth, nodeHeight, containerPadding } = this.options;
    let currentY = 0;

    // Platform-Connectivity Services
    const platformConnectivity = this.nodeMap.get('sub-platform-connectivity');
    if (platformConnectivity && platformConnectivity.bounds) {
      currentY = platformConnectivity.bounds.y + platformConnectivity.bounds.h + 20;

      const connectivityServices = ['app-gateway', 'azure-firewall', 'bastion', 'dns-resolver'];
      connectivityServices.forEach((serviceId, index) => {
        const service = this.nodeMap.get(serviceId);
        if (service) {
          service.bounds = {
            x: platformConnectivity.bounds!.x + containerPadding,
            y: currentY + (index * (nodeHeight + 10)),
            w: nodeWidth,
            h: nodeHeight
          };
        }
      });
    }

    // Platform-Management Services
    const platformManagement = this.nodeMap.get('sub-platform-management');
    if (platformManagement && platformManagement.bounds) {
      currentY = platformManagement.bounds.y + platformManagement.bounds.h + 20;

      const managementServices = ['observability', 'monitor', 'log-analytics', 'policy', 'defender'];
      managementServices.forEach((serviceId, index) => {
        const service = this.nodeMap.get(serviceId);
        if (service) {
          service.bounds = {
            x: platformManagement.bounds!.x + containerPadding,
            y: currentY + (index * (nodeHeight + 10)),
            w: nodeWidth,
            h: nodeHeight
          };
        }
      });
    }
  }

  private positionDataServices(model: ArchitectureModel): void {
    const { nodeWidth, nodeHeight, containerPadding } = this.options;

    // Platform-Data Services
    const platformData = this.nodeMap.get('sub-platform-data');
    if (platformData && platformData.bounds) {
      const dataServices = ['sql-server', 'storage-account'];
      dataServices.forEach((serviceId, index) => {
        const service = this.nodeMap.get(serviceId);
        if (service) {
          service.bounds = {
            x: platformData.bounds!.x + containerPadding,
            y: platformData.bounds!.y + containerPadding + 30 + (index * (nodeHeight + 10)),
            w: nodeWidth,
            h: nodeHeight
          };
        }
      });
    }
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
    return entityType === 'managementGroup' || 
           entityType === 'subscription' || 
           entityType === 'vnet' || 
           entityType === 'subnet';
  }

  private updateContainerBounds(container: ArchNode): void {
    if (!container.children || container.children.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    container.children.forEach(childId => {
      const child = this.nodeMap.get(childId);
      if (child && child.bounds) {
        minX = Math.min(minX, child.bounds.x);
        minY = Math.min(minY, child.bounds.y);
        maxX = Math.max(maxX, child.bounds.x + child.bounds.w);
        maxY = Math.max(maxY, child.bounds.y + child.bounds.h);
      }
    });

    if (minX !== Infinity && minY !== Infinity) {
      const { containerPadding, containerMargin } = this.options;
      
      container.bounds = {
        x: minX - containerPadding,
        y: minY - containerPadding - 30, // Space for title
        w: maxX - minX + (containerPadding * 2),
        h: maxY - minY + (containerPadding * 2) + 30
      };
    }
  }

  // Helper method to get container bounds for a node
  getContainerBounds(nodeId: string): { x: number; y: number; w: number; h: number } | null {
    const node = this.nodeMap.get(nodeId);
    return node?.bounds || null;
  }

  // Helper method to get all children of a container
  getContainerChildren(containerId: string): ArchNode[] {
    const container = this.nodeMap.get(containerId);
    if (!container || !container.children) return [];

    return container.children
      .map(childId => this.nodeMap.get(childId))
      .filter(child => child !== undefined) as ArchNode[];
  }
}

// Utility function to apply CAF containment layout to a model
export function applyCAFContainmentLayout(model: ArchitectureModel, options?: CAFContainmentLayoutOptions): ArchitectureModel {
  const layoutEngine = new CAFContainmentLayoutEngine(options);
  return layoutEngine.applyCAFContainmentLayout(model);
}
