import { 
  ArchitectureModel, 
  ArchNode, 
  ArchEdge, 
  ManagementGroup, 
  Subscription, 
  VNet, 
  Subnet, 
  ResourceGroup, 
  CAFOptions,
  EntityType,
  SubscriptionType,
  ManagementGroupType,
  NodeType,
  AacLayer
} from '@/types/architecture';

export interface AssessmentData {
  vms: Array<{
    name: string;
    cores: number;
    memoryGB: number;
    region: string;
    osType: string;
    recommendedSize: string;
    tier?: 'web' | 'app' | 'db';
    environment?: 'prod' | 'nonprod';
  }>;
  sqlServers?: Array<{
    name: string;
    region: string;
    environment?: 'prod' | 'nonprod';
  }>;
  storageAccounts?: Array<{
    name: string;
    region: string;
    environment?: 'prod' | 'nonprod';
  }>;
}

export class CAFArchitectureBuilder {
  private model: ArchitectureModel;
  private options: CAFOptions;

  constructor(options: CAFOptions = {}) {
    this.options = {
      showNonProd: true,
      includePrivateEndpoints: true,
      includeObservability: true,
      includeSecurity: true,
      layoutPreset: 'caf',
      ...options
    };
    
    this.model = {
      nodes: [],
      edges: [],
      managementGroups: [],
      subscriptions: [],
      cafOptions: this.options
    };
  }

  buildFromAssessment(assessment: AssessmentData): ArchitectureModel {
    // Build management group hierarchy
    this.buildManagementGroups();
    
    // Build platform subscriptions
    this.buildPlatformSubscriptions();
    
    // Build landing zone subscriptions
    this.buildLandingZoneSubscriptions(assessment);
    
    // Build shared PaaS services
    this.buildSharedPaaSServices(assessment);
    
    // Build connections and relationships
    this.buildConnections();
    
    return this.model;
  }

  private buildManagementGroups(): void {
    const tenantRoot: ManagementGroup = {
      id: 'mg-tenant-root',
      name: 'Tenant Root Group',
      type: 'tenant-root',
      children: ['mg-platform', 'mg-landing-zones']
    };

    const platform: ManagementGroup = {
      id: 'mg-platform',
      name: 'Platform',
      type: 'platform',
      parentId: 'mg-tenant-root',
      children: ['sub-platform-identity', 'sub-platform-management', 'sub-platform-connectivity']
    };

    const landingZones: ManagementGroup = {
      id: 'mg-landing-zones',
      name: 'Landing Zones',
      type: 'landing-zones',
      parentId: 'mg-tenant-root',
      children: ['sub-landingzone-prod']
    };

    if (this.options.showNonProd) {
      landingZones.children!.push('sub-landingzone-nonprod');
    }

    this.model.managementGroups = [tenantRoot, platform, landingZones];
  }

  private buildPlatformSubscriptions(): void {
    // Platform Identity Subscription
    const platformIdentity: Subscription = {
      id: 'sub-platform-identity',
      name: 'Platform-Identity',
      type: 'platform-identity',
      mgId: 'mg-platform',
      vnets: [],
      resourceGroups: []
    };

    // Platform Management Subscription
    const platformManagement: Subscription = {
      id: 'sub-platform-management',
      name: 'Platform-Management',
      type: 'platform-management',
      mgId: 'mg-platform',
      vnets: [],
      resourceGroups: []
    };

    // Platform Connectivity Subscription (Hub)
    const platformConnectivity: Subscription = {
      id: 'sub-platform-connectivity',
      name: 'Platform-Connectivity',
      type: 'platform-connectivity',
      mgId: 'mg-platform',
      vnets: [{
        id: 'vnet-hub',
        name: 'Hub-VNet',
        addressSpace: '10.0.0.0/16',
        subscriptionId: 'sub-platform-connectivity',
        subnets: [
          { id: 'subnet-hub-azurefirewall', name: 'AzureFirewallSubnet', addressPrefix: '10.0.1.0/26', vnetId: 'vnet-hub' },
          { id: 'subnet-hub-bastion', name: 'AzureBastionSubnet', addressPrefix: '10.0.2.0/26', vnetId: 'vnet-hub' },
          { id: 'subnet-hub-gateway', name: 'GatewaySubnet', addressPrefix: '10.0.3.0/27', vnetId: 'vnet-hub' },
          { id: 'subnet-hub-dns', name: 'DNSPrivateResolver', addressPrefix: '10.0.4.0/26', vnetId: 'vnet-hub' }
        ]
      }],
      resourceGroups: []
    };

    this.model.subscriptions = [platformIdentity, platformManagement, platformConnectivity];

    // Add platform nodes
    this.addPlatformNodes();
  }

