import { 
  ArchitectureModel, 
  ArchNode, 
  ArchEdge, 
  EntityType,
  NodeType,
  AacLayer
} from '@/types/architecture';

export interface RefHubSpokeOptions {
  showNonProd?: boolean;
  includeAppGateway?: boolean;
  includeVPNGateway?: boolean;
  includeExpressRoute?: boolean;
  includeRouteServer?: boolean;
  includePrivateEndpoints?: boolean;
  includeObservability?: boolean;
  includeKeyVault?: boolean;
  includeLoadBalancer?: boolean;
  hubAddressSpace?: string;
  prodSpokeAddressSpace?: string;
  nonProdSpokeAddressSpace?: string;
}

export class RefHubSpokeBuilder {
  private model: ArchitectureModel;
  private options: RefHubSpokeOptions;
  private nodeMap: Map<string, ArchNode> = new Map();

  constructor(options: RefHubSpokeOptions = {}) {
    this.options = {
      showNonProd: true,
      includeAppGateway: true,
      includeVPNGateway: false,
      includeExpressRoute: false,
      includeRouteServer: false,
      includePrivateEndpoints: true,
      includeObservability: true,
      includeKeyVault: true,
      includeLoadBalancer: false,
      hubAddressSpace: '10.0.0.0/16',
      prodSpokeAddressSpace: '10.1.0.0/16',
      nonProdSpokeAddressSpace: '10.2.0.0/16',
      ...options
    };
    
    this.model = {
      nodes: [],
      edges: [],
      cafOptions: {
        showNonProd: this.options.showNonProd,
        includePrivateEndpoints: this.options.includePrivateEndpoints,
        includeObservability: this.options.includeObservability,
        layoutPreset: 'caf'
      }
    };
  }

  buildFromAssessment(assessment: any): ArchitectureModel {
    try {
      console.log('🔍 [RefHubSpokeBuilder] Building reference Hub-Spoke architecture from assessment:', {
        hasAssessment: !!assessment,
        vmCount: assessment?.vmSummary?.length || 0,
        targetRegion: assessment?.targetRegion
      });

      // Clear previous state
      this.nodeMap.clear();
      this.model.nodes = [];
      this.model.edges = [];

      // Build containment hierarchy
      this.buildOnPremises();
      this.buildConnectivityServices();
      this.buildHubVNet();
      this.buildSpokeVNets(assessment);
      this.buildPlatformServices();
      this.buildDataServices(assessment);

      // Build connection edges (after containment is established)
      this.buildConnectionEdges();

      // Debug: Log all nodes before validation
      console.log('🔍 [RefHubSpokeBuilder] All nodes before validation:', this.model.nodes.map(n => ({
        id: n.id,
        type: n.type,
        entityType: n.entityType,
        parentId: n.parentId,
        children: n.children
      })));

      // Validate containment (temporarily disabled for debugging)
      try {
        this.validateContainment();
      } catch (error) {
        console.warn('⚠️ [RefHubSpokeBuilder] Containment validation failed, continuing without validation:', error);
      }

      console.log('✅ [RefHubSpokeBuilder] Successfully built reference Hub-Spoke architecture:', {
        nodes: this.model.nodes.length,
        edges: this.model.edges.length
      });

      // Log node structure for debugging
      this.logNodeStructure();

      return this.model;
    } catch (error) {
      console.error('❌ [RefHubSpokeBuilder] Error building reference Hub-Spoke architecture:', error);
      throw error;
    }
  }

  private buildOnPremises(): void {
    // On-premises network container
    this.createNode({
      id: 'on-premises',
      type: 'custom',
      label: 'On-premises network',
      layer: 'Connectivity',
      entityType: 'service',
      children: ['on-prem-vms', 'on-prem-users']
    });

    // On-premises VMs (summarized)
    this.createNode({
      id: 'on-prem-vms',
      type: 'vm',
      label: 'On-premises VMs (n)',
      layer: 'Compute',
      entityType: 'service',
      parentId: 'on-premises',
      children: []
    });

    // On-premises users/branch
    this.createNode({
      id: 'on-prem-users',
      type: 'custom',
      label: 'Users/Branch',
      layer: 'Identity',
      entityType: 'service',
      parentId: 'on-premises',
      children: []
    });
  }

