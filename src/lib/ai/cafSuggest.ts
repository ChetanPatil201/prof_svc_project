import { getOpenAICompletion } from '../azureOpenAI';
import { CafArchitectureSchema, CafArchitecture, DEFAULT_CAF_ARCHITECTURE } from './cafSchema';
import type { AssessmentReportData } from '@/types/assessmentReport';

// System prompt for Azure OpenAI
const SYSTEM_PROMPT = `You are an expert Azure Cloud Architect specializing in Cloud Adoption Framework (CAF) and Azure Landing Zone patterns. 

Your task is to analyze assessment data and generate a JSON response with a recommended Azure architecture that follows CAF principles.

CRITICAL: You must respond with ONLY valid JSON. Do not include any explanations, markdown formatting, or additional text.

Key requirements:
1. Use hub-spoke, simple, or full CAF patterns based on the assessment complexity
2. Design appropriate subscription structure (platform vs landing zones)
3. Plan VNets with proper CIDR ranges that don't overlap
4. Include appropriate subnets for web/app/db tiers
5. Recommend services based on the assessment data
6. Consider security, scalability, and cost optimization

You must return ONLY valid JSON that matches this exact schema:
{
  "architecture": {
    "pattern": "hub-spoke|simple|caf",
    "subscriptions": [
      {
        "id": "string",
        "name": "string", 
        "type": "platform-identity|platform-management|platform-connectivity|landingzone-prod|landingzone-nonprod|platform-data",
        "vnets": [
          {
            "id": "string",
            "name": "string",
            "addressSpace": "CIDR",
            "subnets": [
              {
                "id": "string",
                "name": "string",
                "addressPrefix": "CIDR",
                "tier": "web|app|db|management|bastion",
                "vmCount": 0,
                "vmSku": "string",
                "services": [
                  {
                    "id": "string",
                    "name": "string",
                    "type": "vm|vmss|sql|storage|keyvault|monitor|firewall|bastion|appgw|lb|nsg",
                    "count": 0,
                    "sku": "string",
                    "config": {}
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "meta": {
    "assumptions": ["string"],
    "recommendations": ["string"],
    "risks": ["string"],
    "estimatedCost": 0,
    "complexity": "low|medium|high"
  }
}

Remember: Return ONLY the JSON object, nothing else.`;

// User prompt template
const USER_PROMPT_TEMPLATE = `Analyze this Azure migration assessment and generate a CAF-compliant architecture:

Client: {clientName}
Total Servers: {totalServers} ({windowsServers} Windows, {linuxServers} Linux)
Total Storage: {totalStorageTB} TB
Target Region: {targetRegion}
Estimated Monthly Cost: {estimatedMonthlyCost}

VM Summary:
{vmSummary}

Key Recommendations:
{recommendations}

Risks:
{risks}

Generate a JSON response with the recommended Azure architecture following CAF principles.`;

/**
 * Normalize assessment data for AI processing
 */
function normalizeAssessmentData(assessment: AssessmentReportData): string {
  const vmSummary = assessment.vmSummary?.map(vm => 
    `- ${vm.vmName}: ${vm.recommendedSku} (${vm.cores} cores, ${vm.memoryGB}GB RAM, ${vm.storageGB}GB storage, $${vm.estimatedCost}/month)`
  ).join('\n') || 'No VM details available';

  const recommendations = assessment.recommendations?.join('\n- ') || 'No specific recommendations';
  const risks = assessment.risks?.join('\n- ') || 'No specific risks identified';

  return USER_PROMPT_TEMPLATE
    .replace('{clientName}', assessment.clientName || 'Unknown Client')
    .replace('{totalServers}', assessment.totalServers?.toString() || '0')
    .replace('{windowsServers}', assessment.windowsServers?.toString() || '0')
    .replace('{linuxServers}', assessment.linuxServers?.toString() || '0')
    .replace('{totalStorageTB}', assessment.totalStorageTB?.toString() || '0')
    .replace('{targetRegion}', assessment.targetRegion || 'East US')
    .replace('{estimatedMonthlyCost}', assessment.estimatedMonthlyCost?.toString() || '0')
    .replace('{vmSummary}', vmSummary)
    .replace('{recommendations}', recommendations)
    .replace('{risks}', risks);
}

/**
 * Parse AI response with retry logic
 */
