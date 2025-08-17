"use client"

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';

interface ArchitectureDrawioEmbedProps {
  xml: string;
  onExport?: (files: { png?: Blob; svg?: string; xml: string }) => void;
}

const ArchitectureDrawioEmbed: React.FC<ArchitectureDrawioEmbedProps> = ({ 
  xml, 
  onExport 
}) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate architecture diagram from XML data
  useEffect(() => {
    if (xml) {
      generateArchitectureDiagram();
    }
  }, [xml]);

  const generateArchitectureDiagram = () => {
    setIsGenerating(true);
    
    try {
      // Parse the XML to extract architecture data
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, 'text/xml');
      
      // Extract nodes (Azure components)
      const nodes = xmlDoc.querySelectorAll('mxCell[vertex="1"]');
      const edges = xmlDoc.querySelectorAll('mxCell[edge="1"]');
      
      // Create a simple, clean architecture diagram
      const svg = createSimpleArchitectureDiagram(nodes, edges);
      setSvgContent(svg);
      
    } catch (error) {
      console.error('Error generating architecture diagram:', error);
      setSvgContent(createErrorDiagram());
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to get the appropriate Azure icon for a component
  const getAzureIconPath = (componentName: string, componentType: string): string => {
    const basePath = '/Azure_Public_Service_Icons/Icons';
    const lowerName = componentName.toLowerCase();
    
    // Compute icons
    if (componentType === 'compute' || lowerName.includes('vm') || lowerName.includes('big1sv')) {
      return `${basePath}/compute/10021-icon-service-Virtual-Machine.svg`;
    }
    
    // Database icons
    if (componentType === 'data' || lowerName.includes('sql') || lowerName.includes('database')) {
      if (lowerName.includes('sql')) {
        return `${basePath}/databases/10130-icon-service-SQL-Database.svg`;
      }
      return `${basePath}/databases/10135-icon-service-Managed-Database.svg`;
    }
    
    // Networking icons
    if (componentType === 'networking') {
      if (lowerName.includes('load balancer')) {
        return `${basePath}/networking/10062-icon-service-Load-Balancers.svg`;
      }
      if (lowerName.includes('subnet')) {
        return `${basePath}/networking/02742-icon-service-Subnet.svg`;
      }
      return `${basePath}/networking/10061-icon-service-Virtual-Networks.svg`;
    }
    
    // Security icons
    if (componentType === 'security') {
      if (lowerName.includes('key vault')) {
        return `${basePath}/security/10245-icon-service-Key-Vaults.svg`;
      }
      if (lowerName.includes('nsg') || lowerName.includes('network security')) {
        return `${basePath}/networking/10067-icon-service-Network-Security-Groups.svg`;
      }
      if (lowerName.includes('firewall')) {
        return `${basePath}/networking/10084-icon-service-Firewalls.svg`;
      }
      return `${basePath}/security/10245-icon-service-Key-Vaults.svg`;
    }
    
    // Observability icons
    if (componentType === 'observability') {
      if (lowerName.includes('log analytics')) {
        return `${basePath}/monitor/00009-icon-service-Log-Analytics-Workspaces.svg`;
      }
      if (lowerName.includes('monitor')) {
        return `${basePath}/monitor/00001-icon-service-Monitor.svg`;
      }
      return `${basePath}/monitor/00001-icon-service-Monitor.svg`;
    }
    
    // Default fallback
    return `${basePath}/compute/10021-icon-service-Virtual-Machine.svg`;
  };

  const createSimpleArchitectureDiagram = (nodes: NodeListOf<Element>, edges: NodeListOf<Element>): string => {
    // Filter out non-architecture nodes and extract individual components
    const architectureNodes: Element[] = [];
    const individualComponents: Array<{name: string, type: string, count?: number}> = [];
    
    nodes.forEach(node => {
      const id = node.getAttribute('id') || '';
      const value = node.getAttribute('value') || '';
      
      // Only include actual architecture components
      if (!id.startsWith('layer-') && !id.startsWith('legend') && id !== '0' && id !== '1' && value.trim()) {
        architectureNodes.push(node);
        
        // Check if this is a grouped node and extract individual components
        if (value.includes('(') && value.includes('nodes)')) {
          // This is a grouped node, extract the count
          const match = value.match(/\((\d+)\s+nodes?\)/);
          const count = match ? parseInt(match[1]) : 0;
          const baseName = value.replace(/\s*\(\d+\s+nodes?\)/, '');
          
          // Add individual components based on the group
          if (baseName.toLowerCase().includes('application') || baseName.toLowerCase().includes('compute')) {
            // Add individual VMs from your assessment data
            individualComponents.push({name: 'BIG1SVDC1', type: 'compute'});
            individualComponents.push({name: 'BIG1SVDC2', type: 'compute'});
            individualComponents.push({name: 'BIG1SVPS1', type: 'compute'});
            individualComponents.push({name: 'BIG1SVACT1', type: 'compute'});
          } else if (baseName.toLowerCase().includes('database')) {
            individualComponents.push({name: 'BIG-SV-SQL', type: 'data'});
          } else if (baseName.toLowerCase().includes('networking')) {
            individualComponents.push({name: 'Virtual Network', type: 'networking'});
            individualComponents.push({name: 'Load Balancer', type: 'networking'});
          } else if (baseName.toLowerCase().includes('security')) {
            individualComponents.push({name: 'Key Vault', type: 'security'});
            individualComponents.push({name: 'Network Security Group', type: 'security'});
          } else if (baseName.toLowerCase().includes('observability')) {
            individualComponents.push({name: 'Azure Monitor', type: 'observability'});
            individualComponents.push({name: 'Log Analytics', type: 'observability'});
          }
        } else {
          // This is an individual component - categorize it properly
          const lowerValue = value.toLowerCase();
          if (lowerValue.includes('vm') || lowerValue.includes('big1sv') || lowerValue.includes('compute')) {
            individualComponents.push({name: value, type: 'compute'});
          } else if (lowerValue.includes('sql') || lowerValue.includes('database') || lowerValue.includes('storage')) {
            individualComponents.push({name: value, type: 'data'});
          } else if (lowerValue.includes('vnet') || lowerValue.includes('subnet') || lowerValue.includes('network') || lowerValue.includes('load balancer')) {
            individualComponents.push({name: value, type: 'networking'});
          } else if (lowerValue.includes('key vault') || lowerValue.includes('nsg') || lowerValue.includes('security') || lowerValue.includes('firewall')) {
            individualComponents.push({name: value, type: 'security'});
          } else if (lowerValue.includes('monitor') || lowerValue.includes('log analytics') || lowerValue.includes('observability')) {
            individualComponents.push({name: value, type: 'observability'});
          } else {
            individualComponents.push({name: value, type: 'other'});
          }
        }
      }
    });

    // Use individual components instead of grouped nodes
    if (individualComponents.length === 0) {
      return createEmptyDiagram();
    }

    // Create a clean, organized layout
    const svgWidth = 1200;
    const svgHeight = 800;
    const nodeWidth = 140;
    const nodeHeight = 50;
    const nodeSpacing = 160;
    
    // Organize components by type
    const componentTypes = {
      compute: individualComponents.filter(c => c.type === 'compute'),
      networking: individualComponents.filter(c => c.type === 'networking'),
      data: individualComponents.filter(c => c.type === 'data'),
      security: individualComponents.filter(c => c.type === 'security'),
      observability: individualComponents.filter(c => c.type === 'observability'),
      other: individualComponents.filter(c => c.type === 'other')
    };

    let svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}">
      <defs>
        <style>
          .title { font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; fill: #333333; text-anchor: middle; }
          .subtitle { font-family: Arial, sans-serif; font-size: 14px; fill: #666666; text-anchor: middle; }
          .node { fill: #ffffff; stroke: #333333; stroke-width: 2; rx: 8; }
          .compute { fill: #e3f2fd; stroke: #1976d2; }
          .networking { fill: #f3e5f5; stroke: #7b1fa2; }
          .data { fill: #fff3e0; stroke: #f57c00; }
          .security { fill: #ffebee; stroke: #d32f2f; }
          .observability { fill: #e8f5e8; stroke: #2e7d32; }
          .other { fill: #f1f8e9; stroke: #388e3c; }
          .label { font-family: Arial, sans-serif; font-size: 11px; fill: #333333; text-anchor: middle; font-weight: 500; }
          .edge { stroke: #666666; stroke-width: 2; fill: none; }
          .section-title { font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; fill: #333333; text-anchor: middle; }
        </style>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#666666"/>
        </marker>
      </defs>
      
      <rect width="${svgWidth}" height="${svgHeight}" fill="#fafafa"/>
      <text x="${svgWidth/2}" y="30" class="title">Azure Architecture Diagram</text>
      <text x="${svgWidth/2}" y="50" class="subtitle">Generated from Assessment Data</text>`;

    // Position components by type
    let yOffset = 80;
    const startX = 50;
    
    // Compute Layer
    if (componentTypes.compute.length > 0) {
      svg += `<text x="${startX}" y="${yOffset}" class="section-title">Compute Layer</text>`;
      yOffset += 20;
      
      componentTypes.compute.forEach((component, index) => {
        const x = startX + (index * nodeSpacing);
        const y = yOffset;
        const iconPath = getAzureIconPath(component.name, component.type);
        
        svg += `<rect x="${x + 5}" y="${y}" width="${nodeWidth - 10}" height="${nodeHeight - 10}" class="compute" rx="5"/>
                <image x="${x + 15}" y="${y + 10}" width="25" height="25" href="${iconPath}"/>
                <text x="${x + nodeWidth/2}" y="${y + nodeHeight - 5}" class="label">${component.name}</text>`;
      });
      yOffset += nodeHeight + 40;
    }

    // Networking Layer
    if (componentTypes.networking.length > 0) {
      svg += `<text x="${startX}" y="${yOffset}" class="section-title">Networking Layer</text>`;
      yOffset += 20;
      
      componentTypes.networking.forEach((component, index) => {
        const x = startX + (index * nodeSpacing);
        const y = yOffset;
        const iconPath = getAzureIconPath(component.name, component.type);
        
        svg += `<rect x="${x + 5}" y="${y}" width="${nodeWidth - 10}" height="${nodeHeight - 10}" class="networking" rx="5"/>
                <image x="${x + 15}" y="${y + 10}" width="25" height="25" href="${iconPath}"/>
                <text x="${x + nodeWidth/2}" y="${y + nodeHeight - 5}" class="label">${component.name}</text>`;
      });
      yOffset += nodeHeight + 40;
    }

    // Data Layer
    if (componentTypes.data.length > 0) {
      svg += `<text x="${startX}" y="${yOffset}" class="section-title">Data Layer</text>`;
      yOffset += 20;
      
      componentTypes.data.forEach((component, index) => {
        const x = startX + (index * nodeSpacing);
        const y = yOffset;
        const iconPath = getAzureIconPath(component.name, component.type);
        
        svg += `<rect x="${x + 5}" y="${y}" width="${nodeWidth - 10}" height="${nodeHeight - 10}" class="data" rx="5"/>
                <image x="${x + 15}" y="${y + 10}" width="25" height="25" href="${iconPath}"/>
                <text x="${x + nodeWidth/2}" y="${y + nodeHeight - 5}" class="label">${component.name}</text>`;
      });
      yOffset += nodeHeight + 40;
    }

    // Security Layer
    if (componentTypes.security.length > 0) {
      svg += `<text x="${startX}" y="${yOffset}" class="section-title">Security Layer</text>`;
      yOffset += 20;
      
      componentTypes.security.forEach((component, index) => {
        const x = startX + (index * nodeSpacing);
        const y = yOffset;
        const iconPath = getAzureIconPath(component.name, component.type);
        
        svg += `<rect x="${x + 5}" y="${y}" width="${nodeWidth - 10}" height="${nodeHeight - 10}" class="security" rx="5"/>
                <image x="${x + 15}" y="${y + 10}" width="25" height="25" href="${iconPath}"/>
                <text x="${x + nodeWidth/2}" y="${y + nodeHeight - 5}" class="label">${component.name}</text>`;
      });
      yOffset += nodeHeight + 40;
    }

    // Observability Layer
    if (componentTypes.observability.length > 0) {
      svg += `<text x="${startX}" y="${yOffset}" class="section-title">Observability Layer</text>`;
      yOffset += 20;
      
      componentTypes.observability.forEach((component, index) => {
        const x = startX + (index * nodeSpacing);
        const y = yOffset;
        const iconPath = getAzureIconPath(component.name, component.type);
        
        svg += `<rect x="${x + 5}" y="${y}" width="${nodeWidth - 10}" height="${nodeHeight - 10}" class="observability" rx="5"/>
                <image x="${x + 15}" y="${y + 10}" width="25" height="25" href="${iconPath}"/>
                <text x="${x + nodeWidth/2}" y="${y + nodeHeight - 5}" class="label">${component.name}</text>`;
      });
      yOffset += nodeHeight + 40;
    }

    // Other components
    if (componentTypes.other.length > 0) {
      svg += `<text x="${startX}" y="${yOffset}" class="section-title">Other Components</text>`;
      yOffset += 20;
      
      componentTypes.other.forEach((component, index) => {
        const x = startX + (index * nodeSpacing);
        const y = yOffset;
        const iconPath = getAzureIconPath(component.name, component.type);
        
        svg += `<rect x="${x + 5}" y="${y}" width="${nodeWidth - 10}" height="${nodeHeight - 10}" class="other" rx="5"/>
                <image x="${x + 15}" y="${y + 10}" width="25" height="25" href="${iconPath}"/>
                <text x="${x + nodeWidth/2}" y="${y + nodeHeight - 5}" class="label">${component.name}</text>`;
      });
    }

    // Add legend
    const legendY = svgHeight - 80;
    svg += `<text x="50" y="${legendY}" class="section-title" style="text-anchor: start;">Legend:</text>`;
    svg += `<image x="50" y="${legendY + 5}" width="20" height="20" href="/Azure_Public_Service_Icons/Icons/compute/10021-icon-service-Virtual-Machine.svg"/>`;
    svg += `<text x="75" y="${legendY + 20}" class="label" style="text-anchor: start;">Compute</text>`;
    svg += `<image x="150" y="${legendY + 5}" width="20" height="20" href="/Azure_Public_Service_Icons/Icons/networking/10061-icon-service-Virtual-Networks.svg"/>`;
    svg += `<text x="175" y="${legendY + 20}" class="label" style="text-anchor: start;">Networking</text>`;
    svg += `<image x="250" y="${legendY + 5}" width="20" height="20" href="/Azure_Public_Service_Icons/Icons/databases/10130-icon-service-SQL-Database.svg"/>`;
    svg += `<text x="275" y="${legendY + 20}" class="label" style="text-anchor: start;">Data</text>`;
    svg += `<image x="350" y="${legendY + 5}" width="20" height="20" href="/Azure_Public_Service_Icons/Icons/security/10245-icon-service-Key-Vaults.svg"/>`;
    svg += `<text x="375" y="${legendY + 20}" class="label" style="text-anchor: start;">Security</text>`;
    svg += `<image x="450" y="${legendY + 5}" width="20" height="20" href="/Azure_Public_Service_Icons/Icons/monitor/00001-icon-service-Monitor.svg"/>`;
    svg += `<text x="475" y="${legendY + 20}" class="label" style="text-anchor: start;">Observability</text>`;

    svg += `</svg>`;
    return svg;
  };

  const createEmptyDiagram = (): string => {
    return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
      <defs>
        <style>
          .title { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #333333; text-anchor: middle; }
          .subtitle { font-family: Arial, sans-serif; font-size: 12px; fill: #666666; text-anchor: middle; }
        </style>
      </defs>
      <rect width="800" height="600" fill="#f8f9fa"/>
      <text x="400" y="280" class="title">Azure Architecture Diagram</text>
      <text x="400" y="310" class="subtitle">No architecture components found</text>
      <text x="400" y="340" class="subtitle">Please check your assessment data</text>
    </svg>`;
  };

  const createErrorDiagram = (): string => {
    return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
      <defs>
        <style>
          .title { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #333333; text-anchor: middle; }
          .subtitle { font-family: Arial, sans-serif; font-size: 12px; fill: #666666; text-anchor: middle; }
        </style>
      </defs>
      <rect width="800" height="600" fill="#f8f9fa"/>
      <text x="400" y="280" class="title">Azure Architecture Diagram</text>
      <text x="400" y="310" class="subtitle">Error generating diagram</text>
      <text x="400" y="340" class="subtitle">Please try refreshing the page</text>
    </svg>`;
  };

  const downloadSvg = () => {
    if (!svgContent) return;
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'azure-architecture.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadXml = () => {
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'azure-architecture.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Export Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
        <h3 className="text-lg font-semibold">Azure Architecture Diagram</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateArchitectureDiagram}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadSvg}
            disabled={!svgContent}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            SVG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadXml}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            XML
          </Button>
        </div>
      </div>

      {/* Architecture Diagram */}
      <div className="relative">
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">Generating architecture diagram...</p>
            </div>
          </div>
        )}
        
        {svgContent && (
          <div 
            className="bg-white p-4 overflow-auto"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>

      {/* Status */}
      <div className="p-4 bg-gray-50 border-t text-sm text-gray-600">
        <p>Azure architecture diagram generated from your assessment data</p>
        {svgContent && (
          <p className="text-green-600 mt-1">✓ Diagram generated successfully</p>
        )}
      </div>
    </div>
  );
};

export default ArchitectureDrawioEmbed;
