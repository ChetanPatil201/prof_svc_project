import { ArchitectureModel, ArchNode, ArchEdge } from '@/types/architecture';

export interface RefHubSpokeLayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  columnSpacing?: number;
  rowSpacing?: number;
  containerPadding?: number;
  containerMargin?: number;
}

// Helper types and functions for parent-relative geometry
type Bounds = { x: number; y: number; w: number; h: number };

function placeIn(parent: Bounds, col: number, row: number, cellSize = { w: 160, h: 140 }, gap = { x: 16, y: 16 }): Bounds {
  const x = gap.x + col * (cellSize.w + gap.x);
  const y = gap.y + row * (cellSize.h + gap.y);
  return { x, y, w: cellSize.w, h: cellSize.h }; // NOTE: relative to parent
}

export class RefHubSpokeLayoutEngine {
  private options: RefHubSpokeLayoutOptions;
  private columnAnchors: { [key: string]: number } = {};
  private rowAnchors: { [key: string]: number } = {};
  private nodeMap: Map<string, ArchNode> = new Map();

  constructor(options: RefHubSpokeLayoutOptions = {}) {
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

  applyRefHubSpokeLayout(model: ArchitectureModel): ArchitectureModel {
    // Build node map for quick lookup
    this.nodeMap.clear();
    model.nodes.forEach(node => this.nodeMap.set(node.id, node));

    // Calculate column and row anchors for reference layout
    this.calculateColumnAnchors();
    this.calculateRowAnchors();
    
    // Position containers and nodes according to reference layout
    this.positionOnPremises(model);
    this.positionConnectivityServices(model);
    this.positionHubVNet(model);
    this.positionSpokeVNets(model);
    this.positionPlatformServices(model);
    this.positionDataServices(model);
    
    // Calculate container bounds based on children
    this.calculateContainerBounds(model);
    
    return model;
  }

  private calculateColumnAnchors(): void {
    const { columnSpacing } = this.options;
    
    // Reference Hub-Spoke column layout
    this.columnAnchors = {
      'on-premises': 50,
      'connectivity': 50 + (columnSpacing || 200),
      'hub-vnet': 50 + ((columnSpacing || 200) * 2),
      'spoke-prod': 50 + ((columnSpacing || 200) * 3),
      'spoke-nonprod': 50 + ((columnSpacing || 200) * 4),
      'platform-services': 50 + ((columnSpacing || 200) * 2.5), // Between Hub and Spokes
      'data-services': 50 + ((columnSpacing || 200) * 2.5) // Between Hub and Spokes
    };
  }

  private calculateRowAnchors(): void {
    const { rowSpacing } = this.options;
    
    // Reference Hub-Spoke row layout
    this.rowAnchors = {
      'ingress': 100,
      'security': 100 + (rowSpacing || 100),
      'core': 100 + ((rowSpacing || 100) * 2),
      'monitoring': 100 + ((rowSpacing || 100) * 3),
      'data': 100 + ((rowSpacing || 100) * 4)
    };
  }

  private positionOnPremises(model: ArchitectureModel): void {
    const onPremises = this.nodeMap.get('on-premises');
    if (onPremises) {
      onPremises.bounds = {
        x: this.columnAnchors['on-premises'],
        y: this.rowAnchors['core'],
        w: 180,
        h: 200
      };
    }

    // Position on-premises VMs using parent-relative geometry
    const onPremVMs = this.nodeMap.get('on-prem-vms');
    if (onPremVMs && onPremises?.bounds) {
      const relativeBounds = placeIn(onPremises.bounds, 0, 0, { w: this.options.nodeWidth || 120, h: this.options.nodeHeight || 60 });
      onPremVMs.bounds = {
        x: onPremises.bounds.x + relativeBounds.x,
        y: onPremises.bounds.y + relativeBounds.y,
        w: relativeBounds.w,
        h: relativeBounds.h
      };
    }

    // Position on-premises users using parent-relative geometry
    const onPremUsers = this.nodeMap.get('on-prem-users');
    if (onPremUsers && onPremises?.bounds) {
      const relativeBounds = placeIn(onPremises.bounds, 0, 1, { w: this.options.nodeWidth || 120, h: this.options.nodeHeight || 60 });
      onPremUsers.bounds = {
        x: onPremises.bounds.x + relativeBounds.x,
        y: onPremises.bounds.y + relativeBounds.y,
        w: relativeBounds.w,
        h: relativeBounds.h
      };
    }
  }

  private positionConnectivityServices(model: ArchitectureModel): void {
    const { nodeHeight } = this.options;
    let currentY = this.rowAnchors['core'];

    // VPN Gateway
    const vpnGateway = this.nodeMap.get('vpn-gateway');
    if (vpnGateway) {
      vpnGateway.bounds = {
        x: this.columnAnchors['connectivity'],
        y: currentY,
        w: this.options.nodeWidth || 120,
        h: nodeHeight || 60
      };
      currentY += (nodeHeight || 60) + 20;
    }

    // ExpressRoute Gateway
    const expressRouteGateway = this.nodeMap.get('expressroute-gateway');
    if (expressRouteGateway) {
      expressRouteGateway.bounds = {
        x: this.columnAnchors['connectivity'],
        y: currentY,
        w: this.options.nodeWidth || 120,
        h: nodeHeight || 60
      };
    }
  }

  private positionHubVNet(model: ArchitectureModel): void {
    const hubVNet = this.nodeMap.get('hub-vnet');
    if (hubVNet) {
      hubVNet.bounds = {
        x: this.columnAnchors['hub-vnet'],
        y: this.rowAnchors['ingress'],
        w: 250,
        h: 400 // Will be adjusted based on children
      };
    }

    // Position subnets within Hub VNet using parent-relative geometry
    this.positionHubSubnets(model);
  }

  private positionHubSubnets(model: ArchitectureModel): void {
    const hubVNet = this.nodeMap.get('hub-vnet');
    if (!hubVNet?.bounds) return;

    // Application Gateway (R0 - Ingress)
    const appGateway = this.nodeMap.get('app-gateway');
    if (appGateway) {
      const relativeBounds = placeIn(hubVNet.bounds, 0, 0, { w: this.options.nodeWidth || 120, h: this.options.nodeHeight || 60 });
      appGateway.bounds = {
        x: hubVNet.bounds.x + relativeBounds.x,
        y: hubVNet.bounds.y + relativeBounds.y,
        w: relativeBounds.w,
        h: relativeBounds.h
      };
    }

    // Azure Firewall (R1 - Security)
    const azureFirewall = this.nodeMap.get('azure-firewall');
    if (azureFirewall) {
      const relativeBounds = placeIn(hubVNet.bounds, 0, 1, { w: this.options.nodeWidth || 120, h: this.options.nodeHeight || 60 });
      azureFirewall.bounds = {
        x: hubVNet.bounds.x + relativeBounds.x,
        y: hubVNet.bounds.y + relativeBounds.y,
        w: relativeBounds.w,
        h: relativeBounds.h
      };
    }

    // Bastion (R1 - Security, side by side with firewall)
    const bastion = this.nodeMap.get('bastion');
    if (bastion) {
      const relativeBounds = placeIn(hubVNet.bounds, 1, 1, { w: this.options.nodeWidth || 120, h: this.options.nodeHeight || 60 });
      bastion.bounds = {
        x: hubVNet.bounds.x + relativeBounds.x,
        y: hubVNet.bounds.y + relativeBounds.y,
        w: relativeBounds.w,
        h: relativeBounds.h
      };
    }

    // DNS Private Resolver (R2 - Core)
    const dnsResolver = this.nodeMap.get('dns-resolver');
    if (dnsResolver) {
      const relativeBounds = placeIn(hubVNet.bounds, 0, 2, { w: this.options.nodeWidth || 120, h: this.options.nodeHeight || 60 });
      dnsResolver.bounds = {
        x: hubVNet.bounds.x + relativeBounds.x,
        y: hubVNet.bounds.y + relativeBounds.y,
        w: relativeBounds.w,
        h: relativeBounds.h
      };
    }

    // Route Server (R2 - Core, optional, side by side with DNS)
    const routeServer = this.nodeMap.get('route-server');
    if (routeServer) {
      const relativeBounds = placeIn(hubVNet.bounds, 1, 2, { w: this.options.nodeWidth || 120, h: this.options.nodeHeight || 60 });
      routeServer.bounds = {
        x: hubVNet.bounds.x + relativeBounds.x,
        y: hubVNet.bounds.y + relativeBounds.y,
        w: relativeBounds.w,
        h: relativeBounds.h
      };
    }
  }

  private positionSpokeVNets(model: ArchitectureModel): void {
    // Production Spoke VNet
    const spokeProdVNet = this.nodeMap.get('spoke-prod-vnet');
    if (spokeProdVNet) {
      spokeProdVNet.bounds = {
        x: this.columnAnchors['spoke-prod'],
        y: this.rowAnchors['ingress'],
        w: 250,
        h: 300 // Will be adjusted based on children
      };
    }

    // Non-Production Spoke VNet
    const spokeNonProdVNet = this.nodeMap.get('spoke-nonprod-vnet');
    if (spokeNonProdVNet) {
      spokeNonProdVNet.bounds = {
        x: this.columnAnchors['spoke-nonprod'],
        y: this.rowAnchors['ingress'] + 50, // Slightly offset
        w: 250,
        h: 300 // Will be adjusted based on children
      };
    }

    // Position subnets within Spoke VNets using parent-relative geometry
    this.positionSpokeSubnets(model);
  }

  private positionSpokeSubnets(model: ArchitectureModel): void {
    // Production Spoke Subnets
    const spokeProdVNet = this.nodeMap.get('spoke-prod-vnet');
    if (spokeProdVNet?.bounds) {
      // Web Subnet
      const webSubnet = this.nodeMap.get('subnet-prod-web');
      if (webSubnet) {
        const relativeBounds = placeIn(spokeProdVNet.bounds, 0, 0, { w: spokeProdVNet.bounds.w - 32, h: (this.options.nodeHeight || 60) + 20 });
        webSubnet.bounds = {
          x: spokeProdVNet.bounds.x + relativeBounds.x,
          y: spokeProdVNet.bounds.y + relativeBounds.y,
          w: relativeBounds.w,
          h: relativeBounds.h
        };
      }

      // App Subnet
      const appSubnet = this.nodeMap.get('subnet-prod-app');
      if (appSubnet) {
        const relativeBounds = placeIn(spokeProdVNet.bounds, 0, 1, { w: spokeProdVNet.bounds.w - 32, h: (this.options.nodeHeight || 60) + 20 });
        appSubnet.bounds = {
          x: spokeProdVNet.bounds.x + relativeBounds.x,
          y: spokeProdVNet.bounds.y + relativeBounds.y,
          w: relativeBounds.w,
          h: relativeBounds.h
        };
      }

      // DB Subnet
      const dbSubnet = this.nodeMap.get('subnet-prod-db');
      if (dbSubnet) {
        const relativeBounds = placeIn(spokeProdVNet.bounds, 0, 2, { w: spokeProdVNet.bounds.w - 32, h: (this.options.nodeHeight || 60) + 20 });
        dbSubnet.bounds = {
          x: spokeProdVNet.bounds.x + relativeBounds.x,
          y: spokeProdVNet.bounds.y + relativeBounds.y,
          w: relativeBounds.w,
          h: relativeBounds.h
        };
      }

      // Position tier nodes within subnets using parent-relative geometry
      this.positionTierNodesInSubnet('prod', spokeProdVNet.bounds);
    }

    // Non-Production Spoke Subnets
    const spokeNonProdVNet = this.nodeMap.get('spoke-nonprod-vnet');
    if (spokeNonProdVNet?.bounds) {
      // Web Subnet
      const webSubnet = this.nodeMap.get('subnet-nonprod-web');
      if (webSubnet) {
        const relativeBounds = placeIn(spokeNonProdVNet.bounds, 0, 0, { w: spokeNonProdVNet.bounds.w - 32, h: (this.options.nodeHeight || 60) + 20 });
        webSubnet.bounds = {
          x: spokeNonProdVNet.bounds.x + relativeBounds.x,
          y: spokeNonProdVNet.bounds.y + relativeBounds.y,
          w: relativeBounds.w,
          h: relativeBounds.h
        };
      }

      // App Subnet
      const appSubnet = this.nodeMap.get('subnet-nonprod-app');
      if (appSubnet) {
        const relativeBounds = placeIn(spokeNonProdVNet.bounds, 0, 1, { w: spokeNonProdVNet.bounds.w - 32, h: (this.options.nodeHeight || 60) + 20 });
        appSubnet.bounds = {
          x: spokeNonProdVNet.bounds.x + relativeBounds.x,
          y: spokeNonProdVNet.bounds.y + relativeBounds.y,
          w: relativeBounds.w,
          h: relativeBounds.h
        };
      }

      // DB Subnet
      const dbSubnet = this.nodeMap.get('subnet-nonprod-db');
      if (dbSubnet) {
        const relativeBounds = placeIn(spokeNonProdVNet.bounds, 0, 2, { w: spokeNonProdVNet.bounds.w - 32, h: (this.options.nodeHeight || 60) + 20 });
        dbSubnet.bounds = {
          x: spokeNonProdVNet.bounds.x + relativeBounds.x,
          y: spokeNonProdVNet.bounds.y + relativeBounds.y,
          w: relativeBounds.w,
          h: relativeBounds.h
        };
      }

      // Position tier nodes within subnets using parent-relative geometry
      this.positionTierNodesInSubnet('nonprod', spokeNonProdVNet.bounds);
    }
  }

  private positionTierNodesInSubnet(environment: string, vnetBounds: Bounds): void {
    // Position tier nodes within their respective subnets using parent-relative geometry
    const tiers = ['web', 'app', 'db'];
    tiers.forEach((tier, index) => {
      const tierNode = this.nodeMap.get(`tier-${environment}-${tier}`);
      const subnet = this.nodeMap.get(`subnet-${environment}-${tier}`);
      
      if (tierNode && subnet?.bounds) {
        // Use parent-relative positioning within the subnet
        const relativeBounds = placeIn(subnet.bounds, 0, 0, { w: this.options.nodeWidth || 120, h: this.options.nodeHeight || 60 });
        tierNode.bounds = {
          x: subnet.bounds.x + relativeBounds.x,
          y: subnet.bounds.y + relativeBounds.y,
          w: relativeBounds.w,
          h: relativeBounds.h
        };
      }
    });
  }

  private positionPlatformServices(model: ArchitectureModel): void {
    const { nodeHeight } = this.options;
    let currentY = this.rowAnchors['monitoring'];

    // Observability services
    const observability = this.nodeMap.get('observability');
    if (observability) {
      observability.bounds = {
        x: this.columnAnchors['platform-services'],
        y: currentY,
        w: this.options.nodeWidth || 120,
        h: nodeHeight || 60
      };
      currentY += (nodeHeight || 60) + 20;
    }

    // Azure Monitor
    const monitor = this.nodeMap.get('monitor');
    if (monitor) {
      monitor.bounds = {
        x: this.columnAnchors['platform-services'],
        y: currentY,
        w: this.options.nodeWidth || 120,
        h: nodeHeight || 60
      };
      currentY += (nodeHeight || 60) + 20;
    }

    // Log Analytics
    const logAnalytics = this.nodeMap.get('log-analytics');
    if (logAnalytics) {
      logAnalytics.bounds = {
        x: this.columnAnchors['platform-services'],
        y: currentY,
        w: this.options.nodeWidth || 120,
        h: nodeHeight || 60
      };
    }

    // Key Vault (side band)
    const keyVault = this.nodeMap.get('key-vault');
    if (keyVault) {
      keyVault.bounds = {
        x: this.columnAnchors['platform-services'] + (this.options.nodeWidth || 120) + 30,
        y: this.rowAnchors['monitoring'],
        w: this.options.nodeWidth || 120,
        h: nodeHeight || 60
      };
    }
  }

  private positionDataServices(model: ArchitectureModel): void {
    const { nodeHeight } = this.options;
    let currentY = this.rowAnchors['data'];

    // Azure SQL Database
    const sqlDatabase = this.nodeMap.get('sql-database');
    if (sqlDatabase) {
      sqlDatabase.bounds = {
        x: this.columnAnchors['data-services'],
        y: currentY,
        w: this.options.nodeWidth || 120,
        h: nodeHeight || 60
      };
      currentY += (nodeHeight || 60) + 20;
    }

    // Storage Account
    const storageAccount = this.nodeMap.get('storage-account');
    if (storageAccount) {
      storageAccount.bounds = {
        x: this.columnAnchors['data-services'],
        y: currentY,
        w: this.options.nodeWidth || 120,
        h: nodeHeight || 60
      };
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
    return entityType === 'vnet' || entityType === 'subnet' || entityType === 'custom';
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
        x: minX - (containerPadding || 20),
        y: minY - (containerPadding || 20) - 30, // Space for title
        w: maxX - minX + ((containerPadding || 20) * 2),
        h: maxY - minY + ((containerPadding || 20) * 2) + 30
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

// Utility function to apply reference Hub-Spoke layout to a model
export function applyRefHubSpokeLayout(model: ArchitectureModel, options?: RefHubSpokeLayoutOptions): ArchitectureModel {
  const layoutEngine = new RefHubSpokeLayoutEngine(options);
  return layoutEngine.applyRefHubSpokeLayout(model);
}