  private addPlatformNodes(): void {
    // Platform Identity nodes
    this.addNode({
      id: 'node-aad',
      type: 'custom',
      label: 'Azure Active Directory',
      layer: 'Identity',
      entityType: 'service',
      subscriptionId: 'sub-platform-identity',
      subscriptionType: 'platform-identity'
    });

    // Platform Management nodes
    if (this.options.includeObservability) {
      this.addNode({
        id: 'node-observability',
        type: 'custom',
        label: 'Observability',
        layer: 'Observability',
        entityType: 'service',
        subscriptionId: 'sub-platform-management',
        subscriptionType: 'platform-management'
      });

      this.addNode({
        id: 'node-monitor',
        type: 'monitor',
        label: 'Azure Monitor',
        layer: 'Observability',
        entityType: 'service',
        subscriptionId: 'sub-platform-management',
        subscriptionType: 'platform-management'
      });

      this.addNode({
        id: 'node-loganalytics',
        type: 'loganalytics',
        label: 'Log Analytics',
        layer: 'Observability',
        entityType: 'service',
        subscriptionId: 'sub-platform-management',
        subscriptionType: 'platform-management'
      });
    }

    if (this.options.includeSecurity) {
      this.addNode({
        id: 'node-policy',
        type: 'custom',
        label: 'Azure Policy',
        layer: 'Management',
        entityType: 'service',
        subscriptionId: 'sub-platform-management',
        subscriptionType: 'platform-management'
      });

      this.addNode({
        id: 'node-defender',
        type: 'defender',
        label: 'Defender for Cloud',
        layer: 'Security',
        entityType: 'service',
        subscriptionId: 'sub-platform-management',
        subscriptionType: 'platform-management'
      });
    }

    // Platform Connectivity nodes (Hub)
    this.addNode({
      id: 'node-hub-vnet',
      type: 'vnet',
      label: 'Hub VNet (10.0.0.0/16)',
      layer: 'Networking',
      entityType: 'vnet',
      subscriptionId: 'sub-platform-connectivity',
      subscriptionType: 'platform-connectivity',
      addressSpace: '10.0.0.0/16'
    });

    this.addNode({
      id: 'node-azure-firewall',
      type: 'firewall',
      label: 'Azure Firewall',
      layer: 'Security',
      entityType: 'service',
      subscriptionId: 'sub-platform-connectivity',
      subscriptionType: 'platform-connectivity'
    });

    this.addNode({
      id: 'node-bastion',
      type: 'bastion',
      label: 'Azure Bastion',
      layer: 'Security',
      entityType: 'service',
      subscriptionId: 'sub-platform-connectivity',
      subscriptionType: 'platform-connectivity'
    });

    this.addNode({
      id: 'node-dns-resolver',
      type: 'custom',
      label: 'DNS Private Resolver',
      layer: 'Networking',
      entityType: 'service',
      subscriptionId: 'sub-platform-connectivity',
      subscriptionType: 'platform-connectivity'
    });
  }

  private buildLandingZoneSubscriptions(assessment: AssessmentData): void {
    // Group VMs by environment and tier
    const prodVMs = assessment.vms.filter(vm => !vm.environment || vm.environment === 'prod');
    const nonProdVMs = assessment.vms.filter(vm => vm.environment === 'nonprod');

    // Build Production Landing Zone
    this.buildLandingZone('prod', prodVMs, 'sub-landingzone-prod', 'mg-landing-zones');

    // Build Non-Production Landing Zone if enabled
    if (this.options.showNonProd && nonProdVMs.length > 0) {
      this.buildLandingZone('nonprod', nonProdVMs, 'sub-landingzone-nonprod', 'mg-landing-zones');
    }
  }

