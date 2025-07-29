import { getOpenAICompletion } from './azureOpenAI';
import { AssessmentReportData, ServerDetails } from '@/types/assessmentReport';
import { generateCostComparisonTable, generateComputeBreakdownData, generateDiskBreakdownData } from './utils';

export interface TemplateSection {
  sectionName: string;
  content: string;
  placeholders: string[];
  shouldUpdate: boolean;
}

export interface ProcessedTemplate {
  sections: TemplateSection[];
  rawContent: string;
}

export async function analyzeWordTemplate(templateContent: string): Promise<ProcessedTemplate> {
  const prompt = `You are an expert at analyzing Word document templates for assessment reports. Analyze the following document content and identify sections that should be updated with dynamic data.

Document Content:
${templateContent}

Please identify:
1. Section names and their content
2. Any placeholders or variables that need to be replaced (e.g., $\{placeholder\}, {{variable}}, [PLACEHOLDER])
3. Which sections should be updated with dynamic content

Return your analysis as a JSON object with this structure:
{
  "sections": [
    {
      "sectionName": "Executive Summary",
      "content": "original content here",
      "placeholders": ["placeholder1", "placeholder2"],
      "shouldUpdate": true
    }
  ]
}

Focus on sections like:
- Executive Summary
- Cloud Discovery Report
- Application Workloads
- Server Infrastructure
- Cost Analysis
- Recommendations

Only return the JSON object, nothing else.`;

  try {
    const analysis = await getOpenAICompletion(prompt, {
      temperature: 0,
      seed: 42,
      maxTokens: 2048
    });
    const parsedAnalysis = JSON.parse(analysis);
    return {
      sections: parsedAnalysis.sections || [],
      rawContent: templateContent
    };
  } catch (error) {
    console.error('Error analyzing template:', error);
    return {
      sections: [],
      rawContent: templateContent
    };
  }
}

export async function generateDynamicContent(
  assessmentData: AssessmentReportData,
  sectionName: string,
  originalContent: string
): Promise<string> {
  const prompt = `You are an expert at generating content for cloud assessment reports. Based on the provided assessment data, generate content for the "${sectionName}" section.

Assessment Data:
- Total Servers: ${assessmentData.totalServers}
- In-Scope Servers: ${assessmentData.inScopeServers}
- OS Distribution: ${JSON.stringify(assessmentData.osDistribution)}
- VM Summary: ${JSON.stringify(assessmentData.vmSummary.slice(0, 5))} (showing first 5 VMs)

Original Section Content:
${originalContent}

Generate updated content for this section that:
1. Maintains the professional tone and structure
2. Incorporates the assessment data
3. Provides meaningful insights and analysis
4. Uses the same formatting and style as the original
5. Replaces any placeholders with actual data

Return only the updated content, maintaining the same formatting and structure.`;

  try {
    return await getOpenAICompletion(prompt, {
      temperature: 0,
      seed: 42,
      maxTokens: 2048
    });
  } catch (error) {
    console.error('Error generating dynamic content:', error);
    return originalContent;
  }
}

