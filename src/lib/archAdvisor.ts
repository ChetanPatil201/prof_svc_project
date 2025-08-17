import type { AssessmentReportData } from '@/types/assessmentReport';
import type { ArchitectureAdvice } from '@/types/architecture';
import { getOpenAICompletion } from './azureOpenAI';

export async function getArchitectureAdvice(assessment: AssessmentReportData): Promise<ArchitectureAdvice> {
  const systemPrompt = `You are an Azure Architecture Center expert specializing in landing zone design, hub-spoke architectures, and cloud migration best practices. 

Your role is to analyze assessment data and provide:
1. **Recommendations**: Specific architectural improvements and best practices
2. **Risks**: Potential issues and security concerns
3. **Guardrails**: Azure Policy assignments and compliance requirements

Focus on Azure Architecture Center (AAC) principles:
- Landing zone design patterns
- Hub-spoke network architecture
- Security-first approach with Zero Trust
- Identity and access management
- Monitoring and observability
- Cost optimization
- Compliance and governance

Provide concise, actionable advice in bullet points.`;

  const assessmentSummary = buildAssessmentSummary(assessment);
  
  const userPrompt = `Analyze the following Azure migration assessment data and provide architecture recommendations, risks, and guardrails:

${assessmentSummary}

Please provide your analysis in the following JSON format:
{
  "recommendations": [
    "Specific architectural recommendation 1",
    "Specific architectural recommendation 2"
  ],
  "risks": [
    "Potential risk or issue 1", 
    "Potential risk or issue 2"
  ],
  "guardrails": [
    "Azure Policy or compliance requirement 1",
    "Azure Policy or compliance requirement 2"
  ]
}

Focus on:
- Network security and segmentation
- Identity and access management
- Monitoring and logging
- Cost optimization
- Compliance and governance
- High availability and disaster recovery
- Performance and scalability`;

  try {
    const response = await getOpenAICompletion(userPrompt, {
      maxTokens: 2000,
      temperature: 0.3,
      seed: 42 // For consistent responses
    });

    // Parse the JSON response
    const advice = parseArchitectureAdvice(response);
    
    // If parsing fails, return default advice
    if (!advice) {
      return getDefaultAdvice(assessment);
    }

    return advice;
  } catch (error) {
    console.error('Error getting architecture advice:', error);
    return getDefaultAdvice(assessment);
  }
}

function buildAssessmentSummary(assessment: AssessmentReportData): string {
  const summary = [
    `**Assessment Overview:**`,
    `- Total Servers: ${assessment.totalServers}`,
    `- In-Scope Servers: ${assessment.inScopeServersCount}`,
    `- Windows Servers: ${assessment.windowsServers || 0}`,
    `- Linux Servers: ${assessment.linuxServers || 0}`,
    `- Total Storage: ${assessment.totalStorageTB || 0} TB`,
    `- Target Region: ${assessment.targetRegion || 'Not specified'}`,
    ``,
    `**VM Summary:**`,
  ];

  if (assessment.vmSummary && assessment.vmSummary.length > 0) {
    assessment.vmSummary.slice(0, 5).forEach(vm => {
      summary.push(`- ${vm.vmName || 'Unnamed VM'}: ${vm.recommendedSize || 'Standard_D2s_v5'} (${vm.cores} cores, ${vm.memoryGB}GB RAM)`);
    });
    
    if (assessment.vmSummary.length > 5) {
      summary.push(`- ... and ${assessment.vmSummary.length - 5} more VMs`);
    }
  }

  if (assessment.allAssessedDisks && assessment.allAssessedDisks.length > 0) {
    summary.push(``, `**Storage Summary:**`);
    const diskTypes = assessment.allAssessedDisks.reduce((acc, disk) => {
      const type = disk.recommendedDiskType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(diskTypes).forEach(([type, count]) => {
      summary.push(`- ${type}: ${count} disks`);
    });
  }

  if (assessment.rulesAndConstraints) {
    summary.push(``, `**Constraints:**`, assessment.rulesAndConstraints);
  }

  return summary.join('\n');
}

function parseArchitectureAdvice(response: string): ArchitectureAdvice | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate the structure
    if (!parsed.recommendations || !parsed.risks || !parsed.guardrails) {
      return null;
    }

    return {
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      guardrails: Array.isArray(parsed.guardrails) ? parsed.guardrails : []
    };
  } catch (error) {
    console.error('Error parsing architecture advice:', error);
    return null;
  }
}

function getDefaultAdvice(assessment: AssessmentReportData): ArchitectureAdvice {
  const recommendations: string[] = [];
  const risks: string[] = [];
  const guardrails: string[] = [];

  // Default recommendations based on assessment size
  if (assessment.totalServers > 20) {
    recommendations.push(
      "Implement hub-spoke network architecture for better network segmentation",
      "Use Azure Firewall for centralized network security management",
      "Deploy Azure Bastion for secure VM access",
      "Implement Azure Front Door for global load balancing and DDoS protection"
    );
  } else {
    recommendations.push(
      "Use single VNet with proper subnet segmentation (web, app, db)",
      "Implement Network Security Groups (NSGs) for each subnet",
      "Deploy Azure Application Gateway for web application firewall (WAF)",
      "Enable Azure Bastion for secure VM access"
    );
  }

  // Default recommendations for all assessments
  recommendations.push(
    "Implement Azure Key Vault for secrets and certificate management",
    "Enable Azure Monitor and Log Analytics for comprehensive monitoring",
    "Deploy Azure Policy for governance and compliance",
    "Use Azure Backup for disaster recovery",
    "Implement Azure AD for identity and access management"
  );

  // Default risks
  risks.push(
    "Single point of failure if not using availability zones",
    "Potential security gaps without proper NSG configuration",
    "Cost overruns without proper resource tagging and monitoring",
    "Compliance issues without proper policy assignments"
  );

  // Default guardrails
  guardrails.push(
    "Azure Policy: Allowed VM SKUs",
    "Azure Policy: Required tags",
    "Azure Policy: Diagnostic settings",
    "Azure Policy: Network security group flow logs",
    "Azure Policy: Key Vault soft delete",
    "Azure Policy: Storage account encryption"
  );

  return { recommendations, risks, guardrails };
} 