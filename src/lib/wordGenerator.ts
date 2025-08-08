import { AssessmentReportData, ASSESSMENT_REPORT_TEMPLATE } from '@/types/assessmentReport';

export async function generateAssessmentReport(data: AssessmentReportData): Promise<Blob> {
  // For now, we'll create a simple Word document using a library
  // In a real implementation, you'd use a library like docx or mammoth
  
  const { sections } = ASSESSMENT_REPORT_TEMPLATE;
  
  // Replace placeholders with actual data
  const executiveSummaryContent = sections.executiveSummary.content
    .replace('{totalServers}', data.totalServers.toString())
    .replace('{inScopeServers}', (data.inScopeServers ?? 0).toString())
    .replace('{readinessSummary}', data.readinessSummary)
    .replace('{costAnalysis}', data.costAnalysis)
    .replace('{recommendations}', data.recommendations);

  const cloudDiscoveryContent = sections.cloudDiscovery.content
    .replace('{serverInfrastructure}', data.serverInfrastructure)
    .replace('{osDistribution}', JSON.stringify(data.osDistribution))
    .replace('{vmSummary}', JSON.stringify(data.vmSummary));

  // Cloud Discovery paragraph and Server Scan Summary table
  const cloudDiscoveryParagraph = `The assessed environment consists of <b>${data.totalServers}</b> servers that are discovered by Azure Migrate and <b>${data.inScopeServers ?? 0}</b> servers are in scope for which the assessment report is created. These servers were analyzed in detail to provide sizing recommendations, cost estimations, and readiness for Azure migration.`;

  const serverScanSummaryTable = `
    <h2>Server Scan Summary</h2>
    <table>
      <tr><th>Total No. Of Servers discovered</th><td>${data.totalServers}</td></tr>
      <tr><th>In scope Servers count</th><td>${data.inScopeServers ?? 0}</td></tr>
      <tr><th>Windows Servers</th><td>${data.windowsServers ?? ''}</td></tr>
      <tr><th>Linux Servers</th><td>${data.linuxServers ?? ''}</td></tr>
      <tr><th>Total Storage (TB)</th><td>${data.totalStorageTB ?? ''}</td></tr>
      <tr><th>No. Of Disks (In scope)</th><td>${data.numDisksInScope ?? ''}</td></tr>
    </table>
  `;

  // Create a simple HTML structure that can be converted to Word
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Cloud Assessment Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .page-break { page-break-before: always; }
      </style>
    </head>
    <body>
      <h1>${sections.executiveSummary.title}</h1>
      <div style="white-space: pre-line;">${executiveSummaryContent}</div>
      <div class="page-break"></div>
      <h1>${sections.cloudDiscovery.title}</h1>
      <div style="margin-bottom: 24px;">${cloudDiscoveryParagraph}</div>
      ${serverScanSummaryTable}
      <div style="white-space: pre-line;">${cloudDiscoveryContent}</div>
      <h2>Detailed Server Analysis</h2>
      <table>
        <thead>
          <tr>
            <th>Server Name</th>
            <th>Operating System</th>
            <th>Cores</th>
            <th>Memory (GB)</th>
            <th>Storage (GB)</th>
            <th>Recommended Size</th>
            <th>Monthly Cost (USD)</th>
            <th>Readiness</th>
          </tr>
        </thead>
        <tbody>
          ${data.vmSummary.map(server => `
            <tr>
              <td>${server.vmName}</td>
              <td>${server.operatingSystem}</td>
              <td>${server.cores}</td>
              <td>${server.memoryGB}</td>
              <td>${server.storageGB}</td>
              <td>${server.recommendedSize}</td>
              <td>$${(server.computeMonthlyCostEstimateUsd + server.storageMonthlyCostEstimateUsd).toFixed(2)}</td>
              <td>${server.readiness}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Convert HTML to Word document
  // For now, we'll return a blob that can be downloaded
  // In production, you'd use a proper Word generation library
  const blob = new Blob([htmlContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  
  return blob;
}

export function downloadWordReport(blob: Blob, filename: string = 'assessment-report.docx') {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
} 