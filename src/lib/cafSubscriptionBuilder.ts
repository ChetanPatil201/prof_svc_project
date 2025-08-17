import { ArchitectureModel, ArchNode, ArchEdge, EntityType, NodeType, AacLayer } from '@/types/architecture';

export interface CafSubscriptionOptions {
  includeNonProd?: boolean;
  includeObservability?: boolean;
  includePolicy?: boolean;
  includeDefender?: boolean;
  includeBastion?: boolean;
  includeFirewall?: boolean;
  includeLoadBalancer?: boolean;
  hubAddressSpace?: string;
  prodSpokeAddressSpace?: string;
  nonProdSpokeAddressSpace?: string;
}

export type Bounds = { x: number; y: number; w: number; h: number };

export function placeGridRel(col: number, row: number, w = 180, h = 90, gx = 16, gy = 16): Bounds {
  return { x: gx + col * (w + gx), y: gy + row * (h + gy), w, h };
}

export class CafSubscriptionBuilder {
  private model: ArchitectureModel;
  private options: CafSubscriptionOptions;
  private nodeMap: Map<string, ArchNode> = new Map();

  constructor(options: CafSubscriptionOptions = {}) {
    this.options = {
      includeNonProd: false,
      includeObservability: true,
      includePolicy: true,
      includeDefender: true,
      includeBastion: true,
      includeFirewall: true,
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
        showNonProd: this.options.includeNonProd,
        includePrivateEndpoints: false,
        includeObservability: this.options.includeObservability,
        layoutPreset: 'caf'
      }
    };
  }

  buildFromAssessment(assessment: any): ArchitectureModel {
    try {
      console.log('🔍 [CafSubscriptionBuilder] Building CAF subscription architecture from assessment:', {
        hasAssessment: !!assessment,
        vmCount: assessment?.vmSummary?.length || 0,
        targetRegion: assessment?.targetRegion
      });

      // Clear previous state
      this.nodeMap.clear();
      this.model.nodes = [];
      this.model.edges = [];

      // Build subscription containers
      this.buildSubscriptionContainers();
      
      // Build connectivity hub
      this.buildConnectivityHub();
      
      // Build management services
      this.buildManagementServices();
      
      // Build landing zones
      this.buildLandingZones(assessment);

      // Build connection edges
      this.buildConnectionEdges();

      console.log('✅ [CafSubscriptionBuilder] Successfully built CAF subscription architecture:', {
        nodes: this.model.nodes.length,
        edges: this.model.edges.length
      });

      return this.model;
    } catch (error) {
      console.error('❌ [CafSubscriptionBuilder] Error building CAF subscription architecture:', error);
      throw error;
    }
  }

  private buildSubscriptionContainers(): void {
    // Management Subscription
    this.createNode({
      id: 'sub-mgmt',
      type: 'vnet',
      label: 'Management',
      layer: 'Management',
      entityType: 'subscription',
      subscriptionType: 'platform-management',
      children: ['mgmt-observability', 'mgmt-policy', 'mgmt-defender']
    });

    // Connectivity Subscription
    this.createNode({
      id: 'sub-connectivity',
      type: 'vnet',
      label: 'Connectivity',
      layer: 'Networking',
      entityType: 'subscription',
      subscriptionType: 'platform-connectivity',
      children: ['hub-vnet']
    });

    // Production Landing Zone Subscription
    this.createNode({
      id: 'sub-landingzone-prod',
      type: 'vnet',
      label: 'Landing Zone - Production',
      layer: 'Compute',
      entityType: 'subscription',
      subscriptionType: 'landingzone-prod',
      children: ['spoke-prod-vnet']
    });

    // Non-Production Landing Zone Subscription (optional)
    if (this.options.includeNonProd) {
      this.createNode({
        id: 'sub-landingzone-nonprod',
        type: 'vnet',
        label: 'Landing Zone - Non-Production',
        layer: 'Compute',
        entityType: 'subscription',
        subscriptionType: 'landingzone-nonprod',
        children: ['spoke-nonprod-vnet']
      });
    }
  }

  private buildConnectivityHub(): void {
    // Hub VNet
    this.createNode({
      id: 'hub-vnet',
      type: 'vnet',
      label: `Hub VNet (${this.options.hubAddressSpace})`,
      layer: 'Networking',
      entityType: 'vnet',
      parentId: 'sub-connectivity',
      addressSpace: this.options.hubAddressSpace,
      children: ['subnet-hub-gateway', 'subnet-hub-firewall', 'subnet-hub-bastion']
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

    // Firewall Subnet
    if (this.options.includeFirewall) {
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
    }

    // Bastion Subnet
    if (this.options.includeBastion) {
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
    }
  }

  private buildManagementServices(): void {
    // Observability
    if (this.options.includeObservability) {
      this.createNode({
        id: 'mgmt-observability',
        type: 'monitor',
        label: 'Observability',
        layer: 'Observability',
        entityType: 'service',
        parentId: 'sub-mgmt',
        children: ['monitor', 'log-analytics']
      });

      this.createNode({
        id: 'monitor',
        type: 'monitor',
        label: 'Azure Monitor',
        layer: 'Observability',
        entityType: 'service',
        parentId: 'mgmt-observability',
        children: []
      });

      this.createNode({
        id: 'log-analytics',
        type: 'loganalytics',
        label: 'Log Analytics',
        layer: 'Observability',
        entityType: 'service',
        parentId: 'mgmt-observability',
        children: []
      });
    }

    // Policy
    if (this.options.includePolicy) {
      this.createNode({
        id: 'mgmt-policy',
        type: 'custom',
        label: 'Azure Policy',
        layer: 'Management',
        entityType: 'service',
        parentId: 'sub-mgmt',
        children: []
      });
    }

    // Defender
    if (this.options.includeDefender) {
      this.createNode({
        id: 'mgmt-defender',
        type: 'defender',
        label: 'Microsoft Defender',
        layer: 'Security',
        entityType: 'service',
        parentId: 'sub-mgmt',
        children: []
      });
    }
  }

  private buildLandingZones(assessment: any): void {
    // Production Landing Zone
    this.buildLandingZone('prod', this.options.prodSpokeAddressSpace || '10.1.0.0/16', assessment);
    
    // Non-Production Landing Zone (optional)
    if (this.options.includeNonProd) {
      this.buildLandingZone('nonprod', this.options.nonProdSpokeAddressSpace || '10.2.0.0/16', assessment);
    }
  }

  private buildLandingZone(environment: string, addressSpace: string, assessment: any): void {
    const vnetId = `spoke-${environment}-vnet`;
    
    // Spoke VNet
    this.createNode({
      id: vnetId,
      type: 'vnet',
      label: `${environment.charAt(0).toUpperCase() + environment.slice(1)} Spoke VNet (${addressSpace})`,
      layer: 'Networking',
      entityType: 'vnet',
      parentId: `sub-landingzone-${environment}`,
      addressSpace: addressSpace,
      children: [`subnet-${environment}-web`, `subnet-${environment}-app`, `subnet-${environment}-db`]
    });

    // Web Subnet
    this.createNode({
      id: `subnet-${environment}-web`,
      type: 'subnet',
      label: `Web Subnet (${this.getSubnetAddress(environment, 'web')})`,
      layer: 'Networking',
      entityType: 'subnet',
      parentId: vnetId,
      addressSpace: this.getSubnetAddress(environment, 'web'),
      children: [`tier-${environment}-web`]
    });

    // App Subnet
    this.createNode({
      id: `subnet-${environment}-app`,
      type: 'subnet',
      label: `App Subnet (${this.getSubnetAddress(environment, 'app')})`,
      layer: 'Networking',
      entityType: 'subnet',
      parentId: vnetId,
      addressSpace: this.getSubnetAddress(environment, 'app'),
      children: [`tier-${environment}-app`]
    });

    // DB Subnet
    this.createNode({
      id: `subnet-${environment}-db`,
      type: 'subnet',
      label: `DB Subnet (${this.getSubnetAddress(environment, 'db')})`,
      layer: 'Networking',
      entityType: 'subnet',
      parentId: vnetId,
      addressSpace: this.getSubnetAddress(environment, 'db'),
      children: [`tier-${environment}-db`]
    });

    // Create tier nodes based on assessment data
    this.createTierNodes(environment, assessment);
  }

  private getSubnetAddress(environment: string, tier: string): string {
    const base = environment === 'prod' ? '10.1' : '10.2';
    const tierIndex = tier === 'web' ? '1' : tier === 'app' ? '2' : '3';
    return `${base}.${tierIndex}.0/24`;
  }

  private createTierNodes(environment: string, assessment: any): void {
    if (!assessment || !assessment.vmSummary || !Array.isArray(assessment.vmSummary)) {
      console.warn('⚠️ [CafSubscriptionBuilder] No VM summary data available, creating default tier nodes');
      this.createDefaultTierNodes(environment);
      return;
    }

    // Group VMs by tier
    const vmGroups = this.groupVMsByTier(assessment.vmSummary, environment);

    // Create tier nodes
    Object.entries(vmGroups).forEach(([tier, vms]) => {
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
    });

    // Always create default tier nodes to ensure all referenced children exist
    this.createDefaultTierNodes(environment);
  }

  private createDefaultTierNodes(environment: string): void {
    const tiers = ['web', 'app', 'db'];
    
    tiers.forEach(tier => {
      const tierNodeId = `tier-${environment}-${tier}`;
      const subnetId = `subnet-${environment}-${tier}`;
      
      // Only create if it doesn't already exist
      if (!this.nodeMap.has(tierNodeId)) {
        this.createNode({
          id: tierNodeId,
          type: 'vm',
          label: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier (0)`,
          layer: 'Compute',
          entityType: 'tier',
          parentId: subnetId,
          vmCount: 0,
          children: []
        });
      }
    });
  }

  private groupVMsByTier(vms: any[], environment: string): Record<string, any[]> {
    const groups: Record<string, any[]> = {
      web: [],
      app: [],
      db: []
    };

    vms.forEach((vm, index) => {
      try {
        if (!vm || !vm.vmName) {
          console.warn(`⚠️ [CafSubscriptionBuilder] VM at index ${index} is missing vmName property:`, vm);
          return;
        }

        const vmEnvironment = this.determineEnvironment(vm.vmName);
        if (vmEnvironment !== environment) return;

        const tier = this.determineTier(vm.vmName);
        
        if (groups[tier]) {
          groups[tier].push(vm);
        } else {
          console.warn(`⚠️ [CafSubscriptionBuilder] Could not categorize VM ${vm.vmName} (tier: ${tier})`);
        }
      } catch (error) {
        console.error(`❌ [CafSubscriptionBuilder] Error processing VM at index ${index}:`, error, vm);
      }
    });

    console.log(`🔍 [CafSubscriptionBuilder] VM grouping results for ${environment}:`, {
      web: groups.web.length,
      app: groups.app.length,
      db: groups.db.length
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

  private buildConnectionEdges(): void {
    // Hub VNet ↔ Spoke VNet peering
    this.addEdge({
      from: 'hub-vnet',
      to: 'spoke-prod-vnet',
      label: 'VNet peering',
      edgeType: 'peering',
      style: 'solid'
    });

    if (this.options.includeNonProd) {
      this.addEdge({
        from: 'hub-vnet',
        to: 'spoke-nonprod-vnet',
        label: 'VNet peering',
        edgeType: 'peering',
        style: 'solid'
      });
    }

    // Observability → Spoke VNet (diagnostics/logs)
    if (this.options.includeObservability) {
      this.addEdge({
        from: 'mgmt-observability',
        to: 'spoke-prod-vnet',
        label: 'Diag/Logs',
        edgeType: 'management',
        style: 'solid'
      });

      if (this.options.includeNonProd) {
        this.addEdge({
          from: 'mgmt-observability',
          to: 'spoke-nonprod-vnet',
          label: 'Diag/Logs',
          edgeType: 'management',
          style: 'solid'
        });
      }
    }

    // Policy → LandingZone subscription (governance)
    if (this.options.includePolicy) {
      this.addEdge({
        from: 'mgmt-policy',
        to: 'sub-landingzone-prod',
        label: 'Governance',
        edgeType: 'governance',
        style: 'dashed'
      });

      if (this.options.includeNonProd) {
        this.addEdge({
          from: 'mgmt-policy',
          to: 'sub-landingzone-nonprod',
          label: 'Governance',
          edgeType: 'governance',
          style: 'dashed'
        });
      }
    }

    // Defender → LandingZone subscription (security posture)
    if (this.options.includeDefender) {
      this.addEdge({
        from: 'mgmt-defender',
        to: 'sub-landingzone-prod',
        label: 'Security posture',
        edgeType: 'security',
        style: 'dashed'
      });

      if (this.options.includeNonProd) {
        this.addEdge({
          from: 'mgmt-defender',
          to: 'sub-landingzone-nonprod',
          label: 'Security posture',
          edgeType: 'security',
          style: 'dashed'
        });
      }
    }

    // East-west flow within production
    this.addEdge({
      from: 'tier-prod-web',
      to: 'tier-prod-app',
      label: 'App flow',
      edgeType: 'east-west',
      style: 'solid'
    });

    this.addEdge({
      from: 'tier-prod-app',
      to: 'tier-prod-db',
      label: 'App flow',
      edgeType: 'east-west',
      style: 'solid'
    });

    // Non-production east-west flow
    if (this.options.includeNonProd) {
      this.addEdge({
        from: 'tier-nonprod-web',
        to: 'tier-nonprod-app',
        label: 'App flow',
        edgeType: 'east-west',
        style: 'solid'
      });

      this.addEdge({
        from: 'tier-nonprod-app',
        to: 'tier-nonprod-db',
        label: 'App flow',
        edgeType: 'east-west',
        style: 'solid'
      });
    }
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
