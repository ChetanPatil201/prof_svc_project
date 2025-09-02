import { getOpenAICompletion } from '../azureOpenAI';
import type { AssessmentReportData } from '@/types/assessmentReport';

/**
 * Generate Azure CAF Landing Zone diagram using DALL-E image generation
 */
export async function generateCAFLandingZoneImage(assessment: AssessmentReportData): Promise<string> {
  try {
    const prompt = `Create a professional Azure Cloud Adoption Framework architecture diagram with Microsoft documentation style.

Visual style: Clean white background, Azure brand colors (blue #0078D4, teal #00B294, green #107C10, purple #68217A), rounded rectangular containers with subtle borders and shadows.

Structure:
1. Top: Azure AD box (dark blue) with key icon
2. Root Management Group container (light blue) with three arrows down
3. Three horizontal management groups:
   - Platform Management Group (left, light blue border)
   - Landing Zones Management Group (center, light green border) 
   - Workload Management Group (right, light purple border)

Platform group contains: Identity, Networking, Management, DevOps, Business Continuity, Shared Services, Security & Monitoring boxes.

Landing Zones group contains: Corp Landing Zone Subscription and Online Landing Zone Subscription, each with Resource Groups containing Azure service icons.

Workload group contains: Workload Subscription with Resource Group and Azure service icons.

Connections: Dashed lines between components, "Hybrid Connectivity" line to "On-Premises" box.

Include clear text labels, professional typography, and enterprise-grade quality.

Client: ${assessment.clientName}, ${assessment.totalServers} servers, ${assessment.totalStorageTB}TB storage, ${assessment.targetRegion || 'East US'} region.`;

    // Check for Azure OpenAI configuration (Image Generation specific)
    const azureOpenAIEndpoint = process.env.AZURE_OPENAI_IMG_ENDPOINT || "https://cp-azureopenai-img.openai.azure.com/";
    const azureOpenAIKey = process.env.AZURE_OPENAI_IMG_KEY;
    const azureOpenAIDeployment = process.env.AZURE_OPENAI_IMG_DEPLOYMENT || "dall-e-3";
    const apiVersion = process.env.AZURE_OPENAI_IMG_API_VERSION || "2024-04-01-preview";

    if (!azureOpenAIKey) {
      throw new Error('Azure OpenAI image generation key not configured');
    }

    // Call Azure OpenAI DALL-E API directly
    const response = await fetch(`${azureOpenAIEndpoint}/openai/deployments/${azureOpenAIDeployment}/images/generations?api-version=${apiVersion}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': azureOpenAIKey,
      },
      body: JSON.stringify({
        prompt: prompt,
        size: '1024x1024',
        quality: 'hd',
        style: 'natural',
        n: 1
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Azure OpenAI API error:', errorData);
      throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Image generated successfully');
    return result.data[0].url;
  } catch (error) {
    console.error('Error generating CAF Landing Zone image:', error);
    throw new Error('Failed to generate CAF Landing Zone image');
  }
}

/**
 * Escape XML special characters to ensure valid SVG output
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Base SVG template for CAF Landing Zone diagrams with Azure icons
 */
const CAF_LANDING_ZONE_SVG_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1792" height="1024" viewBox="0 0 1792 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- White background -->
  <rect width="1792" height="1024" fill="white"/>
  
  <!-- Main title with Azure icon -->
  <text x="896" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#0078D4">Azure Cloud Adoption Framework - Landing Zone</text>
  
  <!-- Azure Cloud Icon -->
  <g transform="translate(820, 10)">
    <path d="M0,0 L20,0 L30,10 L50,10 L60,0 L80,0 L80,20 L0,20 Z" fill="#0078D4" stroke="#0078D4"/>
    <circle cx="40" cy="10" r="3" fill="white"/>
    <circle cx="25" cy="15" r="2" fill="white"/>
    <circle cx="55" cy="15" r="2" fill="white"/>
  </g>
  
  <!-- Root Management Group -->
  <rect x="50" y="60" width="1692" height="900" fill="none" stroke="#0078D4" stroke-width="3" rx="8" ry="8"/>
  <text x="896" y="85" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#0078D4">Root Management Group</text>
  
  <!-- Platform Management Group -->
  <rect x="80" y="100" width="500" height="350" fill="none" stroke="#00B294" stroke-width="2" rx="6" ry="6"/>
  <text x="330" y="125" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#00B294">Platform Management Group</text>
  
  <!-- Identity Subscription -->
  <rect x="100" y="140" width="220" height="80" fill="none" stroke="#DDA0DD" stroke-width="1" stroke-dasharray="3,3" rx="4" ry="4"/>
  <g transform="translate(110, 150)">
    <rect width="16" height="16" fill="#0078D4" rx="2"/>
    <text x="8" y="12" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="white" font-weight="bold">ID</text>
  </g>
  <text x="210" y="160" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="black">Identity Subscription</text>
  <text x="210" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666666">Azure AD, PIM, B2B</text>
  
  <!-- Management Subscription -->
  <rect x="340" y="140" width="220" height="80" fill="none" stroke="#DDA0DD" stroke-width="1" stroke-dasharray="3,3" rx="4" ry="4"/>
  <g transform="translate(350, 150)">
    <rect width="16" height="16" fill="#00B294" rx="2"/>
    <text x="8" y="12" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="white" font-weight="bold">M</text>
  </g>
  <text x="450" y="160" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="black">Management Subscription</text>
  <text x="450" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666666">Log Analytics, Automation</text>
  
  <!-- Connectivity Subscription -->
  <rect x="100" y="240" width="220" height="80" fill="none" stroke="#DDA0DD" stroke-width="1" stroke-dasharray="3,3" rx="4" ry="4"/>
  <g transform="translate(110, 250)">
    <rect width="16" height="16" fill="#68217A" rx="2"/>
    <text x="8" y="12" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="white" font-weight="bold">N</text>
  </g>
  <text x="210" y="260" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="black">Connectivity Subscription</text>
  <text x="210" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666666">Hub VNet, Firewall, VPN</text>
  
  <!-- Security Subscription -->
  <rect x="340" y="240" width="220" height="80" fill="none" stroke="#DDA0DD" stroke-width="1" stroke-dasharray="3,3" rx="4" ry="4"/>
  <g transform="translate(350, 250)">
    <rect width="16" height="16" fill="#D13438" rx="2"/>
    <text x="8" y="12" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="white" font-weight="bold">S</text>
  </g>
  <text x="450" y="260" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="black">Security Subscription</text>
  <text x="450" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666666">Key Vault, Security Center</text>
  
  <!-- Landing Zones Management Group -->
  <rect x="620" y="100" width="500" height="350" fill="none" stroke="#107C10" stroke-width="2" rx="6" ry="6"/>
  <text x="870" y="125" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#107C10">Landing Zones Management Group</text>
  
  <!-- Landing Zone Production -->
  <rect x="640" y="140" width="220" height="80" fill="none" stroke="#DDA0DD" stroke-width="1" stroke-dasharray="3,3" rx="4" ry="4"/>
  <g transform="translate(650, 150)">
    <rect width="16" height="16" fill="#107C10" rx="2"/>
    <text x="8" y="12" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="white" font-weight="bold">P</text>
  </g>
  <text x="750" y="160" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="black">Landing Zone Production</text>
  <text x="750" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666666">Production VNet, Subnets</text>
  
  <!-- Landing Zone Non-Production -->
  <rect x="880" y="140" width="220" height="80" fill="none" stroke="#DDA0DD" stroke-width="1" stroke-dasharray="3,3" rx="4" ry="4"/>
  <g transform="translate(890, 150)">
    <rect width="16" height="16" fill="#FF8C00" rx="2"/>
    <text x="8" y="12" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="white" font-weight="bold">D</text>
  </g>
  <text x="990" y="160" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="black">Landing Zone Non-Production</text>
  <text x="990" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666666">Dev/Test VNet, Subnets</text>
  
  <!-- Shared Services Landing Zone -->
  <rect x="640" y="240" width="220" height="80" fill="none" stroke="#DDA0DD" stroke-width="1" stroke-dasharray="3,3" rx="4" ry="4"/>
  <g transform="translate(650, 250)">
    <rect width="16" height="16" fill="#5C2D91" rx="2"/>
    <text x="8" y="12" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="white" font-weight="bold">S</text>
  </g>
  <text x="750" y="260" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="black">Shared Services Landing Zone</text>
  <text x="750" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666666">Shared resources, DevOps</text>
  
  <!-- Decommissioned Management Group -->
  <rect x="880" y="240" width="220" height="80" fill="none" stroke="#DDA0DD" stroke-width="1" stroke-dasharray="3,3" rx="4" ry="4"/>
  <g transform="translate(890, 250)">
    <rect width="16" height="16" fill="#666666" rx="2"/>
    <text x="8" y="12" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="white" font-weight="bold">X</text>
  </g>
  <text x="990" y="260" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="black">Decommissioned</text>
  <text x="990" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666666">Legacy workloads</text>
  
  <!-- Workloads Management Group -->
  <rect x="1160" y="100" width="500" height="350" fill="none" stroke="#68217A" stroke-width="2" rx="6" ry="6"/>
  <text x="1410" y="125" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#68217A">Workloads Management Group</text>
  
  <!-- Application Workloads -->
  <rect x="1180" y="140" width="220" height="80" fill="none" stroke="#DDA0DD" stroke-width="1" stroke-dasharray="3,3" rx="4" ry="4"/>
  <g transform="translate(1190, 150)">
    <rect width="16" height="16" fill="#68217A" rx="2"/>
    <text x="8" y="12" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="white" font-weight="bold">A</text>
  </g>
  <text x="1290" y="160" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="black">Application Workloads</text>
  <text x="1290" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666666">App Services, Functions</text>
  
  <!-- Data Workloads -->
  <rect x="1420" y="140" width="220" height="80" fill="none" stroke="#DDA0DD" stroke-width="1" stroke-dasharray="3,3" rx="4" ry="4"/>
  <g transform="translate(1430, 150)">
    <rect width="16" height="16" fill="#0078D4" rx="2"/>
    <text x="8" y="12" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="white" font-weight="bold">DB</text>
  </g>
  <text x="1530" y="160" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="black">Data Workloads</text>
  <text x="1530" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666666">SQL Database, Storage</text>
  
  <!-- AI/ML Workloads -->
  <rect x="1180" y="240" width="220" height="80" fill="none" stroke="#DDA0DD" stroke-width="1" stroke-dasharray="3,3" rx="4" ry="4"/>
  <g transform="translate(1190, 250)">
    <rect width="16" height="16" fill="#00B294" rx="2"/>
    <text x="8" y="12" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="white" font-weight="bold">AI</text>
  </g>
  <text x="1290" y="260" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="black">AI/ML Workloads</text>
  <text x="1290" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666666">OpenAI, Cognitive Services</text>
  
  <!-- Infrastructure Workloads -->
  <rect x="1420" y="240" width="220" height="80" fill="none" stroke="#DDA0DD" stroke-width="1" stroke-dasharray="3,3" rx="4" ry="4"/>
  <g transform="translate(1430, 250)">
    <rect width="16" height="16" fill="#FF8C00" rx="2"/>
    <text x="8" y="12" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="white" font-weight="bold">I</text>
  </g>
  <text x="1530" y="260" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="black">Infrastructure Workloads</text>
  <text x="1530" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666666">VMs, Containers, AKS</text>
  
  <!-- Networking Layer -->
  <rect x="80" y="480" width="1580" height="200" fill="none" stroke="#68217A" stroke-width="2" stroke-dasharray="5,5" rx="8" ry="8"/>
  <text x="870" y="505" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#68217A">Hub-Spoke Network Architecture</text>
  
  <!-- Hub VNet -->
  <rect x="120" y="520" width="200" height="60" fill="none" stroke="#DDA0DD" stroke-width="1" stroke-dasharray="3,3" rx="4" ry="4"/>
  <g transform="translate(130, 530)">
    <rect width="16" height="16" fill="#68217A" rx="2"/>
    <text x="8" y="12" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="white" font-weight="bold">H</text>
  </g>
  <text x="220" y="540" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="black">Hub VNet</text>
  <text x="220" y="560" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666666">10.0.0.0/16</text>
  
  <!-- Production Spoke -->
  <rect x="380" y="520" width="200" height="60" fill="none" stroke="#DDA0DD" stroke-width="1" stroke-dasharray="3,3" rx="4" ry="4"/>
  <g transform="translate(390, 530)">
    <rect width="16" height="16" fill="#107C10" rx="2"/>
    <text x="8" y="12" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="white" font-weight="bold">P</text>
  </g>
  <text x="480" y="540" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="black">Production Spoke</text>
  <text x="480" y="560" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666666">10.1.0.0/16</text>
  
  <!-- Non-Production Spoke -->
  <rect x="640" y="520" width="200" height="60" fill="none" stroke="#DDA0DD" stroke-width="1" stroke-dasharray="3,3" rx="4" ry="4"/>
  <g transform="translate(650, 530)">
    <rect width="16" height="16" fill="#FF8C00" rx="2"/>
    <text x="8" y="12" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="white" font-weight="bold">D</text>
  </g>
  <text x="740" y="540" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="black">Non-Production Spoke</text>
  <text x="740" y="560" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666666">10.2.0.0/16</text>
  
  <!-- Shared Services Spoke -->
  <rect x="900" y="520" width="200" height="60" fill="none" stroke="#DDA0DD" stroke-width="1" stroke-dasharray="3,3" rx="4" ry="4"/>
  <g transform="translate(910, 530)">
    <rect width="16" height="16" fill="#5C2D91" rx="2"/>
    <text x="8" y="12" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="white" font-weight="bold">S</text>
  </g>
  <text x="1000" y="540" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="black">Shared Services Spoke</text>
  <text x="1000" y="560" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666666">10.3.0.0/16</text>
  
  <!-- Security & Governance Layer -->
  <rect x="80" y="720" width="1580" height="120" fill="none" stroke="#D13438" stroke-width="2" stroke-dasharray="5,5" rx="8" ry="8"/>
  <text x="870" y="745" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#D13438">Security &amp; Governance</text>
  
  <!-- Security Elements -->
  <text x="120" y="770" font-family="Arial, sans-serif" font-size="14" fill="black">Security: Azure Firewall, NSGs, Private Endpoints, Azure Bastion, Azure DDoS Protection</text>
  <text x="120" y="790" font-family="Arial, sans-serif" font-size="14" fill="black">Governance: Azure Policy, Azure Blueprints, Cost Management, Resource Locks</text>
  <text x="120" y="810" font-family="Arial, sans-serif" font-size="14" fill="black">Monitoring: Log Analytics, Application Insights, Azure Monitor, Azure Sentinel</text>
  
  <!-- Client Details -->
  <text x="120" y="830" font-family="Arial, sans-serif" font-size="14" fill="black">Client: {CLIENT_NAME} | Servers: {SERVER_COUNT} | Storage: {STORAGE_TB}TB | Region: {REGION}</text>
  
  <!-- Connection arrows -->
  <line x1="320" y1="550" x2="380" y2="550" stroke="#00FF00" stroke-width="2" marker-end="url(#arrowhead)"/>
  <line x1="580" y1="550" x2="640" y2="550" stroke="#00FF00" stroke-width="2" marker-end="url(#arrowhead)"/>
  <line x1="840" y1="550" x2="900" y2="550" stroke="#00FF00" stroke-width="2" marker-end="url(#arrowhead)"/>
  
  <!-- Management Group connections -->
  <line x1="580" y1="250" x2="620" y2="250" stroke="#0078D4" stroke-width="2" stroke-dasharray="5,5"/>
  <line x1="1120" y1="250" x2="1160" y2="250" stroke="#0078D4" stroke-width="2" stroke-dasharray="5,5"/>
  
  <!-- Arrow marker definition -->
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#00FF00"/>
    </marker>
  </defs>
</svg>`;

/**
 * Generate a visual architecture diagram using Azure OpenAI
 */
export async function generateArchitectureDiagram(assessment: AssessmentReportData): Promise<string> {
  try {
    const systemPrompt = `You are an expert Azure Cloud Architect and SVG graphics designer. Your task is to generate COMPLETE SVG code for an Azure CAF architecture diagram based on assessment data.

CRITICAL: You must return ONLY valid SVG code starting with <svg and ending with </svg>. Do not include any explanations, instructions, or markdown formatting.

Create a comprehensive SVG diagram with these specifications:

SVG ATTRIBUTES:
- width="1792" height="1024"
- viewBox="0 0 1792 1024"
- xmlns="http://www.w3.org/2000/svg"

STYLING:
- White background: <rect width="1792" height="1024" fill="white"/>
- Light blue dashed borders: #A5D8FF, stroke-dasharray="5,5"
- Light purple dashed borders: #DDA0DD, stroke-dasharray="5,5"
- Rounded corners: rx="8" ry="8"
- Bold black text: font-weight="bold", font-family="Arial, sans-serif"
- Gray subtitles: fill="#666666", font-size="12px"
- Green arrows: #00FF00 for data flow

STRUCTURE:
1. Main container: Large rect with light blue dashed border, labeled "Azure Cloud Adoption Framework"
2. Five pillars arranged horizontally or vertically:
   - Strategy (Business justification and outcomes)
   - Plan (Adoption plan and roadmap)
   - Ready (Environment preparation)
   - Adopt (Workload deployment)
   - Govern (Policies and compliance)
3. Manage layer at bottom connecting all pillars
4. Include client details: server count, storage, region, costs
5. Use green arrows (#00FF00) for flow between phases
6. Add "Continuous Improvement" dashed arrow looping back to Manage

Generate ONLY the complete SVG code, no other text.`;

    const userPrompt = `Create an Azure CAF architecture diagram for the following client assessment:

Client: ${assessment.clientName}
Total Servers: ${assessment.totalServers}
Windows Servers: ${assessment.windowsServers}
Linux Servers: ${assessment.linuxServers}
Total Storage: ${assessment.totalStorageTB} TB
Target Region: ${assessment.targetRegion || 'East US'}
Estimated Monthly Cost: $${assessment.estimatedMonthlyCost}

VM Summary:
${assessment.vmSummary?.map(vm => 
  `- ${vm.vmName}: ${vm.recommendedSku} (${vm.cores} cores, ${vm.memoryGB}GB RAM, ${vm.storageGB}GB storage, $${vm.estimatedCost}/month)`
).join('\n') || 'No VM details provided'}

Recommendations: ${assessment.recommendations?.join(', ') || 'None specified'}
Risks: ${assessment.risks?.join(', ') || 'None specified'}

Generate a comprehensive CAF architecture diagram that addresses these specific requirements and shows the migration path from current state to Azure cloud adoption.`;

    const response = await getOpenAICompletion(systemPrompt + '\n\n' + userPrompt, {
      maxTokens: 4000,
      temperature: 0.1, // Low temperature for consistent output
      seed: 42 // Deterministic response
    });

    return response;
  } catch (error) {
    console.error('Error generating architecture diagram:', error);
    throw new Error('Failed to generate architecture diagram');
  }
}

/**
 * Generate a detailed Azure CAF Landing Zone architecture diagram
 */
export async function generateCAFLandingZoneDiagram(assessment: AssessmentReportData): Promise<string> {
  try {
    // Use DALL-E image generation for professional Azure CAF diagrams
    const imageUrl = await generateCAFLandingZoneImage(assessment);
    
    // Return the image URL wrapped in an img tag for display
    return `<img src="${imageUrl}" alt="Azure CAF Landing Zone Architecture" style="width: 100%; height: auto; max-width: 100%;" />`;
  } catch (error) {
    console.error('Error generating CAF Landing Zone diagram:', error);
    
    // Fallback to SVG template if image generation fails
    console.log('Falling back to SVG template');
    let svgDiagram = CAF_LANDING_ZONE_SVG_TEMPLATE
      .replace('{CLIENT_NAME}', escapeXml(assessment.clientName))
      .replace('{SERVER_COUNT}', assessment.totalServers.toString())
      .replace('{STORAGE_TB}', assessment.totalStorageTB.toString())
      .replace('{REGION}', escapeXml(assessment.targetRegion || 'East US'));

    // Add client-specific VM details if available
    if (assessment.vmSummary && assessment.vmSummary.length > 0) {
      const vmDetails = assessment.vmSummary.map(vm => 
        `${escapeXml(vm.vmName)}: ${escapeXml(vm.recommendedSku)}`
      ).join(', ');
      
      // Add VM details to the diagram
      const vmTextElement = `<text x="120" y="890" font-family="Arial, sans-serif" font-size="12" fill="black">VMs: ${vmDetails}</text>`;
      svgDiagram = svgDiagram.replace('</svg>', `${vmTextElement}\n</svg>`);
    }

    // Validate that the SVG is well-formed
    if (!svgDiagram.includes('<svg') || !svgDiagram.includes('</svg>')) {
      throw new Error('Generated SVG is not well-formed');
    }

    return svgDiagram;
  }
}

/**
 * Generate a simple CAF overview diagram
 */
export async function generateCAFOverviewDiagram(): Promise<string> {
  try {
    const prompt = `You are an expert Azure Cloud Architect and SVG graphics designer. Your task is to generate COMPLETE SVG code for an Azure CAF overview diagram.

CRITICAL: You must return ONLY valid SVG code starting with <svg and ending with </svg>. Do not include any explanations, instructions, or markdown formatting.

Create a comprehensive SVG diagram with these specifications:

SVG ATTRIBUTES:
- width="1792" height="1024"
- viewBox="0 0 1792 1024"
- xmlns="http://www.w3.org/2000/svg"

STYLING:
- White background: <rect width="1792" height="1024" fill="white"/>
- Light blue dashed borders: #A5D8FF, stroke-dasharray="5,5"
- Light purple dashed borders: #DDA0DD, stroke-dasharray="5,5"
- Rounded corners: rx="8" ry="8"
- Bold black text: font-weight="bold", font-family="Arial, sans-serif"
- Gray subtitles: fill="#666666", font-size="12px"
- Green arrows: #00FF00 for data flow

STRUCTURE:
1. Main container: Large rect with light blue dashed border, labeled "Cloud Adoption Framework" with subtitle "Azure CAF Overview"
2. Five pillars arranged horizontally or vertically with light purple dashed borders:
   - Strategy (blue document icon, subtitle: "Define business justification and outcomes")
   - Plan (blue checklist icon, subtitle: "Develop adoption plan and roadmap")
   - Ready (blue gear icon, subtitle: "Prepare environment and resources")
   - Adopt (blue cloud icon, subtitle: "Deploy and migrate workloads")
   - Govern (blue shield icon, subtitle: "Establish policies and compliance")
3. Manage layer at bottom with light blue dashed border, spanning across all pillars
4. Small nested box in "Adopt" labeled "Workload Deployment" (subtitle: "10.0.0.0/16 network")
5. Side panel on right labeled "CAF Alignment" (subtitle: "Business, People, Process, Technology")
6. Green solid arrows (#00FF00) showing flow between pillars
7. Dashed green arrow labeled "Continuous Improvement" looping back to Manage

Generate ONLY the complete SVG code, no other text.`;

    const response = await getOpenAICompletion(prompt, {
      maxTokens: 4000,
      temperature: 0.1,
      seed: 42
    });

    return response;
  } catch (error) {
    console.error('Error generating CAF overview diagram:', error);
    throw new Error('Failed to generate CAF overview diagram');
  }
}