  private buildLandingZone(environment: string, vms: any[], subscriptionId: string, mgId: string): void {
    const subscription: Subscription = {
      id: subscriptionId,
      name: `LandingZone-${environment.charAt(0).toUpperCase() + environment.slice(1)}`,
      type: environment === 'prod' ? 'landingzone-prod' : 'landingzone-nonprod',
      mgId: mgId,
      vnets: [{
        id: `vnet-spoke-${environment}`,
        name: `Spoke-VNet-${environment.charAt(0).toUpperCase() + environment.slice(1)}`,
        addressSpace: environment === 'prod' ? '10.1.0.0/16' : '10.2.0.0/16',
        subscriptionId: subscriptionId,
        subnets: [
          { id: `subnet-${environment}-web`, name: 'Web-Subnet', addressPrefix: environment === 'prod' ? '10.1.1.0/24' : '10.2.1.0/24', vnetId: `vnet-spoke-${environment}`, tier: 'web' },
          { id: `subnet-${environment}-app`, name: 'App-Subnet', addressPrefix: environment === 'prod' ? '10.1.2.0/24' : '10.2.2.0/24', vnetId: `vnet-spoke-${environment}`, tier: 'app' },
          { id: `subnet-${environment}-db`, name: 'DB-Subnet', addressPrefix: environment === 'prod' ? '10.1.3.0/24' : '10.2.3.0/24', vnetId: `vnet-spoke-${environment}`, tier: 'db' }
        ]
      }],
      resourceGroups: []
    };

    this.model.subscriptions!.push(subscription);

    // Add spoke VNet node
    this.addNode({
      id: `node-spoke-vnet-${environment}`,
      type: 'vnet',
      label: `Spoke VNet (${environment === 'prod' ? '10.1.0.0/16' : '10.2.0.0/16'})`,
      layer: 'Networking',
      entityType: 'vnet',
      subscriptionId: subscriptionId,
      subscriptionType: environment === 'prod' ? 'landingzone-prod' : 'landingzone-nonprod',
      addressSpace: environment === 'prod' ? '10.1.0.0/16' : '10.2.0.0/16'
    });

    // Group VMs by tier and create tier nodes
    const webVMs = vms.filter(vm => vm.tier === 'web');
    const appVMs = vms.filter(vm => vm.tier === 'app');
    const dbVMs = vms.filter(vm => vm.tier === 'db');

    // Add tier nodes with VM counts
    if (webVMs.length > 0) {
      this.addTierNode(environment, 'web', webVMs, subscriptionId);
    }
    if (appVMs.length > 0) {
      this.addTierNode(environment, 'app', appVMs, subscriptionId);
    }
    if (dbVMs.length > 0) {
      this.addTierNode(environment, 'db', dbVMs, subscriptionId);
    }
  }

