# Microsoft Word Template Structure for Azure Assessment Report

## Instructions for Creating the Word Template:

1. Open Microsoft Word
2. Create a new document
3. Copy and paste the content below
4. Format with your company's branding and styles
5. Save as a .docx file
6. Upload this template in the assessment form

---

## Template Content:

### Page 1: Title Page
```
[Your Company Logo]

AZURE CLOUD MIGRATION ASSESSMENT REPORT

Client: {{companyName}}
Assessment Date: {{assessmentDate}}
Report Generated: {{generatedDate}}
Region: {{targetRegion}}

[Page Break]
```

### Page 2: Executive Summary
```
1. EXECUTIVE SUMMARY – CLOUD DISCOVERY AND ASSESSMENT

This executive summary provides a comprehensive overview of the cloud discovery and assessment initiative undertaken for {{companyName}}. The assessment was conducted using Azure Migrate to evaluate the current on-premises infrastructure and determine cloud readiness for migration to Microsoft Azure.

KEY FINDINGS:
• Total servers discovered: {{totalServers}}
• Servers in scope for migration: {{inScopeServersCount}}
• Cloud readiness assessment completed
• Cost optimization opportunities identified
• Migration strategy recommendations developed

{{readinessSummary}}

{{costAnalysis}}

{{recommendations}}

[Page Break]
```

### Page 3: Cost Comparison Table
```
3. TOTAL AZURE COST PER MONTH

The following table provides a comprehensive cost comparison across different Azure pricing models:

[Insert Table with 5 columns and 4 rows]

| Pricing Plan | Config Match | Recurring/Month - Compute | Recurring/Month - Storage | Total Azure Cost Per Month |
|--------------|--------------|---------------------------|---------------------------|---------------------------|
| On-demand | PAYG | ${{payAsYouGoCompute}} | ${{payAsYouGoStorage}} | ${{payAsYouGoTotal}} |
| Reserved Instance (1-Year) | 1-Year | ${{reservedInstance1YrCompute}} | ${{reservedInstance1YrStorage}} | ${{reservedInstance1YrTotal}} |
| Reserved Instance (3-Year) | 3-Year | ${{reservedInstance3YrCompute}} | ${{reservedInstance3YrStorage}} | ${{reservedInstance3YrTotal}} |

COST OPTIMIZATION SUMMARY:
• Total Monthly Savings with 1-Year RI: ${{reservedInstance1YrSavings}}
• Total Monthly Savings with 3-Year RI: ${{reservedInstance3YrSavings}}
• Recommended Pricing Model: {{recommendedPricingModel}}

[Page Break]
```

### Page 4: Server Scan Summary
```
4. SERVER SCAN SUMMARY

[Insert Table with 2 columns and 6 rows]

| Metric | Value |
|--------|-------|
| Total No. Of Servers discovered | {{totalServers}} |
| In scope Servers count | {{inScopeServersCount}} |
| Windows Servers | {{windowsServers}} |
| Linux Servers | {{linuxServers}} |
| Total Storage (TB) | {{totalStorageTB}} |
| No. Of Disks (In scope) | {{numDisksInScope}} |

[Page Break]
```

### Page 5: VM Recommendations
```
5. VM INSTANCE SIZE RECOMMENDATION (Performance based – Right Sized)

[Insert Table with 7 columns and dynamic rows]

| Server Name | Cores | Memory (GB) | CPU usage (%) | Memory usage (%) | Recommended size | Monthly Cost |
|-------------|-------|-------------|---------------|------------------|------------------|--------------|
{{#serverTable}}
| {{name}} | {{cores}} | {{memory}} | {{cpuUsage}} | {{memoryUsage}} | {{recommendedSize}} | {{monthlyCost}} |
{{/serverTable}}

[Page Break]
```

### Page 6: Cloud Readiness
```
6. CLOUD READINESS ANALYSIS AND PLAN

[Insert Table with 4 columns and dynamic rows]

| Machine | Operating System | VM Readiness | Azure Plan |
|---------|------------------|--------------|------------|
{{#cloudReadiness}}
| {{machine}} | {{operatingSystem}} | {{vmReadiness}} | {{azurePlan}} |
{{/cloudReadiness}}

[Page Break]
```