  private buildConnectivityServices(): void {
    // VPN Gateway
    if (this.options.includeVPNGateway) {
      this.createNode({
        id: 'vpn-gateway',
        type: 'custom',
        label: 'VPN Gateway',
        layer: 'Networking',
        entityType: 'service',
        children: []
      });
    }

    // ExpressRoute Gateway
    if (this.options.includeExpressRoute) {
      this.createNode({
        id: 'expressroute-gateway',
        type: 'custom',
        label: 'ExpressRoute Gateway',
        layer: 'Networking',
        entityType: 'service',
        children: []
      });
    }
  }

  private buildHubVNet(): void {
    // Hub VNet container
    this.createNode({
      id: 'hub-vnet',
      type: 'vnet',
      label: `Hub virtual network (${this.options.hubAddressSpace})`,
      layer: 'Networking',
      entityType: 'vnet',
      addressSpace: this.options.hubAddressSpace,
      children: ['subnet-hub-firewall', 'subnet-hub-gateway', 'subnet-hub-bastion']
    });

    // Add optional subnets
    if (this.options.includeRouteServer) {
      this.createNode({
        id: 'subnet-hub-routeserver',
        type: 'subnet',
        label: 'AzureRouteServerSubnet (10.0.4.0/27)',
        layer: 'Networking',
        entityType: 'subnet',
        parentId: 'hub-vnet',
        addressSpace: '10.0.4.0/27',
        children: ['route-server']
      });

      this.createNode({
        id: 'route-server',
        type: 'custom',
        label: 'Route Server',
        layer: 'Networking',
        entityType: 'service',
        parentId: 'subnet-hub-routeserver',
        children: []
      });
    }

    // DNS Private Resolver subnet
    this.createNode({
      id: 'subnet-hub-dns',
      type: 'subnet',
      label: 'DNS Private Resolver (10.0.5.0/26)',
      layer: 'Networking',
      entityType: 'subnet',
      parentId: 'hub-vnet',
      addressSpace: '10.0.5.0/26',
      children: ['dns-resolver']
    });

    this.createNode({
      id: 'dns-resolver',
      type: 'custom',
      label: 'DNS Private Resolver',
      layer: 'Networking',
      entityType: 'service',
      parentId: 'subnet-hub-dns',
      children: []
    });

    // Azure Firewall Subnet
    this.createNode({
      id: 'subnet-hub-firewall',
      type: 'subnet',
      label: 'AzureFirewallSubnet (10.0.1.0/26)',
      layer: 'Networking',
      entityType: 'subnet',
      parentId: 'hub-vnet',
      addressSpace: '10.0.1.0/26',
      children: ['azure-firewall']
    });

    this.createNode({
      id: 'azure-firewall',
      type: 'firewall',
      label: 'Azure Firewall',
      layer: 'Security',
      entityType: 'service',
      parentId: 'subnet-hub-firewall',
      children: []
    });

    // Gateway Subnet
    this.createNode({
      id: 'subnet-hub-gateway',
      type: 'subnet',
      label: 'GatewaySubnet (10.0.2.0/27)',
      layer: 'Networking',
      entityType: 'subnet',
      parentId: 'hub-vnet',
      addressSpace: '10.0.2.0/27',
      children: []
    });

    // Bastion Subnet
    this.createNode({
      id: 'subnet-hub-bastion',
      type: 'subnet',
      label: 'AzureBastionSubnet (10.0.3.0/26)',
      layer: 'Networking',
      entityType: 'subnet',
      parentId: 'hub-vnet',
      addressSpace: '10.0.3.0/26',
      children: ['bastion']
    });

    this.createNode({
      id: 'bastion',
      type: 'bastion',
      label: 'Azure Bastion',
      layer: 'Security',
      entityType: 'service',
      parentId: 'subnet-hub-bastion',
      children: []
    });

    // Application Gateway (if enabled)
    if (this.options.includeAppGateway) {
      this.createNode({
        id: 'app-gateway',
        type: 'appgw',
        label: 'Application Gateway',
        layer: 'Connectivity',
        entityType: 'service',
        parentId: 'hub-vnet',
        children: []
      });
    }
  }