  private addTierNode(environment: string, tier: string, vms: any[], subscriptionId: string): void {
    const vmSku = vms.length > 0 ? vms[0].recommendedSize : '';
    const uniformSku = vms.every(vm => vm.recommendedSize === vmSku);
    
    this.addNode({
      id: `node-${environment}-${tier}-tier`,
      type: 'vm',
      label: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier (${vms.length})${uniformSku ? ` • ${vmSku}` : ''}`,
      layer: 'Compute',
      entityType: 'tier',
      subscriptionId: subscriptionId,
      subscriptionType: environment === 'prod' ? 'landingzone-prod' : 'landingzone-nonprod',
      vmCount: vms.length,
      vmSku: uniformSku ? vmSku : undefined
    });
  }

  private buildSharedPaaSServices(assessment: AssessmentData): void {
    // Add SQL Server if present
    if (assessment.sqlServers && assessment.sqlServers.length > 0) {
      const sqlServer = assessment.sqlServers[0];
      this.addNode({
        id: 'node-sql-server',
        type: 'sql',
        label: sqlServer.name,
        layer: 'Data',
        entityType: 'paas',
        subscriptionId: 'sub-platform-data',
        subscriptionType: 'platform-data'
      });
    }

    // Add Storage Account if present
    if (assessment.storageAccounts && assessment.storageAccounts.length > 0) {
      const storageAccount = assessment.storageAccounts[0];
      this.addNode({
        id: 'node-storage-account',
        type: 'storage',
        label: storageAccount.name,
        layer: 'Data',
        entityType: 'paas',
        subscriptionId: 'sub-platform-data',
        subscriptionType: 'platform-data'
      });
    }

    // Add Platform Data subscription if we have PaaS services
    if ((assessment.sqlServers && assessment.sqlServers.length > 0) || 
        (assessment.storageAccounts && assessment.storageAccounts.length > 0)) {
      const platformData: Subscription = {
        id: 'sub-platform-data',
        name: 'Platform-Data',
        type: 'platform-data',
        mgId: 'mg-platform',
        vnets: [],
        resourceGroups: []
      };
      this.model.subscriptions!.push(platformData);
    }
  }

  private buildConnections(): void {
    // Management Group governance connections
    this.addEdge({
      from: 'mg-tenant-root',
      to: 'mg-platform',
      label: 'Governance',
      edgeType: 'governance',
      style: 'dashed'
    });

    this.addEdge({
      from: 'mg-tenant-root',
      to: 'mg-landing-zones',
      label: 'Governance',
      edgeType: 'governance',
      style: 'dashed'
    });

    // Platform to Landing Zone governance
    this.model.subscriptions!.forEach(sub => {
      if (sub.type.startsWith('landingzone-')) {
        this.addEdge({
          from: 'mg-platform',
          to: sub.id,
          label: 'Policy/Diag',
          edgeType: 'policy-diagnostics',
          style: 'dashed'
        });
      }
    });

    // Hub to Spoke VNet peering
    this.model.subscriptions!.forEach(sub => {
      if (sub.type.startsWith('landingzone-')) {
        const environment = sub.type === 'landingzone-prod' ? 'prod' : 'nonprod';
        this.addEdge({
          from: 'node-hub-vnet',
          to: `node-spoke-vnet-${environment}`,
          label: 'VNet peering',
          edgeType: 'peering',
          style: 'solid'
        });
      }
    });

    // Private Endpoints from PaaS to Spokes
    if (this.options.includePrivateEndpoints) {
      this.model.subscriptions!.forEach(sub => {
        if (sub.type.startsWith('landingzone-')) {
          const environment = sub.type === 'landingzone-prod' ? 'prod' : 'nonprod';
          
          // SQL Server private endpoint
          if (this.model.nodes.find(n => n.id === 'node-sql-server')) {
            this.addEdge({
              from: 'node-sql-server',
              to: `node-spoke-vnet-${environment}`,
              label: 'PE ×1',
              edgeType: 'private-endpoint',
              style: 'solid'
            });
          }
          
          // Storage Account private endpoint
          if (this.model.nodes.find(n => n.id === 'node-storage-account')) {
            this.addEdge({
              from: 'node-storage-account',
              to: `node-spoke-vnet-${environment}`,
              label: 'PE ×1',
              edgeType: 'private-endpoint',
              style: 'solid'
            });
          }
        }
      });
    }

    // Security connections
    if (this.options.includeSecurity) {
      this.model.subscriptions!.forEach(sub => {
        if (sub.type.startsWith('landingzone-')) {
          this.addEdge({
            from: 'node-defender',
            to: sub.id,
            label: 'Security',
            edgeType: 'security',
            style: 'solid'
          });
        }
      });
    }
  }

  private addNode(node: ArchNode): void {
    this.model.nodes.push(node);
  }

  private addEdge(edge: ArchEdge): void {
    this.model.edges.push(edge);
  }
}