async function parseAIResponse(response: string, retryCount = 0): Promise<any> {
  try {
    console.log('Attempting to parse AI response...');
    
    // Try to extract JSON from the response (in case AI includes markdown or other text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : response;
    
    console.log('Extracted JSON string:', jsonString.substring(0, 200) + '...');
    
    const parsed = JSON.parse(jsonString);
    console.log('JSON parsed successfully');
    
    return parsed;
  } catch (error) {
    console.warn(`Failed to parse AI response (attempt ${retryCount + 1}):`, error);
    
    if (retryCount === 0) {
      // First retry with JSON validation hint
      const retryPrompt = `Your previous response was not valid JSON. You must respond with ONLY a valid JSON object that matches the exact schema provided. 

Do not include:
- Any explanations or text before or after the JSON
- Markdown formatting
- Code blocks
- Any text that is not part of the JSON object

Return ONLY the JSON object starting with { and ending with }.`;
      
      try {
        const retryResponse = await getOpenAICompletion(retryPrompt, {
          maxTokens: 2048,
          temperature: 0.1, // Lower temperature for more consistent JSON
          seed: 42 // Deterministic response
        });
        
        return await parseAIResponse(retryResponse, 1);
      } catch (retryError) {
        console.error('Retry failed:', retryError);
      }
    }
    
    // Fall back to default architecture
    console.warn('Using default CAF architecture due to parsing failures');
    return DEFAULT_CAF_ARCHITECTURE;
  }
}

/**
 * Convert AI response format to our CAF schema format
 */
function convertAIResponseToCafFormat(aiResponse: any): CafArchitecture {
  console.log('Converting AI response to CAF format...');
  
  try {
    // Handle the AI's response format
    if (aiResponse.AzureArchitecture) {
      const azureArch = aiResponse.AzureArchitecture;
      
      // Extract pattern from networking architecture
      const pattern = azureArch.Networking?.Architecture?.toLowerCase() || 'hub-spoke';
      
      // Convert resource groups to subscriptions and VNets
      const subscriptions = [];
      
      // Process ResourceGroups if they exist
      if (azureArch.ResourceGroups && Array.isArray(azureArch.ResourceGroups)) {
        for (const rg of azureArch.ResourceGroups) {
          const isHub = rg.Name?.toLowerCase().includes('hub');
          const subscription = {
            id: `sub-${rg.Name}`,
            name: `${rg.Name} Subscription`,
            type: isHub ? 'platform-connectivity' as const : 'landingzone-prod' as const,
            vnets: []
          };
          
          // Process VNets in this resource group
          const vnetResources = rg.Resources?.filter((r: any) => r.Type === 'VirtualNetwork') || [];
          for (const vnetResource of vnetResources) {
            const vnet = {
              id: vnetResource.Name || 'vnet-default',
              name: vnetResource.Name || 'Default VNet',
              addressSpace: vnetResource.AddressSpace || '10.0.0.0/16',
              subnets: []
            };
            
            // Process subnets
            if (vnetResource.Subnets) {
              vnet.subnets = vnetResource.Subnets.map((subnet: any, index: number) => ({
                id: subnet.Name || `subnet-${index}`,
                name: subnet.Name || `Subnet ${index}`,
                addressPrefix: subnet.AddressRange || `10.0.${index + 1}.0/24`,
                tier: 'web' as const,
                services: []
              }));
            }
            
            // Process other resources as services
            const otherResources = rg.Resources?.filter((r: any) => r.Type !== 'VirtualNetwork') || [];
            for (const resource of otherResources) {
              if (resource.Type === 'VirtualMachines' && resource.Instances) {
                // Handle VM instances
                for (const vm of resource.Instances) {
                  const subnet = vnet.subnets[0]; // Add to first subnet
                  if (subnet) {
                    subnet.services = subnet.services || [];
                    subnet.services.push({
                      id: vm.Name || `vm-${index}`,
                      name: vm.Name || 'VM',
                      type: 'vm' as any,
                      count: 1,
                      sku: vm.Sku,
                      config: vm
                    });
                  }
                }
              } else {
                // Handle other resource types
                const subnet = vnet.subnets[0]; // Add to first subnet
                if (subnet) {
                  subnet.services = subnet.services || [];
                  subnet.services.push({
                    id: resource.Name || `service-${resource.Type}`,
                    name: resource.Name || resource.Type,
                    type: resource.Type.toLowerCase() as any,
                    count: 1,
                    sku: resource.Sku,
                    config: resource
                  });
                }
              }
            }
            
            subscription.vnets.push(vnet);
          }
          
          subscriptions.push(subscription);
        }
      } else {
        // Fallback: Create a simple hub-spoke structure
        const hubSubscription = {
          id: 'sub-hub',
          name: 'Hub Subscription',
          type: 'platform-connectivity' as const,
          vnets: [{
            id: 'vnet-hub',
            name: 'Hub VNet',
            addressSpace: '10.0.0.0/16',
            subnets: [{
              id: 'subnet-hub',
              name: 'Hub Subnet',
              addressPrefix: '10.0.1.0/24',
              tier: 'management' as const,
              services: []
            }]
          }]
        };
        
        const spokeSubscription = {
          id: 'sub-spoke',
          name: 'Spoke Subscription',
          type: 'landingzone-prod' as const,
          vnets: [{
            id: 'vnet-spoke',
            name: 'Spoke VNet',
            addressSpace: '10.1.0.0/16',
            subnets: [{
              id: 'subnet-web',
              name: 'Web Subnet',
              addressPrefix: '10.1.1.0/24',
              tier: 'web' as const,
              services: [{
                id: 'vm-web-01',
                name: 'WEB-SRV-01',
                type: 'vm' as any,
                count: 1,
                sku: 'Standard_D2s_v3',
                config: {}
              }]
            }]
          }]
        };
        
        subscriptions.push(hubSubscription, spokeSubscription);
      }
      
      // Create meta information
      const meta = {
        assumptions: [
          'Using hub-spoke architecture based on AI recommendation',
          'Centralized security with Azure Firewall',
          'Separate resource groups for different tiers'
        ],
        recommendations: [
          'Implement proper NSGs for each subnet',
          'Use Azure Monitor for comprehensive monitoring',
          'Consider Azure Bastion for secure access'
        ],
        risks: (() => {
          if (Array.isArray(azureArch.Risks)) {
            return azureArch.Risks.map((risk: any) => risk.Description || risk.Risk);
          } else if (azureArch.Risks && typeof azureArch.Risks === 'object') {
            // Handle object format like { "NetworkSecurityConfigurationComplexity": "Mitigated by..." }
            return Object.entries(azureArch.Risks).map(([key, value]) => 
              `${key.replace(/([A-Z])/g, ' $1').trim()}: ${value}`
            );
          }
          return [
            'Network complexity requires careful planning',
            'Cost management needed for multiple VNets'
          ];
        })(),
        estimatedCost: azureArch.EstimatedMonthlyCost || 5000,
        complexity: 'medium' as const
      };
      
      return {
        architecture: {
          pattern: pattern as 'hub-spoke' | 'simple' | 'caf',
          subscriptions
        },
        meta
      };
    }
    
    // If we can't convert, return default
    console.log('Could not convert AI response, using default');
    return DEFAULT_CAF_ARCHITECTURE;
    
  } catch (error) {
    console.error('Error converting AI response:', error);
    return DEFAULT_CAF_ARCHITECTURE;
  }
}