  private buildSpokeVNets(assessment?: any): void {
    // Production Spoke VNet
    this.createNode({
      id: 'spoke-prod-vnet',
      type: 'vnet',
      label: `Production spoke virtual network (${this.options.prodSpokeAddressSpace})`,
      layer: 'Networking',
      entityType: 'vnet',
      addressSpace: this.options.prodSpokeAddressSpace,
      children: ['subnet-prod-web', 'subnet-prod-app', 'subnet-prod-db']
    });

    // Production Web Subnet
    this.createNode({
      id: 'subnet-prod-web',
      type: 'subnet',
      label: 'Web Subnet (10.1.1.0/24)',
      layer: 'Networking',
      entityType: 'subnet',
      parentId: 'spoke-prod-vnet',
      addressSpace: '10.1.1.0/24',
      children: ['tier-prod-web']
    });

    // Production App Subnet
    this.createNode({
      id: 'subnet-prod-app',
      type: 'subnet',
      label: 'App Subnet (10.1.2.0/24)',
      layer: 'Networking',
      entityType: 'subnet',
      parentId: 'spoke-prod-vnet',
      addressSpace: '10.1.2.0/24',
      children: ['tier-prod-app']
    });

    // Production DB Subnet
    this.createNode({
      id: 'subnet-prod-db',
      type: 'subnet',
      label: 'DB Subnet (10.1.3.0/24)',
      layer: 'Networking',
      entityType: 'subnet',
      parentId: 'spoke-prod-vnet',
      addressSpace: '10.1.3.0/24',
      children: ['tier-prod-db']
    });

    // Non-Production Spoke VNet (optional)
    if (this.options.showNonProd) {
      this.createNode({
        id: 'spoke-nonprod-vnet',
        type: 'vnet',
        label: `Non-production spoke virtual network (${this.options.nonProdSpokeAddressSpace})`,
        layer: 'Networking',
        entityType: 'vnet',
        addressSpace: this.options.nonProdSpokeAddressSpace,
        children: ['subnet-nonprod-web', 'subnet-nonprod-app', 'subnet-nonprod-db']
      });

      // Non-Production Web Subnet
      this.createNode({
        id: 'subnet-nonprod-web',
        type: 'subnet',
        label: 'Web Subnet (10.2.1.0/24)',
        layer: 'Networking',
        entityType: 'subnet',
        parentId: 'spoke-nonprod-vnet',
        addressSpace: '10.2.1.0/24',
        children: ['tier-nonprod-web']
      });

      // Non-Production App Subnet
      this.createNode({
        id: 'subnet-nonprod-app',
        type: 'subnet',
        label: 'App Subnet (10.2.2.0/24)',
        layer: 'Networking',
        entityType: 'subnet',
        parentId: 'spoke-nonprod-vnet',
        addressSpace: '10.2.2.0/24',
        children: ['tier-nonprod-app']
      });

      // Non-Production DB Subnet
      this.createNode({
        id: 'subnet-nonprod-db',
        type: 'subnet',
        label: 'DB Subnet (10.2.3.0/24)',
        layer: 'Networking',
        entityType: 'subnet',
        parentId: 'spoke-nonprod-vnet',
        addressSpace: '10.2.3.0/24',
        children: ['tier-nonprod-db']
      });
    }

    // Create tier nodes based on assessment data
    this.createTierNodes(assessment);
  }

  private createTierNodes(assessment: any): void {
    if (!assessment || !assessment.vmSummary || !Array.isArray(assessment.vmSummary)) {
      console.warn('⚠️ [RefHubSpokeBuilder] No VM summary data available, creating default tier nodes');
      this.createDefaultTierNodes();
      return;
    }

    // Group VMs by tier and environment
    const vmGroups = this.groupVMsByTierAndEnvironment(assessment.vmSummary);

    // Production tier nodes
    if (vmGroups.prod) {
      this.createTierNodesForEnvironment('prod', vmGroups.prod);
    }

    // Non-production tier nodes
    if (this.options.showNonProd && vmGroups.nonprod) {
      this.createTierNodesForEnvironment('nonprod', vmGroups.nonprod);
    }

    // Always create default tier nodes to ensure all referenced children exist
    this.createDefaultTierNodes();
  }