### Page 7: Detailed Analysis
```
7. DETAILED SERVER ANALYSIS

IN-SCOPE SERVERS:
{{#inScopeServers}}
• {{machine}}: {{operatingSystem}} | Cores: {{cores}} | Memory: {{memoryMb}} MB | Storage: {{storageGb}} GB
{{/inScopeServers}}

OPERATING SYSTEM DISTRIBUTION:
{{#osDistributionTable}}
• {{os}}: {{count}} servers
{{/osDistributionTable}}

[Page Break]
```

### Page 8: Recommendations
```
8. RECOMMENDATIONS AND NEXT STEPS

MIGRATION STRATEGY:
1. Phase 1: Migrate {{phase1Servers}} servers with high readiness scores
2. Phase 2: Address compatibility issues for {{phase2Servers}} servers
3. Phase 3: Optimize and right-size remaining workloads

COST OPTIMIZATION RECOMMENDATIONS:
• Consider Reserved Instances for long-term workloads
• Implement Azure Hybrid Benefit for eligible Windows Server licenses
• Use Azure Spot Instances for non-critical workloads
• Optimize storage tiers based on access patterns

RISK MITIGATION:
• Implement comprehensive backup and disaster recovery
• Establish monitoring and alerting for migrated workloads
• Plan for network connectivity and security requirements
• Consider application dependencies and migration order

---

Report Generated: {{generatedDate}}
Assessment Tool: Azure Migrate
Region: {{targetRegion}}
Total Estimated Monthly Cost: ${{totalMonthlyCost}}
```

## Important Notes:

1. **Table Formatting**: Use Word's table feature to create properly formatted tables
2. **Placeholders**: The {{placeholder}} text will be replaced with actual data
3. **Loop Placeholders**: {{#sectionName}} and {{/sectionName}} create loops for dynamic content
4. **Styling**: Apply your company's fonts, colors, and formatting
5. **Headers/Footers**: Add page numbers and company branding
6. **Sections**: Use Word's section breaks for proper page layout

## Available Placeholders:

### Basic Information:
- {{companyName}} - Client company name
- {{assessmentDate}} - Date of assessment
- {{generatedDate}} - Report generation date
- {{targetRegion}} - Azure target region

### Server Counts:
- {{totalServers}} - Total servers discovered
- {{inScopeServersCount}} - Servers in scope for migration
- {{windowsServers}} - Number of Windows servers
- {{linuxServers}} - Number of Linux servers
- {{totalStorageTB}} - Total storage in TB
- {{numDisksInScope}} - Number of disks in scope

### Cost Data:
- {{payAsYouGoCompute}} - Pay-as-you-go compute cost
- {{payAsYouGoStorage}} - Pay-as-you-go storage cost
- {{payAsYouGoTotal}} - Pay-as-you-go total cost
- {{reservedInstance1YrCompute}} - 1-Year RI compute cost
- {{reservedInstance1YrStorage}} - 1-Year RI storage cost
- {{reservedInstance1YrTotal}} - 1-Year RI total cost
- {{reservedInstance3YrCompute}} - 3-Year RI compute cost
- {{reservedInstance3YrStorage}} - 3-Year RI storage cost
- {{reservedInstance3YrTotal}} - 3-Year RI total cost

### Analysis Text:
- {{readinessSummary}} - Cloud readiness summary
- {{costAnalysis}} - Cost analysis text
- {{recommendations}} - Recommendations text
- {{serverInfrastructure}} - Server infrastructure description
- {{osDistribution}} - OS distribution text
- {{vmSummary}} - VM summary text

### Dynamic Tables:
- {{#serverTable}}...{{/serverTable}} - Server recommendations table
- {{#cloudReadiness}}...{{/cloudReadiness}} - Cloud readiness table
- {{#inScopeServers}}...{{/inScopeServers}} - In-scope servers list
- {{#osDistributionTable}}...{{/osDistributionTable}} - OS distribution table 