/**
 * Generate CAF architecture suggestions using Azure OpenAI
 */
export async function cafSuggest(assessment: AssessmentReportData): Promise<CafArchitecture> {
  try {
    // Normalize assessment data
    const userPrompt = normalizeAssessmentData(assessment);
    
    // Call Azure OpenAI
    const response = await getOpenAICompletion(userPrompt, {
      maxTokens: 2048,
      temperature: 0.3, // Balanced creativity and consistency
      seed: 42 // Deterministic response for testing
    });
    
    console.log('Raw AI response:', response);
    console.log('Response length:', response.length);
    console.log('Response starts with:', response.substring(0, 100));
    
    // Parse the response and convert to our format
    const parsed = await parseAIResponse(response);
    const architecture = convertAIResponseToCafFormat(parsed);
    
    return architecture;
  } catch (error) {
    console.error('Error generating CAF suggestions:', error);
    
    // Return default architecture on any error
    return {
      ...DEFAULT_CAF_ARCHITECTURE,
      meta: {
        ...DEFAULT_CAF_ARCHITECTURE.meta,
        assumptions: [
          ...DEFAULT_CAF_ARCHITECTURE.meta.assumptions,
          `Error occurred during AI processing: ${error instanceof Error ? error.message : 'Unknown error'}`
        ]
      }
    };
  }
}

/**
 * Validate CIDR ranges for network planning
 */
export function validateCIDRRanges(architecture: CafArchitecture): string[] {
  const issues: string[] = [];
  const usedRanges = new Set<string>();
  
  for (const subscription of architecture.architecture.subscriptions) {
    for (const vnet of subscription.vnets) {
      // Check VNet address space
      if (usedRanges.has(vnet.addressSpace)) {
        issues.push(`Duplicate VNet address space: ${vnet.addressSpace}`);
      }
      usedRanges.add(vnet.addressSpace);
      
      // Check subnet containment
      for (const subnet of vnet.subnets) {
        if (!isSubnetInVNet(subnet.addressPrefix, vnet.addressSpace)) {
          issues.push(`Subnet ${subnet.addressPrefix} is not contained in VNet ${vnet.addressSpace}`);
        }
      }
    }
  }
  
  return issues;
}

/**
 * Check if a subnet CIDR is contained within a VNet CIDR
 */
function isSubnetInVNet(subnetCIDR: string, vnetCIDR: string): boolean {
  const [subnetIP, subnetMask] = subnetCIDR.split('/');
  const [vnetIP, vnetMask] = vnetCIDR.split('/');
  
  const subnetMaskNum = parseInt(subnetMask);
  const vnetMaskNum = parseInt(vnetMask);
  
  // Subnet mask must be larger (more specific) than VNet mask
  if (subnetMaskNum <= vnetMaskNum) {
    return false;
  }
  
  // Check if subnet IP is within VNet range
  const subnetIPNum = ipToNumber(subnetIP);
  const vnetIPNum = ipToNumber(vnetIP);
  const vnetRange = Math.pow(2, 32 - vnetMaskNum);
  
  return subnetIPNum >= vnetIPNum && subnetIPNum < vnetIPNum + vnetRange;
}

/**
 * Convert IP address to number for comparison
 */
function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}
