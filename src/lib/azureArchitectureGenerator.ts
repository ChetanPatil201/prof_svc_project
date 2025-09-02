import type { AssessmentReportData } from '@/types/assessmentReport';
import type { Node, Edge } from 'reactflow';

export interface AzureArchitectureData {
  nodes: Node[];
  edges: Edge[];
}

export function generateAzureArchitecture(
  assessment: AssessmentReportData,
  layout: 'hub-spoke' | 'simple' | 'caf' | 'foundation' = 'foundation',
  options: {
    showNonProd?: boolean;
    includeObservability?: boolean;
    includeSecurity?: boolean;
  } = {}
): AzureArchitectureData {
  const { showNonProd = true, includeObservability = true, includeSecurity = true } = options;
  
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let nodeId = 0;
  let edgeId = 0;

  // Helper function to add node
  const addNode = (data: any, position: { x: number; y: number }, type: string = 'azureNode') => {
    const id = `node-${nodeId++}`;
    nodes.push({
      id,
      type,
      position,
      data,
    });
    return id;
  };

  // Helper function to add edge
  const addEdge = (source: string, target: string, data?: any) => {
    edges.push({
      id: `edge-${edgeId++}`,
      source,
      target,
      type: 'custom',
      data,
    });
  };

  if (layout === 'foundation') {
    // Production Subscription - Transparent
    const prodSubId = addNode(
      { 
        type: 'subscription', 
        label: 'Production Subscription', 
        layer: 'Management', 
        description: 'Production workloads and resources',
        meta: { 
          subscriptionType: 'Production',
          region: 'East US',
          environment: 'Production'
        }
      },
      { x: 400, y: 150 },
      'groupNode'
    );

    // Production Virtual Network
    const prodVnetId = addNode(
      { 
        type: 'vnet', 
        label: 'Production Virtual Network', 
        layer: 'Networking',
        description: 'Main production network infrastructure',
        meta: { 
          addressSpace: '10.0.0.0/16',
          region: 'East US',
          vnetType: 'Production'
        }
      },
      { x: 400, y: 220 },
      'groupNode'
    );

    // Connect subscription to VNet
    addEdge(prodSubId, prodVnetId, { label: 'Contains', style: 'dashed' });

  } else if (layout === 'caf') {
    // Enterprise Enrollment (Top Level)
    const enrollmentId = addNode(
      { 
        type: 'enrollment', 
        label: 'Enterprise Enrollment', 
        layer: 'Management', 
        description: 'Contoso Enterprise',
        meta: { enrollmentType: 'Enterprise Agreement' }
      },
      { x: 400, y: 50 },
      'groupNode'
    );

    // Department and Account Structure
    const departmentId = addNode(
      { 
        type: 'department', 
        label: 'Department', 
        layer: 'Management', 
        description: 'IT Department'
      },
      { x: 400, y: 120 },
      'groupNode'
    );

    const accountId = addNode(
      { 
        type: 'account', 
        label: 'Account', 
        layer: 'Management', 
        description: 'Azure Account'
      },
      { x: 400, y: 190 },
      'groupNode'
    );

    const subscriptionId = addNode(
      { 
        type: 'subscription', 
        label: 'Subscription', 
        layer: 'Management', 
        description: 'Azure Subscription'
      },
      { x: 400, y: 260 },
      'groupNode'
    );

    // Azure Active Directory
    const aadId = addNode(
      { 
        type: 'identity', 
        label: 'Azure Active Directory', 
        layer: 'Identity',
        meta: { 
          services: ['Service principal(s)', 'Security group(s)', 'Users'],
          tier: 'Premium P2'
        }
      },
      { x: 600, y: 260 }
    );

    // On-premises AD
    const onPremAdId = addNode(
      { 
        type: 'identity', 
        label: 'On-premises Active Directory', 
        layer: 'Identity',
        meta: { tier: 'Hybrid' }
      },
      { x: 800, y: 260 }
    );

    // Privileged Identity Management
    const pimId = addNode(
      { 
        type: 'identity', 
        label: 'Privileged Identity Management', 
        layer: 'Identity',
        meta: { 
          roles: ['App/DevOps', 'Subscription manager', 'Other custom roles'],
          tier: 'Premium P2'
        }
      },
      { x: 600, y: 330 }
    );

    // Identity and Access Management
    const iamId = addNode(
      { 
        type: 'identity', 
        label: 'Identity and Access Management', 
        layer: 'Identity',
        meta: { 
          features: ['Approval workflow', 'Notifications', 'MFA', 'Access reviews', 'Audit reports']
        }
      },
      { x: 600, y: 400 }
    );

    // Tenant Root Group
    const tenantRootId = addNode(
      { 
        type: 'management-group', 
        label: 'Tenant Root Group', 
        layer: 'Management', 
        description: 'Contoso',
        meta: { groupType: 'Root' }
      },
      { x: 400, y: 470 },
      'groupNode'
    );

    // Platform Management Group
    const platformMgmtId = addNode(
      { 
        type: 'management-group', 
        label: 'Platform', 
        layer: 'Management', 
        description: 'Platform services and governance',
        meta: { groupType: 'Platform' }
      },
      { x: 200, y: 540 },
      'groupNode'
    );

    // Landing Zones Management Group
    const landingZonesMgmtId = addNode(
      { 
        type: 'management-group', 
        label: 'Landing Zones', 
        layer: 'Management', 
        description: 'Application landing zones',
        meta: { groupType: 'Landing Zones' }
      },
      { x: 400, y: 540 },
      'groupNode'
    );

    // Sandbox Management Group
    const sandboxMgmtId = addNode(
      { 
        type: 'management-group', 
        label: 'Sandbox', 
        layer: 'Management', 
        description: 'Development and testing',
        meta: { groupType: 'Sandbox' }
      },
      { x: 600, y: 540 },
      'groupNode'
    );

    // Decommissioned Management Group
    const decommissionedMgmtId = addNode(
      { 
        type: 'management-group', 
        label: 'Decommissioned', 
        layer: 'Management', 
        description: 'Resources being decommissioned',
        meta: { groupType: 'Decommissioned' }
      },
      { x: 800, y: 540 },
      'groupNode'
    );

    // Platform Sub-groups
    const identityMgmtId = addNode(
      { 
        type: 'management-group', 
        label: 'Identity', 
        layer: 'Identity', 
        description: 'Identity services',
        meta: { groupType: 'Identity' }
      },
      { x: 100, y: 610 },
      'groupNode'
    );

    const managementMgmtId = addNode(
      { 
        type: 'management-group', 
        label: 'Management', 
        layer: 'Management', 
        description: 'Management and monitoring',
        meta: { groupType: 'Management' }
      },
      { x: 200, y: 610 },
      'groupNode'
    );

    const connectivityMgmtId = addNode(
      { 
        type: 'management-group', 
        label: 'Connectivity', 
        layer: 'Networking', 
        description: 'Network connectivity',
        meta: { groupType: 'Connectivity' }
      },
      { x: 300, y: 610 },
      'groupNode'
    );

    // Landing Zone Sub-groups
    const sapMgmtId = addNode(
      { 
        type: 'management-group', 
        label: 'SAP', 
        layer: 'Compute', 
        description: 'SAP workloads',
        meta: { groupType: 'SAP' }
      },
      { x: 350, y: 610 },
      'groupNode'
    );

    const corpMgmtId = addNode(
      { 
        type: 'management-group', 
        label: 'Corp', 
        layer: 'Compute', 
        description: 'Corporate applications',
        meta: { groupType: 'Corp' }
      },
      { x: 450, y: 610 },
      'groupNode'
    );

    const onlineMgmtId = addNode(
      { 
        type: 'management-group', 
        label: 'Online', 
        layer: 'Compute', 
        description: 'Online services',
        meta: { groupType: 'Online' }
      },
      { x: 550, y: 610 },
      'groupNode'
    );

    // Subscriptions
    const identitySubId = addNode(
      { 
        type: 'subscription', 
        label: 'Identity Subscription', 
        layer: 'Identity', 
        description: 'Azure AD and identity services',
        meta: { subscriptionType: 'Identity' }
      },
      { x: 100, y: 680 },
      'groupNode'
    );

    const managementSubId = addNode(
      { 
        type: 'subscription', 
        label: 'Management Subscription', 
        layer: 'Management', 
        description: 'Management and monitoring services',
        meta: { subscriptionType: 'Management' }
      },
      { x: 200, y: 680 },
      'groupNode'
    );

    const connectivitySubId = addNode(
      { 
        type: 'subscription', 
        label: 'Connectivity Subscription', 
        layer: 'Networking', 
        description: 'Network and security services',
        meta: { subscriptionType: 'Connectivity' }
      },
      { x: 300, y: 680 },
      'groupNode'
    );

    const landingZoneA1Id = addNode(
      { 
        type: 'subscription', 
        label: 'Landing Zone A1', 
        layer: 'Compute', 
        description: 'Production landing zone',
        meta: { subscriptionType: 'Production' }
      },
      { x: 400, y: 680 },
      'groupNode'
    );

    const landingZoneA2Id = addNode(
      { 
        type: 'subscription', 
        label: 'Landing Zone A2', 
        layer: 'Compute', 
        description: 'Secondary landing zone',
        meta: { subscriptionType: 'Production' }
      },
      { x: 500, y: 680 },
      'groupNode'
    );

    const sandboxSub1Id = addNode(
      { 
        type: 'subscription', 
        label: 'Sandbox Subscription 1', 
        layer: 'Compute', 
        description: 'Development environment',
        meta: { subscriptionType: 'Development' }
      },
      { x: 600, y: 680 },
      'groupNode'
    );

    const sandboxSub2Id = addNode(
      { 
        type: 'subscription', 
        label: 'Sandbox Subscription 2', 
        layer: 'Compute', 
        description: 'Testing environment',
        meta: { subscriptionType: 'Testing' }
      },
      { x: 700, y: 680 },
      'groupNode'
    );

    const decommissionedSubId = addNode(
      { 
        type: 'subscription', 
        label: 'Decommissioned Subscriptions', 
        layer: 'Management', 
        description: 'Resources being decommissioned',
        meta: { subscriptionType: 'Decommissioned' }
      },
      { x: 800, y: 680 },
      'groupNode'
    );

    // DevOps Section
    const platformDevOpsId = addNode(
      { 
        type: 'devops', 
        label: 'Platform DevOps Team', 
        layer: 'DevOps', 
        description: 'Platform engineering team',
        meta: { teamType: 'Platform' }
      },
      { x: 1000, y: 400 },
      'groupNode'
    );

    const gitRepoId = addNode(
      { 
        type: 'devops', 
        label: 'Git Repository', 
        layer: 'DevOps',
        meta: { 
          artifacts: ['Role definitions', 'PolicySet definitions', 'Policy definitions', 'Role assignments', 'Policy assignments', 'Resource templates']
        }
      },
      { x: 1000, y: 500 }
    );

    const boardsId = addNode(
      { 
        type: 'devops', 
        label: 'Boards', 
        layer: 'DevOps',
        meta: { features: ['Wiki'] }
      },
      { x: 1000, y: 570 }
    );

    const deploymentPipelineId = addNode(
      { 
        type: 'devops', 
        label: 'Deployment Pipeline(s)', 
        layer: 'DevOps',
        meta: { 
          pipelines: ['Subscription provisioning', 'Role provisioning', 'Policy deployment', 'Platform deployment']
        }
      },
      { x: 1000, y: 640 }
    );

    // Identity Subscription Details
    const identityRgId = addNode(
      { 
        type: 'resource-group', 
        label: 'Resource Group(s)', 
        layer: 'Management',
        meta: { 
          resources: ['DC1', 'DC2', 'Azure Key Vault (Recovery...)']
        }
      },
      { x: 100, y: 750 }
    );

    const identityCostMgmtId = addNode(
      { 
        type: 'cost-management', 
        label: 'Cost Management', 
        layer: 'Management',
        meta: { tier: 'Standard' }
      },
      { x: 100, y: 820 }
    );

    const identityMonitorId = addNode(
      { 
        type: 'monitor', 
        label: 'Azure Monitor', 
        layer: 'Observability',
        meta: { tier: 'Standard' }
      },
      { x: 100, y: 890 }
    );

    // Management Subscription Details
    const managementDashboardId = addNode(
      { 
        type: 'dashboard', 
        label: 'Dashboards (Azure Portal)', 
        layer: 'Management',
        meta: { tier: 'Standard' }
      },
      { x: 200, y: 750 }
    );

    const automationAccountId = addNode(
      { 
        type: 'automation', 
        label: 'Automation Account(s)', 
        layer: 'Management',
        meta: { 
          features: ['Change tracking', 'Inventory management', 'Update management']
        }
      },
      { x: 200, y: 820 }
    );

    const logAnalyticsId = addNode(
      { 
        type: 'loganalytics', 
        label: 'Log Analytics Workspace', 
        layer: 'Observability',
        meta: { 
          features: ['Dashboards', 'Queries', 'Alerting']
        }
      },
      { x: 200, y: 890 }
    );

    const onPremSystemsId = addNode(
      { 
        type: 'onprem', 
        label: 'On-premises Systems', 
        layer: 'Management',
        meta: { tier: 'Hybrid' }
      },
      { x: 200, y: 960 }
    );

    // Connectivity Subscription Details
    const ddosId = addNode(
      { 
        type: 'ddos', 
        label: 'Azure DDoS Standard', 
        layer: 'Security',
        meta: { tier: 'Standard' }
      },
      { x: 300, y: 750 }
    );

    const dnsId = addNode(
      { 
        type: 'dns', 
        label: 'Azure DNS', 
        layer: 'Networking',
        meta: { tier: 'Standard' }
      },
      { x: 300, y: 820 }
    );

    const hubVnetId = addNode(
      { 
        type: 'vnet', 
        label: 'Hub VNet Region 1', 
        layer: 'Networking',
        meta: { 
          addressSpace: '10.0.0.0/16',
          resources: ['Azure Firewall', 'ExpressRoute', 'VPN']
        }
      },
      { x: 300, y: 890 }
    );

    const vnetPeeringId = addNode(
      { 
        type: 'vnet-peering', 
        label: 'VNet Peering', 
        layer: 'Networking',
        meta: { tier: 'Standard' }
      },
      { x: 300, y: 960 }
    );

    // Landing Zone Subscription Details
    const landingZoneVnetId = addNode(
      { 
        type: 'vnet', 
        label: 'Virtual Network', 
        layer: 'Networking',
        meta: { 
          addressSpace: '10.1.0.0/16',
          components: ['DNS', 'UDR(s)', 'NSG/ASG(s)']
        }
      },
      { x: 400, y: 750 }
    );

    const loadBalancerId = addNode(
      { 
        type: 'lb', 
        label: 'Load Balancer', 
        layer: 'Networking',
        meta: { tier: 'Standard' }
      },
      { x: 400, y: 820 }
    );

    const landingZoneRgId = addNode(
      { 
        type: 'resource-group', 
        label: 'Resource Group(s)', 
        layer: 'Management',
        meta: { 
          resources: ['Azure Key Vault', 'File Share', 'Recovery...', 'Application', 'Application', 'Application']
        }
      },
      { x: 400, y: 890 }
    );

    const landingZoneDashboardId = addNode(
      { 
        type: 'dashboard', 
        label: 'Dashboards (Azure Portal)', 
        layer: 'Management',
        meta: { tier: 'Standard' }
      },
      { x: 400, y: 960 }
    );

    const recoveryVaultId = addNode(
      { 
        type: 'recovery-vault', 
        label: 'Recovery Services Vault(s)', 
        layer: 'Management',
        meta: { tier: 'Standard' }
      },
      { x: 400, y: 1030 }
    );

    const sharedServicesId = addNode(
      { 
        type: 'shared-services', 
        label: 'Shared Services', 
        layer: 'Compute',
        meta: { tier: 'Standard' }
      },
      { x: 400, y: 1100 }
    );

    const vmSkusId = addNode(
      { 
        type: 'vm-skus', 
        label: 'VM SKU(s)', 
        layer: 'Compute',
        meta: { 
          features: ['Access credentials', 'In-guest policies/DSC', 'Backup policy', 'Extensions', 'Tagging']
        }
      },
      { x: 400, y: 1170 }
    );

    const compliantTemplatesId = addNode(
      { 
        type: 'templates', 
        label: 'Compliant VM Templates', 
        layer: 'Management',
        meta: { tier: 'Standard' }
      },
      { x: 400, y: 1240 }
    );

    // Sandbox Subscription Details
    const sandboxApp1Id = addNode(
      { 
        type: 'application', 
        label: 'Application', 
        layer: 'Compute',
        meta: { tier: 'Development' }
      },
      { x: 600, y: 750 }
    );

    const sandboxApp2Id = addNode(
      { 
        type: 'application', 
        label: 'Application', 
        layer: 'Compute',
        meta: { tier: 'Development' }
      },
      { x: 600, y: 820 }
    );

    const sandboxApp3Id = addNode(
      { 
        type: 'application', 
        label: 'Application', 
        layer: 'Compute',
        meta: { tier: 'Development' }
      },
      { x: 600, y: 890 }
    );

    // Standard Management Components (shown for each subscription)
    const standardComponents = [
      { id: 'role-entitlement', label: 'Role Entitlement', layer: 'Security' },
      { id: 'policy-assignment', label: 'Policy Assignment', layer: 'Management' },
      { id: 'network-watcher', label: 'Network Watcher', layer: 'Networking' },
      { id: 'security-center', label: 'Security Center', layer: 'Security' }
    ];

    // Add standard components to each subscription
    [identitySubId, managementSubId, connectivitySubId, landingZoneA1Id, landingZoneA2Id, sandboxSub1Id, sandboxSub2Id, decommissionedSubId].forEach((subId, index) => {
      standardComponents.forEach((comp, compIndex) => {
        const compId = addNode(
          { 
            type: comp.id, 
            label: comp.label, 
            layer: comp.layer,
            meta: { tier: 'Standard' }
          },
          { x: 100 + (index * 100), y: 750 + (compIndex * 70) }
        );
        addEdge(subId, compId, { label: 'Contains', style: 'dashed' });
      });
    });

    // Connect Enterprise Enrollment hierarchy
    addEdge(enrollmentId, departmentId, { label: 'Contains', style: 'dashed' });
    addEdge(departmentId, accountId, { label: 'Contains', style: 'dashed' });
    addEdge(accountId, subscriptionId, { label: 'Contains', style: 'dashed' });
    addEdge(subscriptionId, aadId, { label: 'Connects to' });

    // Connect Identity services
    addEdge(aadId, onPremAdId, { label: 'Syncs with' });
    addEdge(aadId, pimId, { label: 'Manages' });
    addEdge(pimId, iamId, { label: 'Provides' });

    // Connect Management Groups
    addEdge(tenantRootId, platformMgmtId, { label: 'Contains', style: 'dashed' });
    addEdge(tenantRootId, landingZonesMgmtId, { label: 'Contains', style: 'dashed' });
    addEdge(tenantRootId, sandboxMgmtId, { label: 'Contains', style: 'dashed' });
    addEdge(tenantRootId, decommissionedMgmtId, { label: 'Contains', style: 'dashed' });

    // Connect Platform sub-groups
    addEdge(platformMgmtId, identityMgmtId, { label: 'Contains', style: 'dashed' });
    addEdge(platformMgmtId, managementMgmtId, { label: 'Contains', style: 'dashed' });
    addEdge(platformMgmtId, connectivityMgmtId, { label: 'Contains', style: 'dashed' });

    // Connect Landing Zone sub-groups
    addEdge(landingZonesMgmtId, sapMgmtId, { label: 'Contains', style: 'dashed' });
    addEdge(landingZonesMgmtId, corpMgmtId, { label: 'Contains', style: 'dashed' });
    addEdge(landingZonesMgmtId, onlineMgmtId, { label: 'Contains', style: 'dashed' });

    // Connect Subscriptions to Management Groups
    addEdge(identityMgmtId, identitySubId, { label: 'Contains', style: 'dashed' });
    addEdge(managementMgmtId, managementSubId, { label: 'Contains', style: 'dashed' });
    addEdge(connectivityMgmtId, connectivitySubId, { label: 'Contains', style: 'dashed' });
    addEdge(corpMgmtId, landingZoneA1Id, { label: 'Contains', style: 'dashed' });
    addEdge(corpMgmtId, landingZoneA2Id, { label: 'Contains', style: 'dashed' });
    addEdge(sandboxMgmtId, sandboxSub1Id, { label: 'Contains', style: 'dashed' });
    addEdge(sandboxMgmtId, sandboxSub2Id, { label: 'Contains', style: 'dashed' });
    addEdge(decommissionedMgmtId, decommissionedSubId, { label: 'Contains', style: 'dashed' });

    // Connect DevOps
    addEdge(aadId, platformDevOpsId, { label: 'Authenticates' });
    addEdge(platformDevOpsId, gitRepoId, { label: 'Manages' });
    addEdge(gitRepoId, deploymentPipelineId, { label: 'Deploys from' });
    addEdge(platformDevOpsId, boardsId, { label: 'Uses' });

    // Connect Identity Subscription details
    addEdge(identitySubId, identityRgId, { label: 'Contains', style: 'dashed' });
    addEdge(identitySubId, identityCostMgmtId, { label: 'Contains', style: 'dashed' });
    addEdge(identitySubId, identityMonitorId, { label: 'Contains', style: 'dashed' });

    // Connect Management Subscription details
    addEdge(managementSubId, managementDashboardId, { label: 'Contains', style: 'dashed' });
    addEdge(managementSubId, automationAccountId, { label: 'Contains', style: 'dashed' });
    addEdge(managementSubId, logAnalyticsId, { label: 'Contains', style: 'dashed' });
    addEdge(managementSubId, onPremSystemsId, { label: 'Connects to', style: 'dashed' });

    // Connect Connectivity Subscription details
    addEdge(connectivitySubId, ddosId, { label: 'Contains', style: 'dashed' });
    addEdge(connectivitySubId, dnsId, { label: 'Contains', style: 'dashed' });
    addEdge(connectivitySubId, hubVnetId, { label: 'Contains', style: 'dashed' });
    addEdge(connectivitySubId, vnetPeeringId, { label: 'Contains', style: 'dashed' });

    // Connect Landing Zone Subscription details
    addEdge(landingZoneA1Id, landingZoneVnetId, { label: 'Contains', style: 'dashed' });
    addEdge(landingZoneA1Id, loadBalancerId, { label: 'Contains', style: 'dashed' });
    addEdge(landingZoneA1Id, landingZoneRgId, { label: 'Contains', style: 'dashed' });
    addEdge(landingZoneA1Id, landingZoneDashboardId, { label: 'Contains', style: 'dashed' });
    addEdge(landingZoneA1Id, recoveryVaultId, { label: 'Contains', style: 'dashed' });
    addEdge(landingZoneA1Id, sharedServicesId, { label: 'Contains', style: 'dashed' });
    addEdge(landingZoneA1Id, vmSkusId, { label: 'Contains', style: 'dashed' });
    addEdge(landingZoneA1Id, compliantTemplatesId, { label: 'Contains', style: 'dashed' });

    // Connect Sandbox Subscription details
    addEdge(sandboxSub1Id, sandboxApp1Id, { label: 'Contains', style: 'dashed' });
    addEdge(sandboxSub1Id, sandboxApp2Id, { label: 'Contains', style: 'dashed' });
    addEdge(sandboxSub1Id, sandboxApp3Id, { label: 'Contains', style: 'dashed' });

  } else if (layout === 'hub-spoke') {
    // Azure Virtual Network Manager (Top Center)
    const vnetManagerId = addNode(
      { 
        type: 'vnet-manager', 
        label: 'Azure Virtual Network Manager', 
        layer: 'Management', 
        description: 'Centralized network management',
        meta: { tier: 'Standard' }
      },
      { x: 400, y: 50 }
    );

    // Hub Virtual Network
    const hubVnetId = addNode(
      { 
        type: 'vnet', 
        label: 'Hub Virtual Network', 
        layer: 'Networking',
        description: 'Central hub for connectivity and shared services',
        meta: { 
          addressSpace: '10.0.0.0/16',
          region: 'East US',
          vnetType: 'Hub'
        }
      },
      { x: 400, y: 150 },
      'groupNode'
    );

    // Azure Bastion in Hub
    const bastionId = addNode(
      { 
        type: 'bastion', 
        label: 'Azure Bastion', 
        layer: 'Security',
        description: 'Secure RDP/SSH access',
        meta: { tier: 'Standard' }
      },
      { x: 300, y: 220 }
    );

    // Azure Firewall in Hub
    const firewallId = addNode(
      { 
        type: 'firewall', 
        label: 'Azure Firewall', 
        layer: 'Security',
        description: 'Centralized network security',
        meta: { tier: 'Standard' }
      },
      { x: 400, y: 220 }
    );

    // VPN Gateway/ExpressRoute in Hub
    const vpnGatewayId = addNode(
      { 
        type: 'vpn-gateway', 
        label: 'VPN Gateway/ExpressRoute', 
        layer: 'Networking',
        description: 'Cross-premises connectivity',
        meta: { tier: 'Standard' }
      },
      { x: 500, y: 220 }
    );

    // Azure Monitor
    const monitorId = addNode(
      { 
        type: 'monitor', 
        label: 'Azure Monitor', 
        layer: 'Observability',
        description: 'Centralized monitoring and diagnostics',
        meta: { tier: 'Standard' }
      },
      { x: 600, y: 150 }
    );

    // Cross-premises Network
    const crossPremisesId = addNode(
      { 
        type: 'cross-premises', 
        label: 'Cross-premises Network', 
        layer: 'Networking',
        description: 'On-premises infrastructure',
        meta: { tier: 'Hybrid' }
      },
      { x: 200, y: 150 },
      'groupNode'
    );

    // VMs in Cross-premises
    const crossPremisesVm1Id = addNode(
      { 
        type: 'vm', 
        label: 'Virtual Machine', 
        layer: 'Compute',
        meta: { tier: 'On-premises' }
      },
      { x: 150, y: 220 }
    );

    const crossPremisesVm2Id = addNode(
      { 
        type: 'vm', 
        label: 'Virtual Machine', 
        layer: 'Compute',
        meta: { tier: 'On-premises' }
      },
      { x: 250, y: 220 }
    );

    // Production Spoke Virtual Networks
    const prodSpoke1Id = addNode(
      { 
        type: 'vnet', 
        label: 'Production Spoke Virtual Network', 
        layer: 'Networking',
        description: 'Production workload network',
        meta: { 
          addressSpace: '10.1.0.0/16',
          region: 'East US',
          vnetType: 'Production Spoke'
        }
      },
      { x: 600, y: 150 },
      'groupNode'
    );

    const prodSpoke2Id = addNode(
      { 
        type: 'vnet', 
        label: 'Production Spoke Virtual Network', 
        layer: 'Networking',
        description: 'Production workload network',
        meta: { 
          addressSpace: '10.2.0.0/16',
          region: 'East US',
          vnetType: 'Production Spoke'
        }
      },
      { x: 700, y: 150 },
      'groupNode'
    );

    // Resource Subnets in Production Spokes
    const prodSpoke1SubnetId = addNode(
      { 
        type: 'subnet', 
        label: 'Resource Subnet(s)', 
        layer: 'Networking',
        description: 'Application resources',
        meta: { addressRange: '10.1.1.0/24' }
      },
      { x: 600, y: 220 },
      'groupNode'
    );

    const prodSpoke2SubnetId = addNode(
      { 
        type: 'subnet', 
        label: 'Resource Subnet(s)', 
        layer: 'Networking',
        description: 'Application resources',
        meta: { addressRange: '10.2.1.0/24' }
      },
      { x: 700, y: 220 },
      'groupNode'
    );

    // VMs in Production Spoke Subnets
    const prodVm1Id = addNode(
      { 
        type: 'vm', 
        label: 'Virtual Machine', 
        layer: 'Compute',
        meta: { tier: 'Production' }
      },
      { x: 550, y: 290 }
    );

    const prodVm2Id = addNode(
      { 
        type: 'vm', 
        label: 'Virtual Machine', 
        layer: 'Compute',
        meta: { tier: 'Production' }
      },
      { x: 600, y: 290 }
    );

    const prodVm3Id = addNode(
      { 
        type: 'vm', 
        label: 'Virtual Machine', 
        layer: 'Compute',
        meta: { tier: 'Production' }
      },
      { x: 650, y: 290 }
    );

    const prodVm4Id = addNode(
      { 
        type: 'vm', 
        label: 'Virtual Machine', 
        layer: 'Compute',
        meta: { tier: 'Production' }
      },
      { x: 650, y: 290 }
    );

    const prodVm5Id = addNode(
      { 
        type: 'vm', 
        label: 'Virtual Machine', 
        layer: 'Compute',
        meta: { tier: 'Production' }
      },
      { x: 700, y: 290 }
    );

    const prodVm6Id = addNode(
      { 
        type: 'vm', 
        label: 'Virtual Machine', 
        layer: 'Compute',
        meta: { tier: 'Production' }
      },
      { x: 750, y: 290 }
    );

    // Non-production Spoke Virtual Networks
    const nonProdSpoke1Id = addNode(
      { 
        type: 'vnet', 
        label: 'Non-production Spoke Virtual Network', 
        layer: 'Networking',
        description: 'Development and testing network',
        meta: { 
          addressSpace: '10.3.0.0/16',
          region: 'East US',
          vnetType: 'Non-production Spoke'
        }
      },
      { x: 400, y: 350 },
      'groupNode'
    );

    const nonProdSpoke2Id = addNode(
      { 
        type: 'vnet', 
        label: 'Non-production Spoke Virtual Network', 
        layer: 'Networking',
        description: 'Development and testing network',
        meta: { 
          addressSpace: '10.4.0.0/16',
          region: 'East US',
          vnetType: 'Non-production Spoke'
        }
      },
      { x: 500, y: 350 },
      'groupNode'
    );

    // Resource Subnets in Non-production Spokes
    const nonProdSpoke1SubnetId = addNode(
      { 
        type: 'subnet', 
        label: 'Resource Subnet(s)', 
        layer: 'Networking',
        description: 'Development resources',
        meta: { addressRange: '10.3.1.0/24' }
      },
      { x: 400, y: 420 },
      'groupNode'
    );

    const nonProdSpoke2SubnetId = addNode(
      { 
        type: 'subnet', 
        label: 'Resource Subnet(s)', 
        layer: 'Networking',
        description: 'Development resources',
        meta: { addressRange: '10.4.1.0/24' }
      },
      { x: 500, y: 420 },
      'groupNode'
    );

    // VMs in Non-production Spoke Subnets
    const nonProdVm1Id = addNode(
      { 
        type: 'vm', 
        label: 'Virtual Machine', 
        layer: 'Compute',
        meta: { tier: 'Development' }
      },
      { x: 350, y: 490 }
    );

    const nonProdVm2Id = addNode(
      { 
        type: 'vm', 
        label: 'Virtual Machine', 
        layer: 'Compute',
        meta: { tier: 'Development' }
      },
      { x: 400, y: 490 }
    );

    const nonProdVm3Id = addNode(
      { 
        type: 'vm', 
        label: 'Virtual Machine', 
        layer: 'Compute',
        meta: { tier: 'Development' }
      },
      { x: 450, y: 490 }
    );

    const nonProdVm4Id = addNode(
      { 
        type: 'vm', 
        label: 'Virtual Machine', 
        layer: 'Compute',
        meta: { tier: 'Development' }
      },
      { x: 450, y: 490 }
    );

    const nonProdVm5Id = addNode(
      { 
        type: 'vm', 
        label: 'Virtual Machine', 
        layer: 'Compute',
        meta: { tier: 'Development' }
      },
      { x: 500, y: 490 }
    );

    const nonProdVm6Id = addNode(
      { 
        type: 'vm', 
        label: 'Virtual Machine', 
        layer: 'Compute',
        meta: { tier: 'Development' }
      },
      { x: 550, y: 490 }
    );

    // Connect VNet Manager to Hub
    addEdge(vnetManagerId, hubVnetId, { label: 'Manages', style: 'solid' });

    // Connect Hub services
    addEdge(hubVnetId, bastionId, { label: 'Contains', style: 'dashed' });
    addEdge(hubVnetId, firewallId, { label: 'Contains', style: 'dashed' });
    addEdge(hubVnetId, vpnGatewayId, { label: 'Contains', style: 'dashed' });

    // Connect Cross-premises to Hub via VPN Gateway
    addEdge(crossPremisesId, vpnGatewayId, { label: 'Connected via', style: 'solid' });
    addEdge(crossPremisesId, crossPremisesVm1Id, { label: 'Contains', style: 'dashed' });
    addEdge(crossPremisesId, crossPremisesVm2Id, { label: 'Contains', style: 'dashed' });

    // Connect Production Spokes to Hub via VNet Peering
    addEdge(prodSpoke1Id, hubVnetId, { label: 'VNet Peering', style: 'dotted' });
    addEdge(prodSpoke2Id, hubVnetId, { label: 'VNet Peering', style: 'dotted' });

    // Connect Production Spoke Subnets
    addEdge(prodSpoke1Id, prodSpoke1SubnetId, { label: 'Contains', style: 'dashed' });
    addEdge(prodSpoke2Id, prodSpoke2SubnetId, { label: 'Contains', style: 'dashed' });

    // Connect VMs to Production Subnets
    addEdge(prodSpoke1SubnetId, prodVm1Id, { label: 'Contains', style: 'dashed' });
    addEdge(prodSpoke1SubnetId, prodVm2Id, { label: 'Contains', style: 'dashed' });
    addEdge(prodSpoke1SubnetId, prodVm3Id, { label: 'Contains', style: 'dashed' });
    addEdge(prodSpoke2SubnetId, prodVm4Id, { label: 'Contains', style: 'dashed' });
    addEdge(prodSpoke2SubnetId, prodVm5Id, { label: 'Contains', style: 'dashed' });
    addEdge(prodSpoke2SubnetId, prodVm6Id, { label: 'Contains', style: 'dashed' });

    // Connect Non-production Spokes
    addEdge(nonProdSpoke1Id, vpnGatewayId, { label: 'Connected Virtual Networks', style: 'dotted' });
    addEdge(nonProdSpoke2Id, hubVnetId, { label: 'Virtual Networks Connected or Peered Through Hub', style: 'dotted' });
    addEdge(nonProdSpoke1Id, nonProdSpoke2Id, { label: 'Peered or Directly Connected Virtual Networks', style: 'dotted' });

    // Connect Non-production Spoke Subnets
    addEdge(nonProdSpoke1Id, nonProdSpoke1SubnetId, { label: 'Contains', style: 'dashed' });
    addEdge(nonProdSpoke2Id, nonProdSpoke2SubnetId, { label: 'Contains', style: 'dashed' });

    // Connect VMs to Non-production Subnets
    addEdge(nonProdSpoke1SubnetId, nonProdVm1Id, { label: 'Contains', style: 'dashed' });
    addEdge(nonProdSpoke1SubnetId, nonProdVm2Id, { label: 'Contains', style: 'dashed' });
    addEdge(nonProdSpoke1SubnetId, nonProdVm3Id, { label: 'Contains', style: 'dashed' });
    addEdge(nonProdSpoke2SubnetId, nonProdVm4Id, { label: 'Contains', style: 'dashed' });
    addEdge(nonProdSpoke2SubnetId, nonProdVm5Id, { label: 'Contains', style: 'dashed' });
    addEdge(nonProdSpoke2SubnetId, nonProdVm6Id, { label: 'Contains', style: 'dashed' });

    // Connect Azure Monitor
    addEdge(bastionId, monitorId, { label: 'Diagnostics', style: 'dotted' });
    addEdge(firewallId, monitorId, { label: 'Diagnostics', style: 'dotted' });
    addEdge(vpnGatewayId, monitorId, { label: 'Diagnostics', style: 'dotted' });

    // Connect Forced Tunnel from Production Spokes to Firewall and Monitor
    addEdge(prodSpoke1Id, firewallId, { label: 'Forced Tunnel', style: 'dotted', color: 'green' });
    addEdge(prodSpoke2Id, firewallId, { label: 'Forced Tunnel', style: 'dotted', color: 'green' });
    addEdge(prodSpoke1Id, monitorId, { label: 'Forced Tunnel', style: 'dotted', color: 'green' });
    addEdge(prodSpoke2Id, monitorId, { label: 'Forced Tunnel', style: 'dotted', color: 'green' });

  } else if (layout === 'simple') {
    // Simplified layout for comparison
    const subscriptionId = addNode(
      { 
        type: 'subscription', 
        label: 'Azure Subscription', 
        layer: 'Management', 
        description: 'Single subscription for all resources',
        meta: { subscriptionType: 'General Purpose' }
      },
      { x: 400, y: 100 },
      'groupNode'
    );

    const vnetId = addNode(
      { 
        type: 'vnet', 
        label: 'Virtual Network', 
        layer: 'Networking', 
        meta: { addressSpace: '10.0.0.0/16' },
        description: 'Main virtual network'
      },
      { x: 400, y: 250 },
      'groupNode'
    );

    // Add VMs directly to VNet
    let vmX = 200;
    assessment.vmSummary?.forEach((vm, index) => {
      const vmId = addNode(
        { 
          type: 'vm', 
          label: vm.vmName || `VM ${index + 1}`, 
          layer: 'Compute', 
                      meta: { 
              sku: vm.recommendedSize, 
              osType: vm.operatingSystem,
              cores: vm.cores,
              memoryGB: vm.memoryGB
            } 
        },
        { x: vmX, y: 350 }
      );
      addEdge(vnetId, vmId, { label: 'Hosts' });
      vmX += 150;
    });

    addEdge(subscriptionId, vnetId, { label: 'Contains', style: 'dashed' });

  }

  return { nodes, edges };
}
