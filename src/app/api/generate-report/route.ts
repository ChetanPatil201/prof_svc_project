import { NextRequest } from 'next/server';
import { AssessmentReportData } from '@/types/assessmentReport';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { generateCostComparisonTable, generateCostComparisonTableData, generateComputeBreakdownData, generateDiskBreakdownData, getConstrainedDiskData } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const reportDataJson = formData.get('reportData') as string;
    const templateFile = formData.get('templateFile') as File;
    
    if (!reportDataJson) {
      return new Response(JSON.stringify({ error: 'No report data provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const data: AssessmentReportData = JSON.parse(reportDataJson);



    // Apply disk constraints to original data for consistency across all report sections
    if (data.rulesAndConstraints && data.payAsYouGoData?.disks && data.targetRegion) {
      data.payAsYouGoData.disks = await getConstrainedDiskData(data);
    }

    // Calculate missing fields if undefined
    let windowsServers = data.windowsServers;
    let linuxServers = data.linuxServers;
    let totalStorageTB = data.totalStorageTB;
    let numDisksInScope = data.numDisksInScope;

    // Calculate from vmSummary if needed
    if (data.vmSummary && data.vmSummary.length > 0) {
      if (windowsServers === undefined) {
        windowsServers = data.vmSummary.filter(vm => (vm.operatingSystem || '').toLowerCase().includes('windows')).length;
      }
      if (linuxServers === undefined) {
        linuxServers = data.vmSummary.filter(vm => (vm.operatingSystem || '').toLowerCase().includes('linux')).length;
      }
      if (totalStorageTB === undefined) {
        totalStorageTB = data.vmSummary.reduce((sum, vm) => sum + (Number(vm.storageGB) || 0), 0) / 1024;
        totalStorageTB = Number(totalStorageTB.toFixed(3));
      }
    }
    // Always recalculate disk count from allAssessedDisks if present
    if (Array.isArray(data.allAssessedDisks)) {
      numDisksInScope = data.allAssessedDisks.length;
    }

    // Generate cost comparison table
    const costComparisonTableData = await generateCostComparisonTable(data);
    const structuredTableData = generateCostComparisonTableData(costComparisonTableData);
    
    // Generate compute breakdown data
    const computeBreakdownData = await generateComputeBreakdownData(data);
    
    // Generate disk breakdown data
    const diskBreakdownData = await generateDiskBreakdownData(data);

    // Use these values in the template
    const templateData = {
      ...data,
      windowsServers,
      linuxServers,
      totalStorageTB,
      numDisksInScope,
      osDistributionTable: data.osDistributionTable,
      osDistributionTotal: data.osDistributionTotal,
      inScopeServers: data.inScopeServers,
      osDistribution: Object.entries(data.osDistribution).map(([os, count]) => `${os}: ${count} servers`).join(', '),
      vmSummary: data.vmSummary, // Use Azure Migrate assessment data for the template
      serverTable: data.vmSummary.map(vm => ({
        name: vm.vmName,
        os: vm.operatingSystem,
        cores: vm.cores,
        memory: vm.memoryGB,
        storage: vm.storageGB,
        cpuUsage: vm.cpuUsage,
        memoryUsage: vm.memoryUsage,
        recommendedSize: vm.recommendedSize,
        monthlyCost: (vm.computeMonthlyCostEstimateUsd + vm.storageMonthlyCostEstimateUsd).toFixed(2),
        readiness: vm.readiness
      })),
      cloudReadiness: (data.cloudReadiness || []).map((row: { machine: string; operatingSystem: string; vmReadiness: string; azurePlan?: string }) => ({
        machine: row.machine,
        operatingSystem: row.operatingSystem,
        vmReadiness: row.vmReadiness,
        azurePlan: "Rehost (Lift-n-Shift)"
      })),
      // Add structured table data for proper Word table generation
      costComparisonTableRows: structuredTableData.tableRows,
      costComparisonSummary: structuredTableData.summary,
      
      // Compute Breakdown Section
      computeBreakdownTitle: computeBreakdownData.title,
      computeBreakdownDescription: computeBreakdownData.description,
      computeBreakdownSummary: computeBreakdownData.summary,
      totalComputeCost: `$${computeBreakdownData.totalComputeCost.toFixed(2)}`,
      
      // Compute Breakdown Table Headers
      cbHeader1: 'Machine',
      cbHeader2: 'Cores',
      cbHeader3: 'Memory(MB)',
      cbHeader4: 'Recommended size',
      cbHeader5: 'Compute monthly cost estimate USD',
      
      // Dynamic VM array for loop-based table generation
      vms: computeBreakdownData.vms,
      
      // Total row placeholders
      cbTotalLabel: 'Total Compute Cost',
      cbTotalCost: `$${computeBreakdownData.totalComputeCost.toFixed(2)}`,
      
      // Disk Breakdown Section
      diskBreakdownTitle: diskBreakdownData.title,
      diskBreakdownDescription: diskBreakdownData.description,
      diskBreakdownSummary: diskBreakdownData.summary,
      totalStorageCost: `$${diskBreakdownData.totalStorageCost.toFixed(2)}`,
      
      // Disk Breakdown Table Headers
      dbHeader1: 'Machine',
      dbHeader2: 'Disk name',
      dbHeader3: 'Recommended disk size SKU',
      dbHeader4: 'Recommended disk type',
      dbHeader5: 'Source disk size(GB)',
      dbHeader6: 'Target disk size(GB)',
      dbHeader7: 'Monthly cost estimate',
      
      // Dynamic Disk array for loop-based table generation with shorter field names
      disks: diskBreakdownData.disks.map(disk => ({
        machine: disk.machine,
        diskName: disk.diskName,
        recDiskSizeSku: disk.recommendedDiskSizeSku,
        recDiskType: disk.recommendedDiskType,
        srcDiskSizeGb: disk.sourceDiskSizeGb,
        trgDiskSizeGb: disk.targetDiskSizeGb,
        mnthlyCostEstimate: disk.monthlyCostEstimate
      })),
      
      // Disk Total row placeholders
      dbTotalLabel: 'Total Storage Cost',
      dbTotalCost: `$${diskBreakdownData.totalStorageCost.toFixed(2)}`,
      
      // Table Headers
      costTableHeader1: 'Pricing Plan',
      costTableHeader2: 'Config Match',
      costTableHeader3: 'Compute',
      costTableHeader4: 'Storage',
      costTableHeader5: 'Total',
      
      // Pay-as-you-go Row
      paygPricingPlan: 'Pay-as-you-go (PAYG)',
      paygConfigMatch: 'On-demand',
      paygCompute: `$${costComparisonTableData.rows[0]?.compute.toFixed(2) || '0.00'}`,
      paygStorage: `$${costComparisonTableData.rows[0]?.storage.toFixed(2) || '0.00'}`,
      paygTotal: `$${costComparisonTableData.rows[0]?.total.toFixed(2) || '0.00'}`,
      
      // 1-Year Reserved Instance Row
      oneYearPricingPlan: '1 Year Reserved Instance',
      oneYearConfigMatch: '1-year commitment',
      oneYearCompute: `$${costComparisonTableData.rows[1]?.compute.toFixed(2) || '0.00'}`,
      oneYearStorage: `$${costComparisonTableData.rows[1]?.storage.toFixed(2) || '0.00'}`,
      oneYearTotal: `$${costComparisonTableData.rows[1]?.total.toFixed(2) || '0.00'}`,
      
      // 3-Year Reserved Instance Row
      threeYearPricingPlan: '3 Year Reserved Instance',
      threeYearConfigMatch: '3-year commitment',
      threeYearCompute: `$${costComparisonTableData.rows[2]?.compute.toFixed(2) || '0.00'}`,
      threeYearStorage: `$${costComparisonTableData.rows[2]?.storage.toFixed(2) || '0.00'}`,
      threeYearTotal: `$${costComparisonTableData.rows[2]?.total.toFixed(2) || '0.00'}`,
      
      // Summary
      costSummaryTotal: `$${costComparisonTableData.summary.totalMonthlyCost.toFixed(2)}`,
      costSummaryRecommended: costComparisonTableData.summary.bestPricingOption,
      costSummarySavings: `${costComparisonTableData.summary.costSavingsPercentage.toFixed(1)}%`,
      costSummaryRecommendation: costComparisonTableData.summary.recommendationSummary,
      
      // Legacy placeholders (for backward compatibility)
      payAsYouGoPlan: 'Pay-as-you-go (PAYG)',
      oneYearReservedPlan: '1 Year Reserved Instance',
      threeYearReservedPlan: '3 Year Reserved Instance',
      payAsYouGoCompute: costComparisonTableData.rows[0]?.compute.toFixed(2) || '0.00',
      payAsYouGoStorage: costComparisonTableData.rows[0]?.storage.toFixed(2) || '0.00',
      payAsYouGoTotal: costComparisonTableData.rows[0]?.total.toFixed(2) || '0.00',
      oneYearReservedCompute: costComparisonTableData.rows[1]?.compute.toFixed(2) || '0.00',
      oneYearReservedStorage: costComparisonTableData.rows[1]?.storage.toFixed(2) || '0.00',
      oneYearReservedTotal: costComparisonTableData.rows[1]?.total.toFixed(2) || '0.00',
      threeYearReservedCompute: costComparisonTableData.rows[2]?.compute.toFixed(2) || '0.00',
      threeYearReservedStorage: costComparisonTableData.rows[2]?.storage.toFixed(2) || '0.00',
      threeYearReservedTotal: costComparisonTableData.rows[2]?.total.toFixed(2) || '0.00',
      totalMonthlyCost: costComparisonTableData.summary.totalMonthlyCost.toFixed(2),
      bestPricingOption: costComparisonTableData.summary.bestPricingOption,
      costSavingsPercentage: costComparisonTableData.summary.costSavingsPercentage.toFixed(1),
      recommendationSummary: costComparisonTableData.summary.recommendationSummary
    };

    let docxBuffer: Buffer;

    if (templateFile) {
      // Use uploaded template file
      const templateBuffer = Buffer.from(await templateFile.arrayBuffer());
      const zip = new PizZip(templateBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });
      // Render the document
      try {
        doc.render(templateData);
      } catch (err) {
        const error = err as any;
        if (error.properties && error.properties.errors) {
          console.log('❌ [Generate Report] Template rendering error:', error.properties.errors);
        }
        throw error;
      }
      // Get the document buffer
      docxBuffer = doc.getZip().generate({ type: 'nodebuffer' });
    } else {
      // Fallback: Create a basic document without template
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } = await import('docx');
      
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: "Cloud Assessment Report",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
              }),
              new Paragraph({
                children: [new TextRun({ text: `Total Servers: ${data.totalServers}`, size: 24 })],
                spacing: { before: 120, after: 120 },
              }),
              new Paragraph({
                children: [new TextRun({ text: `In Scope Servers: ${data.inScopeServers}`, size: 24 })],
                spacing: { before: 120, after: 120 },
              }),
              new Paragraph({
                children: [new TextRun({ text: data.readinessSummary, size: 24 })],
                spacing: { before: 120, after: 120 },
              }),
              new Paragraph({
                children: [new TextRun({ text: data.costAnalysis, size: 24 })],
                spacing: { before: 120, after: 120 },
              }),
              new Paragraph({
                children: [new TextRun({ text: data.recommendations, size: 24 })],
                spacing: { before: 120, after: 120 },
              }),
              // Add Server Scan Summary Table
              new Paragraph({
                text: "Server Scan Summary",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 240, after: 120 },
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph("Total No. Of Servers discovered")], width: { size: 50, type: WidthType.PERCENTAGE } }),
                      new TableCell({ children: [new Paragraph(String(data.totalServers))], width: { size: 50, type: WidthType.PERCENTAGE } }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph("In scope Servers count")], width: { size: 50, type: WidthType.PERCENTAGE } }),
                      new TableCell({ children: [new Paragraph(String(data.inScopeServers))], width: { size: 50, type: WidthType.PERCENTAGE } }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph("Windows Servers")], width: { size: 50, type: WidthType.PERCENTAGE } }),
                      new TableCell({ children: [new Paragraph(String(data.windowsServers ?? ''))], width: { size: 50, type: WidthType.PERCENTAGE } }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph("Linux Servers")], width: { size: 50, type: WidthType.PERCENTAGE } }),
                      new TableCell({ children: [new Paragraph(String(data.linuxServers ?? ''))], width: { size: 50, type: WidthType.PERCENTAGE } }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph("Total Storage (TB)")], width: { size: 50, type: WidthType.PERCENTAGE } }),
                      new TableCell({ children: [new Paragraph(String(data.totalStorageTB ?? ''))], width: { size: 50, type: WidthType.PERCENTAGE } }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph("No. Of Disks (In scope)")], width: { size: 50, type: WidthType.PERCENTAGE } }),
                      new TableCell({ children: [new Paragraph(String(data.numDisksInScope ?? ''))], width: { size: 50, type: WidthType.PERCENTAGE } }),
                    ],
                  }),
                ],
              }),
                    // Add Cost Comparison Table
      new Paragraph({
        text: "Azure Cost Comparison Analysis",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          // Header row with blue background
          new TableRow({
            children: [
              new TableCell({ 
                children: [new Paragraph("Pricing Plan")], 
                width: { size: 30, type: WidthType.PERCENTAGE },
                shading: { fill: "2c3e50" }
              }),
              new TableCell({ 
                children: [new Paragraph("Config Match")], 
                width: { size: 20, type: WidthType.PERCENTAGE },
                shading: { fill: "2c3e50" }
              }),
              new TableCell({ 
                children: [new Paragraph("Compute")], 
                width: { size: 15, type: WidthType.PERCENTAGE },
                shading: { fill: "2c3e50" }
              }),
              new TableCell({ 
                children: [new Paragraph("Storage")], 
                width: { size: 15, type: WidthType.PERCENTAGE },
                shading: { fill: "2c3e50" }
              }),
              new TableCell({ 
                children: [new Paragraph("Total")], 
                width: { size: 20, type: WidthType.PERCENTAGE },
                shading: { fill: "2c3e50" }
              }),
            ],
          }),
          // Data rows
          ...structuredTableData.tableRows.map((row, index) => new TableRow({
            children: [
              new TableCell({ 
                children: [new Paragraph(row.pricingPlan)],
                shading: { fill: index % 2 === 0 ? "f8f9fa" : "ffffff" }
              }),
              new TableCell({ 
                children: [new Paragraph(row.configMatch)],
                shading: { fill: index % 2 === 0 ? "f8f9fa" : "ffffff" }
              }),
              new TableCell({ 
                children: [new Paragraph(row.compute)],
                shading: { fill: index % 2 === 0 ? "f8f9fa" : "ffffff" }
              }),
              new TableCell({ 
                children: [new Paragraph(row.storage)],
                shading: { fill: index % 2 === 0 ? "f8f9fa" : "ffffff" }
              }),
              new TableCell({ 
                children: [new Paragraph(row.total)],
                shading: { fill: index % 2 === 0 ? "f8f9fa" : "ffffff" }
              }),
            ],
          })),
        ],
      }),
      // Add Summary section
      new Paragraph({
        text: "Summary",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 240, after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Total Cost: ${structuredTableData.summary.totalCost}`, size: 24 })],
        spacing: { before: 120, after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Recommended Option: ${structuredTableData.summary.recommendedOption}`, size: 24 })],
        spacing: { before: 120, after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Potential Savings: ${structuredTableData.summary.potentialSavings}`, size: 24 })],
        spacing: { before: 120, after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Recommendation: ${structuredTableData.summary.recommendation}`, size: 24 })],
        spacing: { before: 120, after: 120 },
              }),
              // Add VM Instance Size Recommendation Table
              new Paragraph({
                text: "VM Instance Size Recommendation (Performance based – Right Sized)",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 240, after: 120 },
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph("Server Name")], width: { size: 20, type: WidthType.PERCENTAGE } }),
                      new TableCell({ children: [new Paragraph("Cores")], width: { size: 10, type: WidthType.PERCENTAGE } }),
                      new TableCell({ children: [new Paragraph("Memory (GB)")], width: { size: 10, type: WidthType.PERCENTAGE } }),
                      new TableCell({ children: [new Paragraph("CPU usage (%)")], width: { size: 15, type: WidthType.PERCENTAGE } }),
                      new TableCell({ children: [new Paragraph("Memory usage (%)")], width: { size: 15, type: WidthType.PERCENTAGE } }),
                      new TableCell({ children: [new Paragraph("Recommended size")], width: { size: 20, type: WidthType.PERCENTAGE } }),
                    ],
                  }),
                  ...data.vmSummary.map(vm => new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(String(vm.vmName ?? ''))] }),
                      new TableCell({ children: [new Paragraph(String(vm.cores ?? ''))] }),
                      new TableCell({ children: [new Paragraph(String(vm.memoryGB ?? ''))] }),
                      new TableCell({ children: [new Paragraph(String(vm.cpuUsage ?? ''))] }),
                      new TableCell({ children: [new Paragraph(String(vm.memoryUsage ?? ''))] }),
                      new TableCell({ children: [new Paragraph(String(vm.recommendedSize ?? ''))] }),
                    ],
                  })),
                ],
              }),
              // Add Disk Recommendations Table
              new Paragraph({
                text: "2.4.3 Disk Recommendations for Right-Sized",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 240, after: 120 },
              }),
              new Paragraph({
                children: [new TextRun({ text: diskBreakdownData.description, size: 24 })],
                spacing: { before: 120, after: 120 },
              }),
              new Paragraph({
                text: "Disk Cost Breakdown:",
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 240, after: 120 },
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph("Machine")], width: { size: 15, type: WidthType.PERCENTAGE } }),
                      new TableCell({ children: [new Paragraph("Disk name")], width: { size: 12, type: WidthType.PERCENTAGE } }),
                      new TableCell({ children: [new Paragraph("Recommended disk size SKU")], width: { size: 20, type: WidthType.PERCENTAGE } }),
                      new TableCell({ children: [new Paragraph("Recommended disk type")], width: { size: 18, type: WidthType.PERCENTAGE } }),
                      new TableCell({ children: [new Paragraph("Source disk size(GB)")], width: { size: 12, type: WidthType.PERCENTAGE } }),
                      new TableCell({ children: [new Paragraph("Target disk size(GB)")], width: { size: 12, type: WidthType.PERCENTAGE } }),
                      new TableCell({ children: [new Paragraph("Monthly cost estimate")], width: { size: 11, type: WidthType.PERCENTAGE } }),
                    ],
                  }),
                  ...diskBreakdownData.rows.map(disk => new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(String(disk.machine ?? ''))] }),
                      new TableCell({ children: [new Paragraph(String(disk.diskName ?? ''))] }),
                      new TableCell({ children: [new Paragraph(String(disk.recommendedDiskSizeSku ?? ''))] }),
                      new TableCell({ children: [new Paragraph(String(disk.recommendedDiskType ?? ''))] }),
                      new TableCell({ children: [new Paragraph(String(disk.sourceDiskSizeGb ?? ''))] }),
                      new TableCell({ children: [new Paragraph(String(disk.targetDiskSizeGb ?? ''))] }),
                      new TableCell({ children: [new Paragraph(`$${(Number(disk.monthlyCostEstimate) || 0).toFixed(2)}`)] }),
                    ],
                  })),
                  // Add Total row
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph("Total Storage Cost")], width: { size: 15, type: WidthType.PERCENTAGE } }),
                      new TableCell({ children: [new Paragraph("")] }),
                      new TableCell({ children: [new Paragraph("")] }),
                      new TableCell({ children: [new Paragraph("")] }),
                      new TableCell({ children: [new Paragraph("")] }),
                      new TableCell({ children: [new Paragraph("")] }),
                      new TableCell({ children: [new Paragraph(`$${diskBreakdownData.totalStorageCost.toFixed(2)}`)] }),
                    ],
                  }),
                ],
              }),
            ],
          },
        ],
      });

      docxBuffer = await Packer.toBuffer(doc);
    }

    // Return the Word document
    return new Response(docxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="assessment-report.docx"',
      },
    });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 