export function replacePlaceholders(content: string, data: AssessmentReportData): string {
  let updatedContent = content;

  // Generate cost comparison table
  const costComparisonTableData = generateCostComparisonTable(data);
  
  // Generate compute breakdown data
  const computeBreakdownData = generateComputeBreakdownData(data);
  
  // Generate disk breakdown data
  const diskBreakdownData = generateDiskBreakdownData(data);

  // Replace common placeholders
  const replacements: Record<string, string> = {
    '${totalServers}': data.totalServers.toString(),
    '${inScopeServers}': data.inScopeServersCount.toString(),
    '${vmSummary}': generateVMSummaryTable(data.vmSummary),
    '${osDistribution}': generateOSDistributionText(data.osDistribution),
    '${serverInfrastructure}': data.serverInfrastructure,
    '${readinessSummary}': data.readinessSummary,
    '${costAnalysis}': data.costAnalysis,
    '${recommendations}': data.recommendations,
    
    // Compute Breakdown Section
    '${computeBreakdownTitle}': computeBreakdownData.title,
    '${computeBreakdownDescription}': computeBreakdownData.description,
    '${computeBreakdownSummary}': computeBreakdownData.summary,
    '${totalComputeCost}': `$${computeBreakdownData.totalComputeCost.toFixed(2)}`,
    
    // Compute Breakdown Table Headers
    '${cbHeader1}': 'Machine',
    '${cbHeader2}': 'Cores',
    '${cbHeader3}': 'Memory(MB)',
    '${cbHeader4}': 'Recommended size',
    '${cbHeader5}': 'Compute monthly cost estimate USD',
    
    // Table Headers
    '${costTableHeader1}': 'Pricing Plan',
    '${costTableHeader2}': 'Config Match',
    '${costTableHeader3}': 'Compute',
    '${costTableHeader4}': 'Storage',
    '${costTableHeader5}': 'Total',
    
    // Pay-as-you-go Row
    '${paygPricingPlan}': 'Pay-as-you-go (PAYG)',
    '${paygConfigMatch}': 'On-demand',
    '${paygCompute}': `$${costComparisonTableData.rows[0]?.compute.toFixed(2) || '0.00'}`,
    '${paygStorage}': `$${costComparisonTableData.rows[0]?.storage.toFixed(2) || '0.00'}`,
    '${paygTotal}': `$${costComparisonTableData.rows[0]?.total.toFixed(2) || '0.00'}`,
    
    // 1-Year Reserved Instance Row
    '${oneYearPricingPlan}': '1 Year Reserved Instance',
    '${oneYearConfigMatch}': '1-year commitment',
    '${oneYearCompute}': `$${costComparisonTableData.rows[1]?.compute.toFixed(2) || '0.00'}`,
    '${oneYearStorage}': `$${costComparisonTableData.rows[1]?.storage.toFixed(2) || '0.00'}`,
    '${oneYearTotal}': `$${costComparisonTableData.rows[1]?.total.toFixed(2) || '0.00'}`,
    
    // 3-Year Reserved Instance Row
    '${threeYearPricingPlan}': '3 Year Reserved Instance',
    '${threeYearConfigMatch}': '3-year commitment',
    '${threeYearCompute}': `$${costComparisonTableData.rows[2]?.compute.toFixed(2) || '0.00'}`,
    '${threeYearStorage}': `$${costComparisonTableData.rows[2]?.storage.toFixed(2) || '0.00'}`,
    '${threeYearTotal}': `$${costComparisonTableData.rows[2]?.total.toFixed(2) || '0.00'}`,
    
    // Summary
    '${costSummaryTotal}': `$${costComparisonTableData.summary.totalMonthlyCost.toFixed(2)}`,
    '${costSummaryRecommended}': costComparisonTableData.summary.bestPricingOption,
    '${costSummarySavings}': `${costComparisonTableData.summary.costSavingsPercentage.toFixed(1)}%`,
    '${costSummaryRecommendation}': costComparisonTableData.summary.recommendationSummary,
    
    // Note: vms array will be handled separately by Docxtemplater
    
    // Total row placeholders
    '${cbTotalLabel}': 'Total Compute Cost',
    '${cbTotalCost}': `$${computeBreakdownData.totalComputeCost.toFixed(2)}`,
    
    // Disk Breakdown Section
    '${diskBreakdownTitle}': diskBreakdownData.title,
    '${diskBreakdownDescription}': diskBreakdownData.description,
    '${diskBreakdownSummary}': diskBreakdownData.summary,
    '${totalStorageCost}': `$${diskBreakdownData.totalStorageCost.toFixed(2)}`,
    
    // Disk Breakdown Table Headers
    '${dbHeader1}': 'Machine',
    '${dbHeader2}': 'Disk name',
    '${dbHeader3}': 'Recommended disk size SKU',
    '${dbHeader4}': 'Recommended disk type',
    '${dbHeader5}': 'Source disk size(GB)',
    '${dbHeader6}': 'Target disk size(GB)',
    '${dbHeader7}': 'Monthly cost estimate',
    
    // Disk Total row placeholders
    '${dbTotalLabel}': 'Total Storage Cost',
    '${dbTotalCost}': `$${diskBreakdownData.totalStorageCost.toFixed(2)}`,
    
    // Legacy placeholders (for backward compatibility)
    '${payAsYouGoPlan}': 'Pay-as-you-go (PAYG)',
    '${oneYearReservedPlan}': '1 Year Reserved Instance',
    '${threeYearReservedPlan}': '3 Year Reserved Instance',
    '${payAsYouGoCompute}': costComparisonTableData.rows[0]?.compute.toFixed(2) || '0.00',
    '${payAsYouGoStorage}': costComparisonTableData.rows[0]?.storage.toFixed(2) || '0.00',
    '${payAsYouGoTotal}': costComparisonTableData.rows[0]?.total.toFixed(2) || '0.00',
    '${oneYearReservedCompute}': costComparisonTableData.rows[1]?.compute.toFixed(2) || '0.00',
    '${oneYearReservedStorage}': costComparisonTableData.rows[1]?.storage.toFixed(2) || '0.00',
    '${oneYearReservedTotal}': costComparisonTableData.rows[1]?.total.toFixed(2) || '0.00',
    '${threeYearReservedCompute}': costComparisonTableData.rows[2]?.compute.toFixed(2) || '0.00',
    '${threeYearReservedStorage}': costComparisonTableData.rows[2]?.storage.toFixed(2) || '0.00',
    '${threeYearReservedTotal}': costComparisonTableData.rows[2]?.total.toFixed(2) || '0.00',
    '${totalMonthlyCost}': costComparisonTableData.summary.totalMonthlyCost.toFixed(2),
    '${bestPricingOption}': costComparisonTableData.summary.bestPricingOption,
    '${costSavingsPercentage}': costComparisonTableData.summary.costSavingsPercentage.toFixed(1),
    '${recommendationSummary}': costComparisonTableData.summary.recommendationSummary
  };

  Object.entries(replacements).forEach(([placeholder, value]) => {
    updatedContent = updatedContent.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  });

  return updatedContent;
}

function generateVMSummaryTable(vmSummary: ServerDetails[]): string {
  if (vmSummary.length === 0) return 'No VM data available.';

  const tableRows = vmSummary.map(vm =>
    `| ${vm.vmName} | ${vm.operatingSystem} | ${vm.cores} | ${vm.memoryGB}GB | ${vm.storageGB}GB | ${vm.recommendedSize} | $${(vm.computeMonthlyCostEstimateUsd + vm.storageMonthlyCostEstimateUsd).toFixed(2)} |`
  ).join('\n');

  return `| VM Name | OS | Cores | Memory | Storage | Recommended Size | Monthly Cost |
|---------|----|-------|--------|---------|------------------|--------------|
${tableRows}`;
}

function generateOSDistributionText(osDistribution: Record<string, number>): string {
  const total = Object.values(osDistribution).reduce((sum, count) => sum + count, 0);
  const distribution = Object.entries(osDistribution)
    .map(([os, count]) => `${os}: ${count} (${((count / total) * 100).toFixed(1)}%)`)
    .join(', ');
  return `Total servers: ${total}. Distribution: ${distribution}`;
} 