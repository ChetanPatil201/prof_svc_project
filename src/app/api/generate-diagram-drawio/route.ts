import { NextRequest, NextResponse } from 'next/server';

// Simple analysis function for testing
function analyzeMigrateReport(reportData: any) {
  const machines = reportData.assessedMachines || [];
  const disks = reportData.assessedDisks || [];
  
  const totalVMs = machines.length;
  const totalCost = machines.reduce((sum: number, machine: any) => 
    sum + (machine.computeMonthlyCostEstimateUsd || 0), 0) + 
    disks.reduce((sum: number, disk: any) => 
    sum + (disk.monthlyCostEstimate || 0), 0);
  
  return {
    totalVMs,
    totalCost,
    migrationStrategy: totalVMs > 10 ? 'Lift and Shift' : 'Rehost'
  };
}

export async function POST(request: NextRequest) {
  try {
    const { reportData } = await request.json();
    
    if (!reportData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Report data is required' 
      }, { status: 400 });
    }

    // Analyze the migration report
    const summary = analyzeMigrateReport(reportData);
    
    // Calculate workloads
    const workloads = {
      totalVMs: summary.totalVMs,
      totalStorageGB: summary.totalCost * 2,
      webTierVMs: Math.ceil(summary.totalVMs * 0.3),
      appTierVMs: Math.ceil(summary.totalVMs * 0.4),
      dataTierVMs: Math.ceil(summary.totalVMs * 0.2),
      mgmtTierVMs: Math.ceil(summary.totalVMs * 0.1)
    };

    // Generate Draw.io compatible XML
    const drawioXml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2024-01-01T00:00:00.000Z" agent="5.0" etag="xxx" version="22.1.16" type="device">
  <diagram name="Azure Landing Zone Architecture" id="azure-architecture">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        
        <!-- Title -->
        <mxCell id="title" value="Azure Landing Zone Architecture" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=24;fontStyle=1;fontColor=#0078D4;" vertex="1" parent="1">
          <mxGeometry x="400" y="20" width="300" height="40" as="geometry" />
        </mxCell>
        
        <!-- Internet/External -->
        <mxCell id="internet" value="Internet&#xa;External Users" style="ellipse;whiteSpace=wrap;html=1;fillColor=#E3F2FD;strokeColor=#0078D4;fontSize=12;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="50" y="100" width="120" height="80" as="geometry" />
        </mxCell>
        
        <!-- Azure Subscription -->
        <mxCell id="subscription" value="Azure Production Subscription" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#E3F2FD;strokeColor=#0078D4;strokeWidth=2;fontSize=14;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="250" y="80" width="650" height="600" as="geometry" />
        </mxCell>
        
        <!-- Application Gateway -->
        <mxCell id="agw" value="Application Gateway&#xa;WAF Enabled" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#C5CAE9;strokeColor=#0078D4;fontSize=11;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="280" y="120" width="140" height="60" as="geometry" />
        </mxCell>
        
        <!-- Load Balancer -->
        <mxCell id="lb" value="Load Balancer&#xa;Standard SKU" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#E8F5E8;strokeColor=#0078D4;fontSize=11;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="280" y="200" width="140" height="60" as="geometry" />
        </mxCell>
        
        <!-- Web Tier -->
        <mxCell id="webTier" value="Web Tier&#xa;10.0.1.0/24" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#BBDEFB;strokeColor=#0078D4;fontSize=11;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="280" y="280" width="140" height="60" as="geometry" />
        </mxCell>
        
        <!-- Web Servers -->
        <mxCell id="web1" value="Web Server 1&#xa;Standard_D2s_v3" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#BBDEFB;strokeColor=#0078D4;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="300" y="360" width="100" height="50" as="geometry" />
        </mxCell>
        
        <mxCell id="web2" value="Web Server 2&#xa;Standard_D2s_v3" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#BBDEFB;strokeColor=#0078D4;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="420" y="360" width="100" height="50" as="geometry" />
        </mxCell>
        
        <!-- App Tier -->
        <mxCell id="appTier" value="Application Tier&#xa;10.0.2.0/24" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#BBDEFB;strokeColor=#0078D4;fontSize=11;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="600" y="280" width="140" height="60" as="geometry" />
        </mxCell>
        
        <!-- App Servers -->
        <mxCell id="app1" value="App Server 1&#xa;Standard_D4s_v3" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#BBDEFB;strokeColor=#0078D4;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="620" y="360" width="100" height="50" as="geometry" />
        </mxCell>
        
        <mxCell id="app2" value="App Server 2&#xa;Standard_D4s_v3" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#BBDEFB;strokeColor=#0078D4;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="740" y="360" width="100" height="50" as="geometry" />
        </mxCell>
        
        <!-- Data Tier -->
        <mxCell id="dataTier" value="Data Tier&#xa;10.0.3.0/24" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#BBDEFB;strokeColor=#0078D4;fontSize=11;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="440" y="440" width="140" height="60" as="geometry" />
        </mxCell>
        
        <!-- Database -->
        <mxCell id="db" value="Database Server&#xa;Standard_D8s_v3" style="shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#BBDEFB;strokeColor=#0078D4;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="480" y="520" width="60" height="80" as="geometry" />
        </mxCell>
        
        <!-- Management Tier -->
        <mxCell id="mgmtTier" value="Management Tier&#xa;10.0.4.0/24" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#BBDEFB;strokeColor=#0078D4;fontSize=11;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="280" y="520" width="140" height="60" as="geometry" />
        </mxCell>
        
        <!-- Management Server -->
        <mxCell id="mgmt" value="Management Server&#xa;Standard_D2s_v3" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#BBDEFB;strokeColor=#0078D4;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="300" y="600" width="100" height="50" as="geometry" />
        </mxCell>
        
        <!-- Azure Services -->
        <mxCell id="services" value="Azure Services" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F8F9FA;strokeColor=#0078D4;strokeWidth=2;fontSize=12;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="600" y="120" width="280" height="140" as="geometry" />
        </mxCell>
        
        <!-- Key Vault -->
        <mxCell id="kv" value="Key Vault&#xa;Premium SKU" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFCDD2;strokeColor=#0078D4;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="620" y="140" width="80" height="40" as="geometry" />
        </mxCell>
        
        <!-- NSG -->
        <mxCell id="nsg" value="Network Security Group" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFCDD2;strokeColor=#0078D4;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="720" y="140" width="80" height="40" as="geometry" />
        </mxCell>
        
        <!-- Storage -->
        <mxCell id="storage" value="Storage Account&#xa;${workloads.totalStorageGB} GB" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#B2DFDB;strokeColor=#0078D4;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="620" y="190" width="80" height="40" as="geometry" />
        </mxCell>
        
        <!-- Monitor -->
        <mxCell id="monitor" value="Azure Monitor&#xa;Log Analytics" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#E1BEE7;strokeColor=#0078D4;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="720" y="190" width="80" height="40" as="geometry" />
        </mxCell>
        
        <!-- Connections -->
        <mxCell id="conn1" value="HTTPS" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#0078D4;strokeWidth=2;" edge="1" parent="1" source="internet" target="agw">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        
        <mxCell id="conn2" value="HTTP" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#0078D4;strokeWidth=2;" edge="1" parent="1" source="agw" target="lb">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        
        <mxCell id="conn3" value="Load Balance" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#00C851;strokeWidth=2;" edge="1" parent="1" source="lb" target="webTier">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        
        <mxCell id="conn4" value="HTTP/HTTPS" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#0078D4;strokeWidth=2;" edge="1" parent="1" source="webTier" target="appTier">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        
        <mxCell id="conn5" value="Database" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#0078D4;strokeWidth=2;" edge="1" parent="1" source="appTier" target="dataTier">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        
        <!-- Legend -->
        <mxCell id="legend" value="Architecture Legend" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F8F9FA;strokeColor=#0078D4;fontSize=12;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="50" y="300" width="180" height="200" as="geometry" />
        </mxCell>
        
        <mxCell id="legend1" value="🟦 Compute - Virtual Machines" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="60" y="320" width="160" height="20" as="geometry" />
        </mxCell>
        
        <mxCell id="legend2" value="🟩 Network - Load Balancers" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="60" y="340" width="160" height="20" as="geometry" />
        </mxCell>
        
        <mxCell id="legend3" value="🟥 Security - NSG, Key Vault" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="60" y="360" width="160" height="20" as="geometry" />
        </mxCell>
        
        <mxCell id="legend4" value="🟨 Storage - Storage Accounts" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="60" y="380" width="160" height="20" as="geometry" />
        </mxCell>
        
        <mxCell id="legend5" value="🟪 Monitoring - Azure Monitor" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="60" y="400" width="160" height="20" as="geometry" />
        </mxCell>
        
        <mxCell id="legend6" value="🟦 Gateway - App Gateway" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="60" y="420" width="160" height="20" as="geometry" />
        </mxCell>
        
        <mxCell id="legend7" value="🟦 Subscription - Azure Container" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="60" y="440" width="160" height="20" as="geometry" />
        </mxCell>
        
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

    return NextResponse.json({
      success: true,
      drawioXml: drawioXml,
      summary: {
        totalVMs: workloads.totalVMs,
        totalCost: summary.totalCost,
        migrationStrategy: summary.migrationStrategy
      }
    });

  } catch (error) {
    console.error('Error generating Draw.io diagram:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to generate Draw.io diagram' 
    }, { status: 500 });
  }
}
