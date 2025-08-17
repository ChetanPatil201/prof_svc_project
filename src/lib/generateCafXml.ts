import { RefHubSpokeBuilder } from './refHubSpokeBuilder';
import { applyRefHubSpokeLayout } from './refHubSpokeLayout';
import { cafArchitectureToDrawioXml } from './cafDrawioGenerator';

// Sample assessment data for testing
const sampleAssessment = {
  totalServers: 15,
  targetRegion: 'eastus',
  windowsServers: 10,
  linuxServers: 5,
  totalStorageTB: 2.5,
  vmSummary: [
    { vmName: 'web-prod-01', recommendedSize: 'Standard_D2s_v3' },
    { vmName: 'web-prod-02', recommendedSize: 'Standard_D2s_v3' },
    { vmName: 'app-prod-01', recommendedSize: 'Standard_D4s_v3' },
    { vmName: 'app-prod-02', recommendedSize: 'Standard_D4s_v3' },
    { vmName: 'db-prod-01', recommendedSize: 'Standard_D8s_v3' },
    { vmName: 'web-dev-01', recommendedSize: 'Standard_D2s_v3' },
    { vmName: 'app-dev-01', recommendedSize: 'Standard_D2s_v3' },
    { vmName: 'db-dev-01', recommendedSize: 'Standard_D4s_v3' }
  ]
};

export function generateCafXml(): string {
  console.log('🔍 [GenerateCAFXML] Starting CAF XML generation...');

  try {
    // Build reference Hub-Spoke architecture model
    const refHubSpokeBuilder = new RefHubSpokeBuilder({
      showNonProd: true,
      includeAppGateway: true,
      includeVPNGateway: false,
      includeExpressRoute: false,
      includeRouteServer: true,
      includePrivateEndpoints: true,
      includeObservability: true,
      includeKeyVault: true,
      includeLoadBalancer: true,
      hubAddressSpace: '10.0.0.0/16',
      prodSpokeAddressSpace: '10.1.0.0/16',
      nonProdSpokeAddressSpace: '10.2.0.0/16'
    });

    const model = refHubSpokeBuilder.buildFromAssessment(sampleAssessment);
    
    // Apply reference Hub-Spoke layout with parent-relative geometry
    const layoutModel = applyRefHubSpokeLayout(model, {
      nodeWidth: 120,
      nodeHeight: 70,
      columnSpacing: 220,
      rowSpacing: 120,
      containerPadding: 20,
      containerMargin: 30
    });
    
    // Generate CAF Draw.io XML with parent-relative geometry
    const xml = cafArchitectureToDrawioXml(layoutModel, {
      showLegend: true,
      nodeWidth: 120,
      nodeHeight: 70,
      containerPadding: 20
    });
    
    console.log('✅ [GenerateCAFXML] CAF XML generated successfully');
    return xml;
  } catch (error) {
    console.error('❌ [GenerateCAFXML] Error generating CAF XML:', error);
    throw error;
  }
}

// Browser-compatible function to download XML (optional)
export function downloadCafXml(xml: string, filename: string = 'azure-architecture.xml'): void {
  try {
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`✅ [GenerateCAFXML] XML downloaded as: ${filename}`);
  } catch (error) {
    console.error('❌ [GenerateCAFXML] Error downloading XML file:', error);
    throw error;
  }
}
