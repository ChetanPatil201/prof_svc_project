import { 
  ArchitectureModel, 
  ArchNode, 
  ArchEdge, 
  EntityType,
  SubscriptionType,
  NodeType,
  AacLayer
} from '@/types/architecture';

export interface CAFContainmentOptions {
  showNonProd?: boolean;
  includeAppGateway?: boolean;
  includePrivateEndpoints?: boolean;
  includeObservability?: boolean;
  includeSecurity?: boolean;
  hubAddressSpace?: string;
  prodSpokeAddressSpace?: string;
  nonProdSpokeAddressSpace?: string;
}

export class CAFContainmentBuilder {
  private model: ArchitectureModel;
  private options: CAFContainmentOptions;
  private nodeMap: Map<string, ArchNode> = new Map();
  private containmentEdges: ArchEdge[] = [];

  constructor(options: CAFContainmentOptions = {}) {
    this.options = {
      showNonProd: true,
      includeAppGateway: true,
      includePrivateEndpoints: true,
      includeObservability: true,
      includeSecurity: true,
      hubAddressSpace: '10.0.0.0/16',
      prodSpokeAddressSpace: '10.1.0.0/16',
      nonProdSpokeAddressSpace: '10.2.0.0/16',
      ...options
    };
    
    this.model = {
      nodes: [],
      edges: [],
      managementGroups: [],
      subscriptions: [],
      cafOptions: {
        showNonProd: this.options.showNonProd,
        includePrivateEndpoints: this.options.includePrivateEndpoints,
        includeObservability: this.options.includeObservability,
        includeSecurity: this.options.includeSecurity,
        layoutPreset: 'caf'
      }
    };
  }

  buildFromAssessment(assessment: any): ArchitectureModel {
    // Clear previous state
    this.nodeMap.clear();
    this.containmentEdges = [];
    this.model.nodes = [];
    this.model.edges = [];

    // Build containment hierarchy
    this.buildManagementGroups();
    this.buildSubscriptions();
    this.buildVNets();
    this.buildSubnets();
    this.buildTierNodes(assessment);
    this.buildPlatformServices();
    this.buildDataServices(assessment);

    // Build connection edges (after containment is established)
    this.buildConnectionEdges();

    // Validate containment
    this.validateContainment();

    return this.model;
  }

  private buildManagementGroups(): void {
    // Tenant Root Group
    const tenantRoot = this.createNode({
      id: 'mg-tenant-root',
      type: 'custom',
      label: 'Tenant Root Group',
      layer: 'Management',
      entityType: 'managementGroup',
      children: ['mg-platform', 'mg-landing-zones']
    });

    // Platform Management Group
    const platform = this.createNode({
      id: 'mg-platform',
      type: 'custom',
      label: 'Platform',
      layer: 'Management',
      entityType: 'managementGroup',
      parentId: 'mg-tenant-root',
      children: ['sub-platform-connectivity', 'sub-platform-management']
    });

    // Landing Zones Management Group
    const landingZones = this.createNode({
      id: 'mg-landing-zones',
      type: 'custom',
      label: 'Landing Zones',
      layer: 'Management',
      entityType: 'managementGroup',
      parentId: 'mg-tenant-root',
      children: ['sub-landingzone-prod']
    });

    if (this.options.showNonProd) {
      landingZones.children!.push('sub-landingzone-nonprod');
    }

    this.model.managementGroups = [
      { id: 'mg-tenant-root', name: 'Tenant Root Group', type: 'tenant-root', children: ['mg-platform', 'mg-landing-zones'] },
      { id: 'mg-platform', name: 'Platform', type: 'platform', parentId: 'mg-tenant-root', children: ['sub-platform-connectivity', 'sub-platform-management'] },
      { id: 'mg-landing-zones', name: 'Landing Zones', type: 'landing-zones', parentId: 'mg-tenant-root', children: ['sub-landingzone-prod', ...(this.options.showNonProd ? ['sub-landingzone-nonprod'] : [])] }
    ];
  }