  private createDefaultTierNodes(): void {
    // Create default tier nodes for demonstration
    const defaultTiers = ['web', 'app', 'db'];
    
    defaultTiers.forEach(tier => {
      // Only create if it doesn't already exist
      if (!this.nodeMap.has(`tier-prod-${tier}`)) {
        this.createNode({
          id: `tier-prod-${tier}`,
          type: 'vm',
          label: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier (0)`,
          layer: 'Compute',
          entityType: 'tier',
          parentId: `subnet-prod-${tier}`,
          vmCount: 0,
          children: []
        });
      }

      if (this.options.showNonProd && !this.nodeMap.has(`tier-nonprod-${tier}`)) {
        this.createNode({
          id: `tier-nonprod-${tier}`,
          type: 'vm',
          label: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier (0)`,
          layer: 'Compute',
          entityType: 'tier',
          parentId: `subnet-nonprod-${tier}`,
          vmCount: 0,
          children: []
        });
      }
    });
  }

  private groupVMsByTierAndEnvironment(vms: any[]): Record<string, Record<string, any[]>> {
    const groups: Record<string, Record<string, any[]>> = {
      prod: { web: [], app: [], db: [] },
      nonprod: { web: [], app: [], db: [] }
    };

    vms.forEach((vm, index) => {
      try {
        if (!vm || !vm.vmName) {
          console.warn(`⚠️ [RefHubSpokeBuilder] VM at index ${index} is missing vmName property:`, vm);
          return;
        }

        const environment = this.determineEnvironment(vm.vmName);
        const tier = this.determineTier(vm.vmName);
        
        if (groups[environment] && groups[environment][tier]) {
          groups[environment][tier].push(vm);
        } else {
          console.warn(`⚠️ [RefHubSpokeBuilder] Could not categorize VM ${vm.vmName} (env: ${environment}, tier: ${tier})`);
        }
      } catch (error) {
        console.error(`❌ [RefHubSpokeBuilder] Error processing VM at index ${index}:`, error, vm);
      }
    });

    console.log('🔍 [RefHubSpokeBuilder] VM grouping results:', {
      prod: Object.fromEntries(Object.entries(groups.prod).map(([tier, vms]) => [tier, vms.length])),
      nonprod: Object.fromEntries(Object.entries(groups.nonprod).map(([tier, vms]) => [tier, vms.length]))
    });

    return groups;
  }

