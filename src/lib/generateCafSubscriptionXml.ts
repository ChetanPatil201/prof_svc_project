import { CafSubscriptionBuilder } from './cafSubscriptionBuilder';
import { applyCafSubscriptionLayout } from './cafSubscriptionLayout';
import { exportToDrawioXml } from './drawioExporter';

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

export function buildCafSubscriptionsModel(assessment: any): any {
  console.log('🔍 [CafSubscriptionGenerator] Building CAF subscription model from assessment...');

  try {
    // Build CAF subscription architecture model
    const cafSubscriptionBuilder = new CafSubscriptionBuilder({
      includeNonProd: true,
      includeObservability: true,
      includePolicy: true,
      includeDefender: true,
      includeBastion: true,
      includeFirewall: true,
      includeLoadBalancer: false,
      hubAddressSpace: '10.0.0.0/16',
      prodSpokeAddressSpace: '10.1.0.0/16',
      nonProdSpokeAddressSpace: '10.2.0.0/16'
    });

    const model = cafSubscriptionBuilder.buildFromAssessment(assessment);
    
    console.log('✅ [CafSubscriptionGenerator] CAF subscription model built successfully:', {
      nodes: model.nodes.length,
      edges: model.edges.length,
      nodeTypes: model.nodes.map(n => n.entityType).filter((v, i, a) => a.indexOf(v) === i)
    });

    return model;
  } catch (error) {
    console.error('❌ [CafSubscriptionGenerator] Error building CAF subscription model:', error);
    throw error;
  }
}

export function generateCafSubscriptionXml(assessment?: any): string {
  console.log('🔍 [CafSubscriptionGenerator] Starting CAF subscription XML generation...');

  try {
    // Use provided assessment or sample data
    const assessmentData = assessment || sampleAssessment;
    
    // Build CAF subscription model
    const model = buildCafSubscriptionsModel(assessmentData);
    
    // Apply CAF subscription layout with parent-relative geometry
    const layoutModel = applyCafSubscriptionLayout(model, {
      nodeWidth: 180,
      nodeHeight: 90,
      columnSpacing: 300,
      rowSpacing: 150,
      containerPadding: 20,
      containerMargin: 30
    });
    
    console.log('✅ [CafSubscriptionGenerator] CAF subscription layout applied');
    
    // Export to Draw.io XML
    const xml = exportToDrawioXml(layoutModel, {
      showLegend: true,
      nodeWidth: 180,
      nodeHeight: 90,
      containerPadding: 20
    });
    
    console.log('✅ [CafSubscriptionGenerator] CAF subscription XML generated successfully, length:', xml.length);
    return xml;
  } catch (error) {
    console.error('❌ [CafSubscriptionGenerator] Error generating CAF subscription XML:', error);
    throw error;
  }
}

// Browser-compatible function to download XML
export function downloadCafSubscriptionXml(xml: string, filename: string = 'caf-subscription-architecture.xml'): void {
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
    console.log(`✅ [CafSubscriptionGenerator] XML downloaded as: ${filename}`);
  } catch (error) {
    console.error('❌ [CafSubscriptionGenerator] Error downloading XML file:', error);
    throw error;
  }
}