  private buildSubscriptions(): void {
    // Platform-Connectivity Subscription
    const platformConnectivity = this.createNode({
      id: 'sub-platform-connectivity',
      type: 'custom',
      label: 'Platform-Connectivity',
      layer: 'Networking',
      entityType: 'subscription',
      subscriptionType: 'platform-connectivity',
      parentId: 'mg-platform',
      children: ['vnet-hub']
    });

    // Platform-Management Subscription
    const platformManagement = this.createNode({
      id: 'sub-platform-management',
      type: 'custom',
      label: 'Platform-Management',
      layer: 'Management',
      entityType: 'subscription',
      subscriptionType: 'platform-management',
      parentId: 'mg-platform',
      children: []
    });

    // LandingZone-Prod Subscription
    const landingZoneProd = this.createNode({
      id: 'sub-landingzone-prod',
      type: 'custom',
      label: 'LandingZone-Prod',
      layer: 'Compute',
      entityType: 'subscription',
      subscriptionType: 'landingzone-prod',
      parentId: 'mg-landing-zones',
      children: ['vnet-spoke-prod']
    });

    // LandingZone-NonProd Subscription (optional)
    if (this.options.showNonProd) {
      const landingZoneNonProd = this.createNode({
        id: 'sub-landingzone-nonprod',
        type: 'custom',
        label: 'LandingZone-NonProd',
        layer: 'Compute',
        entityType: 'subscription',
        subscriptionType: 'landingzone-nonprod',
        parentId: 'mg-landing-zones',
        children: ['vnet-spoke-nonprod']
      });
    }

    // Platform-Data Subscription (for shared PaaS)
    const platformData = this.createNode({
      id: 'sub-platform-data',
      type: 'custom',
      label: 'Platform-Data',
      layer: 'Data',
      entityType: 'subscription',
      subscriptionType: 'platform-data',
      parentId: 'mg-platform',
      children: []
    });
  }

  private buildVNets(): void {
    // Hub VNet
    const hubVNet = this.createNode({
      id: 'vnet-hub',
      type: 'vnet',
      label: `Hub VNet (${this.options.hubAddressSpace})`,
      layer: 'Networking',
      entityType: 'vnet',
      subscriptionId: 'sub-platform-connectivity',
      subscriptionType: 'platform-connectivity',
      parentId: 'sub-platform-connectivity',
      addressSpace: this.options.hubAddressSpace,
      children: ['subnet-hub-azurefirewall', 'subnet-hub-bastion', 'subnet-hub-gateway', 'subnet-hub-dns']
    });

    // Spoke VNet - Production
    const spokeVNetProd = this.createNode({
      id: 'vnet-spoke-prod',
      type: 'vnet',
      label: `Spoke VNet (${this.options.prodSpokeAddressSpace})`,
      layer: 'Networking',
      entityType: 'vnet',
      subscriptionId: 'sub-landingzone-prod',
      subscriptionType: 'landingzone-prod',
      parentId: 'sub-landingzone-prod',
      addressSpace: this.options.prodSpokeAddressSpace,
      children: ['subnet-prod-web', 'subnet-prod-app', 'subnet-prod-db']
    });

    // Spoke VNet - Non-Production (optional)
    if (this.options.showNonProd) {
      const spokeVNetNonProd = this.createNode({
        id: 'vnet-spoke-nonprod',
        type: 'vnet',
        label: `Spoke VNet (${this.options.nonProdSpokeAddressSpace})`,
        layer: 'Networking',
        entityType: 'vnet',
        subscriptionId: 'sub-landingzone-nonprod',
        subscriptionType: 'landingzone-nonprod',
        parentId: 'sub-landingzone-nonprod',
        addressSpace: this.options.nonProdSpokeAddressSpace,
        children: ['subnet-nonprod-web', 'subnet-nonprod-app', 'subnet-nonprod-db']
      });
    }
  }

