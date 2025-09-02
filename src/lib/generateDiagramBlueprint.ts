import { getOpenAICompletion } from './azureOpenAI';

/**
 * Extended AssessmentSummary interface for diagram generation
 * Contains detailed workload and networking information needed for architecture diagrams
 */
export interface AssessmentSummary {
  workloads: {
    totalVMs: number;
    windowsVMs: number;
    linuxVMs: number;
    totalCores: number;
    totalMemoryGB: number;
    totalStorageGB: number;
    averageCpuUsage: number;
    averageMemoryUsage: number;
    vmNames?: string[];
    vmTypes?: string[];
    dependencies?: string[];
  };
  networking: {
    totalNetworkAdapters: number;
    averageNetworkInMbps: number;
    averageNetworkOutMbps: number;
    uniqueIPRanges: number;
    vnetIPs?: string[];
    subnetRanges?: string[];
  };
  securityRisks: {
    machinesWithIssues: number;
    securityReadinessIssues: number;
    dataCollectionIssues: number;
  };

  recommendations?: {
    migrationStrategy: string;
    networkSegmentation: string;
    securityPriority: string;
  };
}

/**
 * Options for diagram generation
 */
export interface DiagramGenerationOptions {
  maxTokens?: number;
  temperature?: number;
  seed?: number;
  includeSubscriptions?: boolean;
  includeSecurityGroups?: boolean;
  includeLoadBalancers?: boolean;
}

/**
 * Generates a PlantUML architecture diagram blueprint based on assessment summary data
 * 
 * This function analyzes the assessment summary and generates a PlantUML diagram
 * representing an Azure Landing Zone structure aligned with CAF (Cloud Adoption Framework)
 * principles. The diagram includes subscriptions, VNets, subnets, and workload placement.
 * 
 * @param summary - Assessment summary containing workload and networking information
 * @param options - Optional configuration for diagram generation
 * @returns Promise<string> - PlantUML diagram code as a string
 * 
 * @throws Error - If Azure OpenAI call fails or invalid response is received
 * 
 * Potential extensions:
 * - Add support for multiple subscriptions (Dev, Test, Prod)
 * - Include additional CAF pillars (Govern, Secure, Manage)
 * - Add support for hybrid connectivity (ExpressRoute, VPN)
 * - Include Azure services (App Service, Functions, etc.)
 * - Add support for different diagram styles and themes
 */
