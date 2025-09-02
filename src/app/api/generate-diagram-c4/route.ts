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
      totalStorageGB: summary.totalCost * 2, // Estimate storage based on cost
      webTierVMs: Math.ceil(summary.totalVMs * 0.3),
      appTierVMs: Math.ceil(summary.totalVMs * 0.4),
      dataTierVMs: Math.ceil(summary.totalVMs * 0.2),
      mgmtTierVMs: Math.ceil(summary.totalVMs * 0.1)
    };

    // Generate C4 Level 1 - System Context Diagram
    const c4Level1 = `@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml

LAYOUT_WITH_LEGEND()

title **System Context Diagram - Azure Landing Zone**

Person(user, "External User", "Users accessing the application")

System_Boundary(azure, "Azure Cloud") {
    System(webApp, "Web Application", "Multi-tier web application")
    System(db, "Database", "Application database")
    System(storage, "Storage", "File and data storage")
}

System_Ext(monitoring, "Azure Monitor", "Monitoring and logging")

Rel(user, webApp, "Uses", "HTTPS")
Rel(webApp, db, "Reads/Writes data")
Rel(webApp, storage, "Stores files")
Rel(webApp, monitoring, "Sends metrics")

@enduml`;

    // Generate C4 Level 2 - Container Diagram
    const c4Level2 = `@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

LAYOUT_WITH_LEGEND()

title **Container Diagram - Azure Landing Zone Architecture**

Person(user, "External User", "Users accessing the application")

System_Boundary(azure, "Azure Production Subscription") {
    Container_Boundary(webTier, "Web Tier (10.0.1.0/24)") {
        Container(web1, "Web Server 1", "IIS/Apache", "Serves web pages")
        Container(web2, "Web Server 2", "IIS/Apache", "Serves web pages")
    }
    
    Container_Boundary(appTier, "Application Tier (10.0.2.0/24)") {
        Container(app1, "App Server 1", "Application Server", "Business logic")
        Container(app2, "App Server 2", "Application Server", "Business logic")
    }
    
    Container_Boundary(dataTier, "Data Tier (10.0.3.0/24)") {
        ContainerDb(db, "Database Server", "SQL Server", "Stores application data")
    }
    
    Container_Boundary(mgmtTier, "Management Tier (10.0.4.0/24)") {
        Container(mgmt, "Management Server", "Management Tools", "Administrative access")
    }
    
    Container_Boundary(services, "Azure Services") {
        Container(agw, "Application Gateway", "WAF", "Web traffic management")
        Container(lb, "Load Balancer", "Azure LB", "Traffic distribution")
        Container(nsg, "Network Security Group", "NSG", "Network security rules")
        Container(kv, "Key Vault", "Azure Key Vault", "Secrets management")
        Container(monitor, "Azure Monitor", "Monitoring", "Logs and metrics")
        Container(storage, "Storage Account", "Azure Storage", "File storage")
    }
}

Rel(user, agw, "HTTPS", "Port 443")
Rel(agw, lb, "HTTP", "Port 80")
Rel(lb, web1, "HTTP", "Port 80")
Rel(lb, web2, "HTTP", "Port 80")

Rel(web1, app1, "HTTP", "Port 8080")
Rel(web2, app2, "HTTP", "Port 8080")
Rel(app1, db, "SQL", "Port 1433")
Rel(app2, db, "SQL", "Port 1433")

Rel(mgmt, web1, "SSH/RDP", "Management")
Rel(mgmt, web2, "SSH/RDP", "Management")
Rel(mgmt, app1, "SSH/RDP", "Management")
Rel(mgmt, app2, "SSH/RDP", "Management")
Rel(mgmt, db, "SSH/RDP", "Management")

Rel(app1, kv, "API", "Secrets")
Rel(app2, kv, "API", "Secrets")
Rel(db, storage, "API", "Backup")

Rel(web1, monitor, "API", "Metrics")
Rel(web2, monitor, "API", "Metrics")
Rel(app1, monitor, "API", "Metrics")
Rel(app2, monitor, "API", "Metrics")
Rel(db, monitor, "API", "Metrics")

@enduml`;

    // Generate C4 Level 3 - Component Diagram
    const c4Level3 = `@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Component.puml

LAYOUT_WITH_LEGEND()

title **Component Diagram - Web Application Architecture"

Container_Boundary(webApp, "Web Application") {
    Component(webController, "Web Controller", "ASP.NET MVC", "Handles HTTP requests")
    Component(authService, "Authentication Service", "Identity Server", "User authentication")
    Component(businessLogic, "Business Logic", "Service Layer", "Application business rules")
    Component(dataAccess, "Data Access Layer", "Entity Framework", "Database access")
}

ContainerDb(database, "Database", "SQL Server", "Application data")

System_Ext(externalAuth, "External Auth Provider", "OAuth/AD")

Rel(webController, authService, "Uses", "API")
Rel(webController, businessLogic, "Uses", "Service calls")
Rel(businessLogic, dataAccess, "Uses", "Repository pattern")
Rel(dataAccess, database, "Reads/Writes", "SQL")
Rel(authService, externalAuth, "Validates", "OAuth")

@enduml`;

    return NextResponse.json({
      success: true,
      diagrams: {
        level1: c4Level1,
        level2: c4Level2,
        level3: c4Level3
      },
      summary: {
        totalVMs: workloads.totalVMs,
        totalCost: summary.totalCost,
        migrationStrategy: summary.migrationStrategy
      }
    });

  } catch (error) {
    console.error('Error generating C4 diagram:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to generate C4 diagram' 
    }, { status: 500 });
  }
}