  private buildSubnets(): void {
    // Hub Subnets
    this.createNode({
      id: 'subnet-hub-azurefirewall',
      type: 'subnet',
      label: 'AzureFirewallSubnet (10.0.1.0/26)',
      layer: 'Networking',
      entityType: 'subnet',
      parentId: 'vnet-hub',
      addressSpace: '10.0.1.0/26',
      children: []
    });

    this.createNode({
      id: 'subnet-hub-bastion',
      type: 'subnet',
      label: 'AzureBastionSubnet (10.0.2.0/26)',
      layer: 'Networking',
      entityType: 'subnet',
      parentId: 'vnet-hub',
      addressSpace: '10.0.2.0/26',
      children: []
    });

    this.createNode({
      id: 'subnet-hub-gateway',
      type: 'subnet',
      label: 'GatewaySubnet (10.0.3.0/27)',
      layer: 'Networking',
      entityType: 'subnet',
      parentId: 'vnet-hub',
      addressSpace: '10.0.3.0/27',
      children: []
    });

    this.createNode({
      id: 'subnet-hub-dns',
      type: 'subnet',
      label: 'DNSPrivateResolver (10.0.4.0/26)',
      layer: 'Networking',
      entityType: 'subnet',
      parentId: 'vnet-hub',
      addressSpace: '10.0.4.0/26',
      children: []
    });

    // Production Spoke Subnets
    this.createNode({
      id: 'subnet-prod-web',
      type: 'subnet',
      label: 'Web Subnet (10.1.1.0/24)',
      layer: 'Networking',
      entityType: 'subnet',
      parentId: 'vnet-spoke-prod',
      addressSpace: '10.1.1.0/24',
      children: []
    });

    this.createNode({
      id: 'subnet-prod-app',
      type: 'subnet',
      label: 'App Subnet (10.1.2.0/24)',
      layer: 'Networking',
      entityType: 'subnet',
      parentId: 'vnet-spoke-prod',
      addressSpace: '10.1.2.0/24',
      children: []
    });

    this.createNode({
      id: 'subnet-prod-db',
      type: 'subnet',
      label: 'DB Subnet (10.1.3.0/24)',
      layer: 'Networking',
      entityType: 'subnet',
      parentId: 'vnet-spoke-prod',
      addressSpace: '10.1.3.0/24',
      children: []
    });

    // Non-Production Spoke Subnets (optional)
    if (this.options.showNonProd) {
      this.createNode({
        id: 'subnet-nonprod-web',
        type: 'subnet',
        label: 'Web Subnet (10.2.1.0/24)',
        layer: 'Networking',
        entityType: 'subnet',
        parentId: 'vnet-spoke-nonprod',
        addressSpace: '10.2.1.0/24',
        children: []
      });

      this.createNode({
        id: 'subnet-nonprod-app',
        type: 'subnet',
        label: 'App Subnet (10.2.2.0/24)',
        layer: 'Networking',
        entityType: 'subnet',
        parentId: 'vnet-spoke-nonprod',
        addressSpace: '10.2.2.0/24',
        children: []
      });

      this.createNode({
        id: 'subnet-nonprod-db',
        type: 'subnet',
        label: 'DB Subnet (10.2.3.0/24)',
        layer: 'Networking',
        entityType: 'subnet',
        parentId: 'vnet-spoke-nonprod',
        addressSpace: '10.2.3.0/24',
        children: []
      });
    }
  }

  private buildTierNodes(assessment: any): void {
    if (!assessment.vmSummary) return;

    // Group VMs by tier and environment
    const vmGroups = this.groupVMsByTierAndEnvironment(assessment.vmSummary);

    // Create tier nodes for production
    if (vmGroups.prod) {
      this.createTierNodesForEnvironment('prod', vmGroups.prod);
    }

    // Create tier nodes for non-production
    if (this.options.showNonProd && vmGroups.nonprod) {
      this.createTierNodesForEnvironment('nonprod', vmGroups.nonprod);
    }
  }

  private groupVMsByTierAndEnvironment(vms: any[]): Record<string, Record<string, any[]>> {
    const groups: Record<string, Record<string, any[]>> = {
      prod: { web: [], app: [], db: [] },
      nonprod: { web: [], app: [], db: [] }
    };

    vms.forEach(vm => {
      const environment = vm.environment || 'prod';
      const tier = this.determineTier(vm.vmName);
      
      if (groups[environment] && groups[environment][tier]) {
        groups[environment][tier].push(vm);
      }
    });

    return groups;
  }