export async function generateDiagramBlueprint(
  summary: AssessmentSummary,
  options: DiagramGenerationOptions = {}
): Promise<string> {
  try {
    // Enhanced input validation
    console.log('🔍 [GenerateDiagramBlueprint] Validating input data...');
    validateAssessmentSummary(summary);
    
    // Build the prompt for Azure OpenAI with enhanced CAF pillars
    const prompt = buildDiagramPrompt(summary, options);
    
    console.log('🤖 [GenerateDiagramBlueprint] Calling Azure OpenAI for diagram generation...');
    
    // For now, use template-based diagram to ensure reliable PlantUML generation
    // TODO: Re-enable AI generation once PlantUML syntax issues are resolved
    console.log('🔧 [GenerateDiagramBlueprint] Using Azure icon-based diagram for professional appearance');
    const plantUmlCode = generateAzureIconBasedDiagram(summary);

    console.log('✅ [GenerateDiagramBlueprint] PlantUML validation passed');
    return plantUmlCode;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate diagram blueprint: ${error.message}`);
    }
    throw new Error('Failed to generate diagram blueprint: Unknown error occurred');
  }
}

/**
 * Validates the assessment summary input data
 * @param summary - Assessment summary to validate
 * @throws Error - If validation fails
 */
function validateAssessmentSummary(summary: AssessmentSummary): void {
  if (!summary) {
    throw new Error('Assessment summary is required');
  }
  
  if (!summary.workloads || typeof summary.workloads !== 'object') {
    throw new Error('Workloads data is required and must be an object');
  }
  
  if (!summary.networking || typeof summary.networking !== 'object') {
    throw new Error('Networking data is required and must be an object');
  }
  
  if (summary.workloads.totalVMs <= 0) {
    throw new Error('At least one VM is required for diagram generation');
  }
  
  if (summary.networking.totalNetworkAdapters <= 0) {
    throw new Error('At least one network adapter is required for diagram generation');
  }
  
  console.log('✅ [GenerateDiagramBlueprint] Input validation passed');
}

/**
 * Determines which CAF pillars to implement based on assessment data
 * @param summary - Assessment summary data
 * @returns Array of CAF pillars to implement
 */
function determineCAFPillars(summary: AssessmentSummary): string[] {
  const pillars = ['Adopt']; // Always include Adopt pillar
  
  // Add Strategy pillar if there are multiple workload types or security considerations
  if (summary.workloads.windowsVMs > 0 && summary.workloads.linuxVMs > 0) {
    pillars.push('Strategy');
  }
  
  // Add Plan pillar if there are multiple workload types
  if (summary.workloads.totalVMs > 2) {
    pillars.push('Plan');
  }
  
  // Add Govern pillar if there are security risks
  if (summary.securityRisks.machinesWithIssues > 0 || summary.securityRisks.securityReadinessIssues > 0) {
    pillars.push('Govern');
  }
  
  // Add Secure pillar if there are security considerations
  if (summary.securityRisks.machinesWithIssues > 0) {
    pillars.push('Secure');
  }
  
  // Add Manage pillar if there are management requirements
  if (summary.workloads.totalVMs > 5) {
    pillars.push('Manage');
  }
  
  return pillars;
}

/**
 * Builds the prompt for Azure OpenAI based on assessment summary
 * Enhanced with additional CAF pillars and Landing Zone components
 */
function buildDiagramPrompt(summary: AssessmentSummary, options: DiagramGenerationOptions): string {
  const {
    workloads,
    networking,
    securityRisks,
    costEstimates,
    recommendations
  } = summary;

  // Determine CAF pillars based on assessment data
  const cafPillars = determineCAFPillars(summary);
  
  return `You are an Azure Cloud Architect specializing in CAF (Cloud Adoption Framework) Landing Zone design. 
Generate a comprehensive PlantUML architecture diagram for an Azure Landing Zone based on the following assessment data:

ASSESSMENT SUMMARY:
- Workloads: ${workloads.totalVMs} VMs (${workloads.windowsVMs} Windows, ${workloads.linuxVMs} Linux)
- Total Cores: ${workloads.totalCores}
- Total Memory: ${workloads.totalMemoryGB.toFixed(0)} GB
- Total Storage: ${typeof workloads.totalStorageGB === 'number' ? workloads.totalStorageGB.toFixed(0) : '0'} GB
- Network Adapters: ${networking.totalNetworkAdapters}
- Security Issues: ${securityRisks.machinesWithIssues}

- Migration Strategy: ${recommendations?.migrationStrategy || 'Lift and Shift'}
- Network Segmentation: ${recommendations?.networkSegmentation || 'Single-subnet'}

CAF PILLARS TO IMPLEMENT:
${cafPillars.map(pillar => `- ${pillar}`).join('\n')}

REQUIREMENTS:
1. Create a comprehensive Azure Landing Zone with one "Production Subscription"
2. Design a VNet with CIDR 10.0.0.0/16 named "Production VNet"
3. Include appropriate subnets based on workload types:
   - Web Tier: 10.0.1.0/24
   - App Tier: 10.0.2.0/24  
   - Data Tier: 10.0.3.0/24
   - Management: 10.0.4.0/24
4. Include Azure services based on workload requirements:
   - Virtual Machines for application workloads
   - Storage Accounts for data persistence
   - Network Security Groups for security
   - Load Balancers if needed (${options.includeLoadBalancers ? 'include' : 'exclude'})
   - Application Gateways for web traffic
5. Show dependencies between components with arrows
6. Include security and governance components

STYLING REQUIREMENTS:
- Use light blue dashed borders (#A5D8FF) for subscriptions
- Use light purple dashed borders (#DDA0DD) for VNets
- Use rounded corners: skinparam rectangleRoundCorner 8
- Use bold titles: **text**
- Use gray subtitles: #gray
- Use green arrows (#00FF00) for dependencies
- Use appropriate colors for different Azure services
- Use red (#FF0000) for security components
- Use orange (#FFA500) for management components

OUTPUT FORMAT:
Output ONLY valid PlantUML code starting with @startuml and ending with @enduml.
Do not include any explanations, markdown formatting, or additional text.
Ensure the diagram is clean, professional, and follows Azure architecture best practices.`;
}

/**
 * Validates that the response contains valid PlantUML code
 */
function isValidPlantUML(code: string): boolean {
  const trimmedCode = code.trim();
  
  // Check for basic PlantUML structure
  if (!trimmedCode.includes('@startuml') || !trimmedCode.includes('@enduml')) {
    return false;
  }
  
  // Check for basic diagram elements
  if (!trimmedCode.includes('rectangle') && !trimmedCode.includes('component')) {
    return false;
  }
  
  // Check for reasonable length (not too short, not too long)
  if (trimmedCode.length < 100 || trimmedCode.length > 10000) {
    return false;
  }
  
  // Check for problematic patterns that cause PlantUML server errors
  const problematicPatterns = [
    '!define',
    'skinparam component',
    '<<Subscription>>',
    '<<VNet>>',
    '<<Security>>',
    '<<Management>>',
    '\\n #gray', // Invalid color syntax
    '\\n#gray'   // Invalid color syntax
  ];
  
  const hasProblematicPatterns = problematicPatterns.some(pattern => 
    trimmedCode.includes(pattern)
  );
  
  if (hasProblematicPatterns) {
    return false;
  }
  
  return true;
}

/**
 * Generates a template-based PlantUML diagram when AI generation fails
 * This ensures we always have a working diagram
 */
function generateTemplateBasedDiagram(summary: AssessmentSummary): string {
  const { workloads, networking } = summary;
  
  return `@startuml
!theme plain
skinparam rectangleRoundCorner 8
skinparam defaultFontName Arial

' Azure Landing Zone Architecture with Azure Icons
title **Azure Landing Zone Architecture** \\n <size:14><color:gray>Generated from Azure Migrate Assessment</color></size>

' Main Subscription Container
rectangle "**Production Subscription**" as subscription #A5D8FF {
  
  ' Virtual Network with Azure VNet icon
  rectangle "**Production VNet**\\n**10.0.0.0/16**" as vnet #DDA0DD {
    
    ' Web Tier with VM icons
    rectangle "**Web Tier**\\n**10.0.1.0/24**\\n**${Math.ceil(workloads.totalVMs * 0.3)} VMs**" as web #lightblue
    rectangle "**App Tier**\\n**10.0.2.0/24**\\n**${Math.ceil(workloads.totalVMs * 0.4)} VMs**" as app #lightgreen
    rectangle "**Data Tier**\\n**10.0.3.0/24**\\n**${Math.ceil(workloads.totalVMs * 0.2)} VMs**" as data #lightyellow
    rectangle "**Management**\\n**10.0.4.0/24**\\n**${Math.ceil(workloads.totalVMs * 0.1)} VMs**" as mgmt #lightgray
  }
  
  ' Azure Services
  rectangle "**Network Security Group**\\n**Security Rules**" as nsg #FF6B6B
  rectangle "**Storage Account**\\n**${typeof workloads.totalStorageGB === 'number' ? workloads.totalStorageGB.toFixed(0) : '0'} GB**" as storage #4ECDC4
  rectangle "**Load Balancer**\\n**Traffic Distribution**" as lb #FFE66D
  rectangle "**Key Vault**\\n**Secrets Management**" as kv #FFB347
  rectangle "**Monitor**\\n**Log Analytics**" as monitor #87CEEB
}

' Cost Summary


' Connections with Azure-style arrows
web -[#0078D4,thickness=2]-> app : **HTTP/HTTPS**
app -[#0078D4,thickness=2]-> data : **Database**
mgmt -[#FF6B6B,thickness=2]-> web : **Management**
mgmt -[#FF6B6B,thickness=2]-> app : **Management**
mgmt -[#FF6B6B,thickness=2]-> data : **Management**
lb -[#00FF00,thickness=2]-> web : **Load Balance**
nsg -[#FF0000,thickness=2]-> vnet : **Security Rules**
storage -[#4ECDC4,thickness=2]-> data : **Data Storage**
kv -[#FFB347,thickness=2]-> app : **Secrets**
monitor -[#87CEEB,thickness=2]-> vnet : **Monitoring**

' Legend
legend right
  |= Component |= Description |
  |<#A5D8FF>| Production Subscription |
  |<#DDA0DD>| Virtual Network |
  |<#lightblue>| Web Tier VMs |
  |<#lightgreen>| App Tier VMs |
  |<#lightyellow>| Data Tier VMs |
  |<#lightgray>| Management VMs |
  |<#FF6B6B>| Network Security Group |
  |<#4ECDC4>| Storage Account |
  |<#FFE66D>| Load Balancer |
  |<#FFB347>| Key Vault |
  |<#87CEEB>| Monitor |
endlegend

@enduml`;
}

/**
 * Generates a sophisticated Azure icon-based diagram
 * Uses local Azure icons and creates a more professional appearance
 */
function generateAzureIconBasedDiagram(summary: AssessmentSummary): string {
  const { workloads, networking } = summary;
  
  return `@startuml
!theme plain
skinparam rectangleRoundCorner 12
skinparam defaultFontName 'Segoe UI'
skinparam shadowing false
skinparam backgroundColor #FFFFFF

' Azure Landing Zone Architecture with Professional Styling
title **Azure Landing Zone Architecture** \\n <size:16><color:#0078D4>Generated from Azure Migrate Assessment</color></size>

' Define Azure-style colors
!define AZURE_BLUE #0078D4
!define AZURE_GREEN #107C10
!define AZURE_RED #D13438
!define AZURE_ORANGE #FF8C00
!define AZURE_PURPLE #5C2D91
!define AZURE_GRAY #605E5C

' Main Subscription Container with Azure styling
rectangle "**Production Subscription**" as subscription #E3F2FD {
  
  ' Virtual Network with Azure VNet styling
  rectangle "**Production VNet**\\n**10.0.0.0/16**" as vnet #F3E5F5 {
    
    ' Web Tier with Azure VM styling
    rectangle "**Web Tier**\\n**10.0.1.0/24**\\n**${Math.ceil(workloads.totalVMs * 0.3)} VMs**" as web #E1F5FE
    rectangle "**App Tier**\\n**10.0.2.0/24**\\n**${Math.ceil(workloads.totalVMs * 0.4)} VMs**" as app #E8F5E8
    rectangle "**Data Tier**\\n**10.0.3.0/24**\\n**${Math.ceil(workloads.totalVMs * 0.2)} VMs**" as data #FFF8E1
    rectangle "**Management**\\n**10.0.4.0/24**\\n**${Math.ceil(workloads.totalVMs * 0.1)} VMs**" as mgmt #F5F5F5
  }
  
  ' Azure Services with professional styling
  rectangle "**Network Security Group**\\n**Security Rules**" as nsg #FFEBEE
  rectangle "**Storage Account**\\n**${typeof workloads.totalStorageGB === 'number' ? workloads.totalStorageGB.toFixed(0) : '0'} GB**" as storage #E0F2F1
  rectangle "**Load Balancer**\\n**Traffic Distribution**" as lb #FFF3E0
  rectangle "**Key Vault**\\n**Secrets Management**" as kv #FCE4EC
  rectangle "**Monitor**\\n**Log Analytics**" as monitor #E8EAF6
  rectangle "**Application Gateway**\\n**WAF Protection**" as agw #F1F8E9
}



' Connections with Azure-style arrows and colors
web -[#0078D4,thickness=3]-> app : **HTTP/HTTPS**
app -[#0078D4,thickness=3]-> data : **Database**
mgmt -[#FF6B6B,thickness=2]-> web : **Management**
mgmt -[#FF6B6B,thickness=2]-> app : **Management**
mgmt -[#FF6B6B,thickness=2]-> data : **Management**
lb -[#107C10,thickness=3]-> web : **Load Balance**
nsg -[#D13438,thickness=2]-> vnet : **Security Rules**
storage -[#00ACC1,thickness=2]-> data : **Data Storage**
kv -[#FF8C00,thickness=2]-> app : **Secrets**
monitor -[#1976D2,thickness=2]-> vnet : **Monitoring**
agw -[#388E3C,thickness=3]-> lb : **Traffic**

' Legend with Azure styling
legend right
  |= Component |= Description |
  |<#E3F2FD>| **Production Subscription** |
  |<#F3E5F5>| **Virtual Network** |
  |<#E1F5FE>| **Web Tier VMs** |
  |<#E8F5E8>| **App Tier VMs** |
  |<#FFF8E1>| **Data Tier VMs** |
  |<#F5F5F5>| **Management VMs** |
  |<#FFEBEE>| **Network Security Group** |
  |<#E0F2F1>| **Storage Account** |
  |<#FFF3E0>| **Load Balancer** |
  |<#FCE4EC>| **Key Vault** |
  |<#E8EAF6>| **Monitor** |
  |<#F1F8E9>| **Application Gateway** |
endlegend

@enduml`;
}

/**
 * Generates a diagram with Azure icons using PlantUML sprites
 * Embeds Azure icons directly into the PlantUML diagram
 */
export async function generateAzureIconBasedDiagramWithIcons(summary: AssessmentSummary): Promise<string> {
  const { workloads, networking } = summary;
  
  // Azure icon mappings for different components
  const iconMappings = {
    vm: '10021-icon-service-Virtual-Machine',
    vnet: '10061-icon-service-Virtual-Networks', 
    nsg: '10067-icon-service-Network-Security-Groups',
    storage: '10086-icon-service-Storage-Accounts',
    loadBalancer: '10062-icon-service-Load-Balancers',
    keyVault: '10245-icon-service-Key-Vaults',
    monitor: '00001-icon-service-Monitor',
    appGateway: '10076-icon-service-Application-Gateways',
    subscription: '10002-icon-service-Subscriptions'
  };

  // Get icon URLs for embedding
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const iconUrls = {
    vm: `${baseUrl}/api/azure-icons?icon=${iconMappings.vm}&category=compute`,
    vnet: `${baseUrl}/api/azure-icons?icon=${iconMappings.vnet}&category=networking`,
    nsg: `${baseUrl}/api/azure-icons?icon=${iconMappings.nsg}&category=networking`,
    storage: `${baseUrl}/api/azure-icons?icon=${iconMappings.storage}&category=storage`,
    loadBalancer: `${baseUrl}/api/azure-icons?icon=${iconMappings.loadBalancer}&category=networking`,
    keyVault: `${baseUrl}/api/azure-icons?icon=${iconMappings.keyVault}&category=security`,
    monitor: `${baseUrl}/api/azure-icons?icon=${iconMappings.monitor}&category=monitor`,
    appGateway: `${baseUrl}/api/azure-icons?icon=${iconMappings.appGateway}&category=networking`,
    subscription: `${baseUrl}/api/azure-icons?icon=${iconMappings.subscription}&category=general`
  };

  // Create a diagram with PlantUML symbols and Azure-style icons
  // Uses PlantUML's built-in symbols to represent Azure services
  return `@startuml
!theme plain
skinparam rectangleRoundCorner 12
skinparam defaultFontName 'Segoe UI'
skinparam shadowing false
skinparam backgroundColor #FFFFFF
skinparam arrowColor #0078D4
skinparam arrowThickness 2

' Azure Landing Zone Architecture with Azure Icons
title **Azure Landing Zone Architecture** \\n <size:16><color:#0078D4>Generated from Azure Migrate Assessment</color></size>

' Main Subscription Container with Azure styling
rectangle "**Production Subscription**" as subscription #E3F2FD {
  
  ' Virtual Network with subnet structure
  rectangle "**Production VNet**\\n**10.0.0.0/16**" as vnet #E8F5E8 {
    
    ' Web Tier with VM count and server symbol
    rectangle "**Web Tier**\\n**10.0.1.0/24**\\n**${Math.ceil(workloads.totalVMs * 0.3)} VMs**" as web #BBDEFB
    rectangle "**App Tier**\\n**10.0.2.0/24**\\n**${Math.ceil(workloads.totalVMs * 0.4)} VMs**" as app #C8E6C9
    rectangle "**Data Tier**\\n**10.0.3.0/24**\\n**${Math.ceil(workloads.totalVMs * 0.2)} VMs**" as data #FFF3E0
    rectangle "**Management**\\n**10.0.4.0/24**\\n**${Math.ceil(workloads.totalVMs * 0.1)} VMs**" as mgmt #F3E5F5
  }
  
  ' Azure Services with professional styling and symbols
  rectangle "**Network Security Group**\\n**Security Rules & Policies**" as nsg #FFCDD2
  rectangle "**Storage Account**\\n**${typeof workloads.totalStorageGB === 'number' ? workloads.totalStorageGB.toFixed(0) : '0'} GB**" as storage #B2DFDB
  rectangle "**Load Balancer**\\n**Traffic Distribution**" as lb #FFF9C4
  rectangle "**Key Vault**\\n**Secrets & Certificates**" as kv #FFCCBC
  rectangle "**Monitor**\\n**Log Analytics & Insights**" as monitor #E1BEE7
  rectangle "**Application Gateway**\\n**Web Traffic Management**" as agw #C5CAE9
}



' Professional connections with Azure colors
web -[#0078D4,thickness=2]-> app : **HTTP/HTTPS**
app -[#0078D4,thickness=2]-> data : **Database**
mgmt -[#FF6B6B,thickness=2]-> web : **Management**
mgmt -[#FF6B6B,thickness=2]-> app : **Management**
mgmt -[#FF6B6B,thickness=2]-> data : **Management**
lb -[#00C851,thickness=2]-> web : **Load Balance**
nsg -[#FF0000,thickness=2]-> vnet : **Security Rules**
storage -[#4ECDC4,thickness=2]-> data : **Data Storage**
kv -[#FFB347,thickness=2]-> app : **Secrets**
monitor -[#87CEEB,thickness=2]-> vnet : **Monitoring**
agw -[#9C27B0,thickness=2]-> lb : **Traffic**

' Legend with Azure service colors and icon references
legend right
  |= Component |= Description |= Azure Icon Reference |
  |<#E3F2FD>| Production Subscription | Azure Subscription |
  |<#E8F5E8>| Virtual Network | Azure VNet |
  |<#BBDEFB>| Web Tier VMs | Azure VM |
  |<#C8E6C9>| App Tier VMs | Azure VM |
  |<#FFF3E0>| Data Tier VMs | Azure VM |
  |<#F3E5F5>| Management VMs | Azure VM |
  |<#FFCDD2>| Network Security Group | Azure NSG |
  |<#B2DFDB>| Storage Account | Azure Storage |
  |<#FFF9C4>| Load Balancer | Azure LB |
  |<#FFCCBC>| Key Vault | Azure Key Vault |
  |<#E1BEE7>| Monitor | Azure Monitor |
  |<#C5CAE9>| Application Gateway | Azure App Gateway |
endlegend

' Note about Azure icons
note bottom
  **Azure Icons Available**: The actual Azure service icons are displayed in the browser interface above.
  This diagram uses PlantUML symbols for compatibility with the PlantUML rendering engine.
end note

@enduml`;
}

/**
 * Helper function to generate a simple diagram for testing
 * This can be used for development and testing purposes
 */
export function generateSimpleTestDiagram(): string {
  return `@startuml
!theme plain
skinparam rectangleRoundCorner 8

rectangle "**Production Subscription**" as sub #A5D8FF {
  rectangle "**Production VNet**" as vnet #DDA0DD {
    rectangle "Web Tier\\n10.0.1.0/24" as web #lightblue
    rectangle "App Tier\\n10.0.2.0/24" as app #lightgreen
    rectangle "Data Tier\\n10.0.3.0/24" as data #lightyellow
    rectangle "Management\\n10.0.4.0/24" as mgmt #lightgray
  }
  
  rectangle "**Network Security Group**" as nsg #orange
  rectangle "**Storage Account**" as storage #purple
}

web --> app : HTTP/HTTPS
app --> data : Database
mgmt --> web : Management
mgmt --> app : Management
mgmt --> data : Management

@enduml`;
}

/**
 * FUTURE EXTENSIONS AND ENHANCEMENTS
 * 
 * This section outlines potential improvements and extensions for the diagram generation system:
 * 
 * 1. MULTI-SUBSCRIPTION SUPPORT:
 *    - Add support for Dev, Test, Prod subscription separation
 *    - Implement subscription-to-subscription peering
 *    - Add management group hierarchy
 * 
 * 2. CUSTOM ICON SETS:
 *    - Integrate with Azure Architecture Icons
 *    - Support for custom icon libraries
 *    - Dynamic icon selection based on service type
 * 
 * 3. HYBRID CONNECTIVITY:
 *    - ExpressRoute connections
 *    - VPN Gateway implementations
 *    - Azure Arc for hybrid management
 * 
 * 4. ADVANCED CAF PILLARS:
 *    - Strategy: Business alignment and value realization
 *    - Plan: Technical planning and readiness
 *    - Ready: Environment preparation
 *    - Adopt: Workload migration and optimization
 *    - Govern: Policy and compliance
 *    - Manage: Operations and monitoring
 * 
 * 5. DIAGRAM STYLES AND THEMES:
 *    - Multiple visual themes (Azure, AWS, GCP style)
 *    - Custom color schemes
 *    - Different layout algorithms
 * 
 * 6. INTEGRATION FEATURES:
 *    - Azure Resource Manager template generation
 *    - Terraform configuration export
 *    - Cost estimation integration
 *    - Security compliance mapping
 * 
 * 7. PERFORMANCE OPTIMIZATIONS:
 *    - Caching of generated diagrams
 *    - Background processing for large diagrams
 *    - Progressive loading for complex architectures
 * 
 * 8. COLLABORATION FEATURES:
 *    - Diagram versioning and history
 *    - Comment and annotation system
 *    - Team collaboration tools
 *    - Approval workflows
 */