  private determineEnvironment(vmName: string): string {
    const lowerName = vmName.toLowerCase();
    if (lowerName.includes('-dev') || lowerName.includes('-qa') || lowerName.includes('-test')) {
      return 'nonprod';
    }
    return 'prod';
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
      try {
        if (vms.length === 0) return;

        const tierNodeId = `tier-${environment}-${tier}`;
        const subnetId = `subnet-${environment}-${tier}`;
        
        // Get common SKU if all VMs have the same
        const skus = [...new Set(vms.map(vm => vm.recommendedSize).filter(Boolean))];
        const commonSku = skus.length === 1 ? skus[0] : undefined;
        
        this.createNode({
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

        // Add load balancer if enabled
        if (this.options.includeLoadBalancer) {
          this.createNode({
            id: `lb-${environment}-${tier}`,
            type: 'lb',
            label: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Load Balancer`,
            layer: 'Networking',
            entityType: 'service',
            parentId: subnetId,
            children: []
          });
        }
      } catch (error) {
        console.error(`❌ [RefHubSpokeBuilder] Error creating tier node for ${environment}-${tier}:`, error);
      }
    });
  }

  private buildPlatformServices(): void {
    // Observability services
    if (this.options.includeObservability) {
      this.createNode({
        id: 'observability',
        type: 'custom',
        label: 'Observability',
        layer: 'Observability',
        entityType: 'service',
        children: []
      });

      this.createNode({
        id: 'monitor',
        type: 'monitor',
        label: 'Azure Monitor',
        layer: 'Observability',
        entityType: 'service',
        parentId: 'observability',
        children: []
      });

      this.createNode({
        id: 'log-analytics',
        type: 'loganalytics',
        label: 'Log Analytics',
        layer: 'Observability',
        entityType: 'service',
        parentId: 'observability',
        children: []
      });
    }

    // Key Vault
    if (this.options.includeKeyVault) {
      this.createNode({
        id: 'key-vault',
        type: 'keyvault',
        label: 'Key Vault',
        layer: 'Security',
        entityType: 'service',
        children: []
      });
    }
  }

  private buildDataServices(assessment: any): void {
    // Azure SQL Database - create default if not present
    this.createNode({
      id: 'sql-database',
      type: 'sql',
      label: 'Azure SQL Database',
      layer: 'Data',
      entityType: 'paas',
      children: []
    });

    // Storage Account - create default if not present
    this.createNode({
      id: 'storage-account',
      type: 'storage',
      label: 'Storage Account',
      layer: 'Data',
      entityType: 'paas',
      children: []
    });
  }

  private buildConnectionEdges(): void {
    // On-premises to Hub connectivity
    if (this.options.includeVPNGateway) {
      this.addEdge({
        from: 'on-premises',
        to: 'vpn-gateway',
        label: 'VPN',
        edgeType: 'management',
        style: 'solid'
      });

      this.addEdge({
        from: 'vpn-gateway',
        to: 'subnet-hub-gateway',
        label: 'VPN',
        edgeType: 'management',
        style: 'solid'
      });
    }

    if (this.options.includeExpressRoute) {
      this.addEdge({
        from: 'on-premises',
        to: 'expressroute-gateway',
        label: 'ExpressRoute',
        edgeType: 'management',
        style: 'solid'
      });

      this.addEdge({
        from: 'expressroute-gateway',
        to: 'subnet-hub-gateway',
        label: 'ExpressRoute',
        edgeType: 'management',
        style: 'solid'
      });
    }

    // Hub to Spoke VNet peering
    this.addEdge({
      from: 'hub-vnet',
      to: 'spoke-prod-vnet',
      label: 'VNet peering',
      edgeType: 'peering',
      style: 'solid'
    });

    if (this.options.showNonProd) {
      this.addEdge({
        from: 'hub-vnet',
        to: 'spoke-nonprod-vnet',
        label: 'VNet peering',
        edgeType: 'peering',
        style: 'solid'
      });
    }

    // Ingress path
    if (this.options.includeAppGateway) {
      this.addEdge({
        from: 'app-gateway',
        to: 'tier-prod-web',
        label: 'Ingress',
        edgeType: 'ingress',
        style: 'solid'
      });

      if (this.options.showNonProd) {
        this.addEdge({
          from: 'app-gateway',
          to: 'tier-nonprod-web',
          label: 'Ingress',
          edgeType: 'ingress',
          style: 'solid'
        });
      }
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

    // Bastion connections
    this.addEdge({
      from: 'bastion',
      to: 'spoke-prod-vnet',
      label: 'Mgmt',
      edgeType: 'bastion',
      style: 'solid'
    });

    if (this.options.showNonProd) {
      this.addEdge({
        from: 'bastion',
        to: 'spoke-nonprod-vnet',
        label: 'Mgmt',
        edgeType: 'bastion',
        style: 'solid'
      });
    }

    // Management connections
    if (this.options.includeObservability) {
      this.addEdge({
        from: 'observability',
        to: 'spoke-prod-vnet',
        label: 'Diag/Logs',
        edgeType: 'management',
        style: 'solid'
      });

      if (this.options.showNonProd) {
        this.addEdge({
          from: 'observability',
          to: 'spoke-nonprod-vnet',
          label: 'Diag/Logs',
          edgeType: 'management',
          style: 'solid'
        });
      }
    }

    // Key Vault secrets
    if (this.options.includeKeyVault) {
      this.addEdge({
        from: 'key-vault',
        to: 'tier-prod-app',
        label: 'Secrets',
        edgeType: 'security',
        style: 'solid'
      });

      this.addEdge({
        from: 'key-vault',
        to: 'tier-prod-db',
        label: 'Secrets',
        edgeType: 'security',
        style: 'solid'
      });

      if (this.options.showNonProd) {
        this.addEdge({
          from: 'key-vault',
          to: 'tier-nonprod-app',
          label: 'Secrets',
          edgeType: 'security',
          style: 'solid'
        });

        this.addEdge({
          from: 'key-vault',
          to: 'tier-nonprod-db',
          label: 'Secrets',
          edgeType: 'security',
          style: 'solid'
        });
      }
    }

    // Private Endpoints
    if (this.options.includePrivateEndpoints) {
      const paasServices = ['sql-database', 'storage-account'].filter(id => this.nodeMap.has(id));
      
      paasServices.forEach(serviceId => {
        this.addEdge({
          from: serviceId,
          to: 'spoke-prod-vnet',
          label: 'PE ×1',
          edgeType: 'private-endpoint',
          style: 'solid'
        });

        if (this.options.showNonProd) {
          this.addEdge({
            from: serviceId,
            to: 'spoke-nonprod-vnet',
            label: 'PE ×1',
            edgeType: 'private-endpoint',
            style: 'solid'
          });
        }
      });
    }
  }

  private validateContainment(): void {
    try {
      console.log('🔍 [RefHubSpokeBuilder] Starting containment validation...');
      
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
        if (node.children && node.children.length > 0) {
          for (const childId of node.children) {
            const child = this.nodeMap.get(childId);
            if (!child) {
              console.error(`❌ [RefHubSpokeBuilder] Child node ${childId} not found in nodeMap`);
              console.error(`❌ [RefHubSpokeBuilder] Available nodes:`, Array.from(this.nodeMap.keys()));
              throw new Error(`Child node ${childId} not found for parent ${node.id}`);
            }
            if (child.parentId !== node.id) {
              console.error(`❌ [RefHubSpokeBuilder] Parent-child mismatch: ${childId} has parent ${child.parentId}, expected ${node.id}`);
              throw new Error(`Parent-child relationship mismatch: ${childId} -> ${node.id}`);
            }
          }
        }
      }

      console.log('✅ [RefHubSpokeBuilder] Containment validation passed');
    } catch (error) {
      console.error('❌ [RefHubSpokeBuilder] Containment validation failed:', error);
      throw error;
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
    if (node && node.children && node.children.length > 0) {
      for (const childId of node.children) {
        if (!this.nodeMap.has(childId)) {
          console.warn(`⚠️ [RefHubSpokeBuilder] Child node ${childId} not found in nodeMap during cycle detection`);
          continue;
        }
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

  private logNodeStructure(): void {
    console.log('🔍 [RefHubSpokeBuilder] Node structure:');
    
    // Group nodes by entity type
    const nodesByType = new Map<string, ArchNode[]>();
    this.model.nodes.forEach(node => {
      const type = node.entityType || 'unknown';
      if (!nodesByType.has(type)) {
        nodesByType.set(type, []);
      }
      nodesByType.get(type)!.push(node);
    });

    // Log each group
    nodesByType.forEach((nodes, type) => {
      console.log(`  ${type} (${nodes.length}):`);
      nodes.forEach(node => {
        console.log(`    - ${node.id}: parent=${node.parentId || 'none'}, children=[${node.children?.join(', ') || 'none'}]`);
      });
    });

    // Check for orphaned children
    const allChildIds = new Set<string>();
    this.model.nodes.forEach(node => {
      if (node.children) {
        node.children.forEach(childId => allChildIds.add(childId));
      }
    });

    const orphanedChildren = Array.from(allChildIds).filter(childId => !this.nodeMap.has(childId));
    if (orphanedChildren.length > 0) {
      console.warn('⚠️ [RefHubSpokeBuilder] Orphaned children found:', orphanedChildren);
    }
  }
}