  private determineTier(vmName: string): string {
    const lowerName = vmName.toLowerCase();
    
    if (lowerName.includes('web') || lowerName.includes('frontend') || lowerName.includes('ui')) {
      return 'web';
    } else if (lowerName.includes('db') || lowerName.includes('sql') || lowerName.includes('database')) {
      return 'db';
    } else {
      return 'app'; // Default to app tier
    }
  }

  private createTierNodesForEnvironment(environment: string, tierGroups: Record<string, any[]>): void {
    Object.entries(tierGroups).forEach(([tier, vms]) => {
      if (vms.length === 0) return;

      const subnetId = `subnet-${environment}-${tier}`;
      const tierNodeId = `tier-${environment}-${tier}`;
      
      // Get common SKU if all VMs have the same
      const skus = [...new Set(vms.map(vm => vm.recommendedSize))];
      const commonSku = skus.length === 1 ? skus[0] : undefined;
      
      const tierNode = this.createNode({
        id: tierNodeId,
        type: 'vm',
        label: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier (${vms.length})${commonSku ? ` • ${commonSku}` : ''}`,
        layer: 'Compute',
        entityType: 'tier',
        parentId: subnetId,
        vmCount: vms.length,
        vmSku: commonSku,
        children: []
      });

      // Add tier node to subnet's children
      const subnet = this.nodeMap.get(subnetId);
      if (subnet) {
        subnet.children = subnet.children || [];
        subnet.children.push(tierNodeId);
      }
    });
  }

  private buildPlatformServices(): void {
    // Platform-Connectivity Services
    if (this.options.includeAppGateway) {
      this.createNode({
        id: 'app-gateway',
        type: 'appgw',
        label: 'Application Gateway',
        layer: 'Connectivity',
        entityType: 'service',
        parentId: 'sub-platform-connectivity',
        subscriptionId: 'sub-platform-connectivity',
        subscriptionType: 'platform-connectivity',
        children: []
      });
    }

    this.createNode({
      id: 'azure-firewall',
      type: 'firewall',
      label: 'Azure Firewall',
      layer: 'Security',
      entityType: 'service',
      parentId: 'sub-platform-connectivity',
      subscriptionId: 'sub-platform-connectivity',
      subscriptionType: 'platform-connectivity',
      children: []
    });

    this.createNode({
      id: 'bastion',
      type: 'bastion',
      label: 'Azure Bastion',
      layer: 'Security',
      entityType: 'service',
      parentId: 'sub-platform-connectivity',
      subscriptionId: 'sub-platform-connectivity',
      subscriptionType: 'platform-connectivity',
      children: []
    });

    this.createNode({
      id: 'dns-resolver',
      type: 'custom',
      label: 'DNS Private Resolver',
      layer: 'Networking',
      entityType: 'service',
      parentId: 'sub-platform-connectivity',
      subscriptionId: 'sub-platform-connectivity',
      subscriptionType: 'platform-connectivity',
      children: []
    });

    // Platform-Management Services
    if (this.options.includeObservability) {
      this.createNode({
        id: 'observability',
        type: 'custom',
        label: 'Observability',
        layer: 'Observability',
        entityType: 'service',
        parentId: 'sub-platform-management',
        subscriptionId: 'sub-platform-management',
        subscriptionType: 'platform-management',
        children: []
      });

      this.createNode({
        id: 'monitor',
        type: 'monitor',
        label: 'Azure Monitor',
        layer: 'Observability',
        entityType: 'service',
        parentId: 'sub-platform-management',
        subscriptionId: 'sub-platform-management',
        subscriptionType: 'platform-management',
        children: []
      });

      this.createNode({
        id: 'log-analytics',
        type: 'loganalytics',
        label: 'Log Analytics',
        layer: 'Observability',
        entityType: 'service',
        parentId: 'sub-platform-management',
        subscriptionId: 'sub-platform-management',
        subscriptionType: 'platform-management',
        children: []
      });
    }

    if (this.options.includeSecurity) {
      this.createNode({
        id: 'policy',
        type: 'custom',
        label: 'Azure Policy',
        layer: 'Management',
        entityType: 'service',
        parentId: 'sub-platform-management',
        subscriptionId: 'sub-platform-management',
        subscriptionType: 'platform-management',
        children: []
      });

      this.createNode({
        id: 'defender',
        type: 'defender',
        label: 'Defender for Cloud',
        layer: 'Security',
        entityType: 'service',
        parentId: 'sub-platform-management',
        subscriptionId: 'sub-platform-management',
        subscriptionType: 'platform-management',
        children: []
      });
    }
  }

  private buildDataServices(assessment: any): void {
    // Add SQL Server if present in assessment
    if (assessment.sqlServers && assessment.sqlServers.length > 0) {
      this.createNode({
        id: 'sql-server',
        type: 'sql',
        label: assessment.sqlServers[0].name || 'Azure SQL Database',
        layer: 'Data',
        entityType: 'paas',
        parentId: 'sub-platform-data',
        subscriptionId: 'sub-platform-data',
        subscriptionType: 'platform-data',
        children: []
      });
    }

    // Add Storage Account if present in assessment
    if (assessment.storageAccounts && assessment.storageAccounts.length > 0) {
      this.createNode({
        id: 'storage-account',
        type: 'storage',
        label: assessment.storageAccounts[0].name || 'Storage Account',
        layer: 'Data',
        entityType: 'paas',
        parentId: 'sub-platform-data',
        subscriptionId: 'sub-platform-data',
        subscriptionType: 'platform-data',
        children: []
      });
    }
  }

  private buildConnectionEdges(): void {
    // Hub ↔ Spoke VNet peering
    this.addEdge({
      from: 'vnet-hub',
      to: 'vnet-spoke-prod',
      label: 'VNet Peering',
      edgeType: 'peering',
      style: 'solid'
    });

    if (this.options.showNonProd) {
      this.addEdge({
        from: 'vnet-hub',
        to: 'vnet-spoke-nonprod',
        label: 'VNet Peering',
        edgeType: 'peering',
        style: 'solid'
      });
    }

    // Ingress path (if App Gateway present)
    if (this.options.includeAppGateway) {
      this.addEdge({
        from: 'app-gateway',
        to: 'tier-prod-web',
        label: 'Ingress',
        edgeType: 'ingress',
        style: 'solid'
      });
    }

    // East-west flow within production
    this.addEdge({
      from: 'tier-prod-web',
      to: 'tier-prod-app',
      label: 'East-West',
      edgeType: 'east-west',
      style: 'solid'
    });

    this.addEdge({
      from: 'tier-prod-app',
      to: 'tier-prod-db',
      label: 'East-West',
      edgeType: 'east-west',
      style: 'solid'
    });

    // Non-production east-west flow
    if (this.options.showNonProd) {
      this.addEdge({
        from: 'tier-nonprod-web',
        to: 'tier-nonprod-app',
        label: 'East-West',
        edgeType: 'east-west',
        style: 'solid'
      });

      this.addEdge({
        from: 'tier-nonprod-app',
        to: 'tier-nonprod-db',
        label: 'East-West',
        edgeType: 'east-west',
        style: 'solid'
      });
    }

    // Bastion connections to subnets
    const spokeSubnets = ['subnet-prod-web', 'subnet-prod-app', 'subnet-prod-db'];
    if (this.options.showNonProd) {
      spokeSubnets.push('subnet-nonprod-web', 'subnet-nonprod-app', 'subnet-nonprod-db');
    }

    this.addEdge({
      from: 'bastion',
      to: 'vnet-spoke-prod',
      label: `Bastion ×${spokeSubnets.length}`,
      edgeType: 'bastion',
      style: 'solid',
      bundleCount: spokeSubnets.length
    });

    // Firewall egress
    this.addEdge({
      from: 'azure-firewall',
      to: 'vnet-hub',
      label: 'Egress',
      edgeType: 'egress',
      style: 'solid'
    });

    // Management connections
    if (this.options.includeObservability) {
      this.addEdge({
        from: 'observability',
        to: 'vnet-spoke-prod',
        label: 'Diag/Logs',
        edgeType: 'management',
        style: 'solid'
      });

      if (this.options.showNonProd) {
        this.addEdge({
          from: 'observability',
          to: 'vnet-spoke-nonprod',
          label: 'Diag/Logs',
          edgeType: 'management',
          style: 'solid'
        });
      }
    }

    // Security/Governance connections
    if (this.options.includeSecurity) {
      this.addEdge({
        from: 'policy',
        to: 'sub-landingzone-prod',
        label: 'Governance',
        edgeType: 'governance',
        style: 'dashed'
      });

      this.addEdge({
        from: 'defender',
        to: 'sub-landingzone-prod',
        label: 'Security',
        edgeType: 'security',
        style: 'dashed'
      });

      if (this.options.showNonProd) {
        this.addEdge({
          from: 'policy',
          to: 'sub-landingzone-nonprod',
          label: 'Governance',
          edgeType: 'governance',
          style: 'dashed'
        });

        this.addEdge({
          from: 'defender',
          to: 'sub-landingzone-nonprod',
          label: 'Security',
          edgeType: 'security',
          style: 'dashed'
        });
      }
    }

    // Private Endpoints
    if (this.options.includePrivateEndpoints) {
      const paasServices = ['sql-server', 'storage-account'].filter(id => this.nodeMap.has(id));
      
      paasServices.forEach(serviceId => {
        this.addEdge({
          from: serviceId,
          to: 'vnet-spoke-prod',
          label: 'PE ×1',
          edgeType: 'private-endpoint',
          style: 'solid'
        });

        if (this.options.showNonProd) {
          this.addEdge({
            from: serviceId,
            to: 'vnet-spoke-nonprod',
            label: 'PE ×1',
            edgeType: 'private-endpoint',
            style: 'solid'
          });
        }
      });
    }
  }

  private validateContainment(): void {
    // Validate no cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const node of this.model.nodes) {
      if (!visited.has(node.id)) {
        if (this.hasCycle(node.id, visited, recursionStack)) {
          throw new Error(`Containment cycle detected at node: ${node.id}`);
        }
      }
    }

    // Validate one parent per node
    const parentCount = new Map<string, number>();
    for (const node of this.model.nodes) {
      if (node.parentId) {
        parentCount.set(node.id, (parentCount.get(node.id) || 0) + 1);
        if (parentCount.get(node.id)! > 1) {
          throw new Error(`Node ${node.id} has multiple parents`);
        }
      }
    }

    // Validate children consistency
    for (const node of this.model.nodes) {
      if (node.children) {
        for (const childId of node.children) {
          const child = this.nodeMap.get(childId);
          if (!child) {
            throw new Error(`Child node ${childId} not found`);
          }
          if (child.parentId !== node.id) {
            throw new Error(`Parent-child relationship mismatch: ${childId} -> ${node.id}`);
          }
        }
      }
    }
  }

  private hasCycle(nodeId: string, visited: Set<string>, recursionStack: Set<string>): boolean {
    if (recursionStack.has(nodeId)) {
      return true; // Cycle detected
    }

    if (visited.has(nodeId)) {
      return false; // Already processed
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const node = this.nodeMap.get(nodeId);
    if (node && node.children) {
      for (const childId of node.children) {
        if (this.hasCycle(childId, visited, recursionStack)) {
          return true;
        }
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  private createNode(nodeData: Partial<ArchNode>): ArchNode {
    const node: ArchNode = {
      id: nodeData.id!,
      type: nodeData.type!,
      label: nodeData.label!,
      layer: nodeData.layer!,
      entityType: nodeData.entityType,
      subscriptionId: nodeData.subscriptionId,
      mgId: nodeData.mgId,
      subscriptionType: nodeData.subscriptionType,
      addressSpace: nodeData.addressSpace,
      vmCount: nodeData.vmCount,
      vmSku: nodeData.vmSku,
      parentId: nodeData.parentId,
      children: nodeData.children || [],
      bounds: nodeData.bounds,
      meta: nodeData.meta || {}
    };

    this.model.nodes.push(node);
    this.nodeMap.set(node.id, node);
    return node;
  }

  private addEdge(edgeData: Partial<ArchEdge>): void {
    const edge: ArchEdge = {
      from: edgeData.from!,
      to: edgeData.to!,
      label: edgeData.label,
      edgeType: edgeData.edgeType,
      style: edgeData.style || 'solid',
      bundleCount: edgeData.bundleCount,
      isContainment: edgeData.isContainment || false
    };

    this.model.edges.push(edge);
  }
}
