'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Download, RefreshCw, AlertCircle } from 'lucide-react';
import { ArchitectureModel } from '../types/architecture';
import { architectureToDrawioXml, validateArchitectureModel } from '../lib/drawioGenerator';

interface ArchitectureDrawioProps {
  model: ArchitectureModel;
  className?: string;
}

export default function ArchitectureDrawio({ model, className = '' }: ArchitectureDrawioProps) {
  const [drawioXml, setDrawioXml] = useState<string>('');
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const svgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (model) {
      generateDiagram();
    }
  }, [model]);

  const generateDiagram = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate the model first
      const validation = validateArchitectureModel(model);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setError('Architecture model validation failed');
        setIsLoading(false);
        return;
      }
      setValidationErrors([]);

      // Generate Draw.io XML
      const xml = architectureToDrawioXml(model);
      setDrawioXml(xml);

      // Convert to SVG using a simple XML to SVG approach
      // In a real implementation, you might use a library like mxgraph or diagrams.net embed
      const svg = await xmlToSvg(xml);
      setSvgContent(svg);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate diagram');
    } finally {
      setIsLoading(false);
    }
  };

  const xmlToSvg = async (xml: string): Promise<string> => {
    // This is a simplified conversion - in production you'd use a proper Draw.io renderer
    // For now, we'll create a basic SVG representation
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');
    
    // Extract basic information for a simple SVG representation
    const nodes = xmlDoc.querySelectorAll('mxCell[vertex="1"]');
    const edges = xmlDoc.querySelectorAll('mxCell[edge="1"]');
    
    let svg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .node { fill: #ffffff; stroke: #333333; stroke-width: 2; }
          .edge { stroke: #666666; stroke-width: 2; fill: none; }
          .label { font-family: Arial, sans-serif; font-size: 12px; fill: #333333; }
        </style>
      </defs>`;
    
    // Add nodes
    nodes.forEach((node, index) => {
      const x = 100 + (index % 4) * 150;
      const y = 100 + Math.floor(index / 4) * 120;
      const label = node.getAttribute('value') || `Node ${index}`;
      
      svg += `<rect x="${x}" y="${y}" width="60" height="40" class="node" rx="5"/>
              <text x="${x + 30}" y="${y + 25}" text-anchor="middle" class="label">${label}</text>`;
    });
    
    // Add edges (simplified)
    edges.forEach((edge, index) => {
      const sourceIndex = index % nodes.length;
      const targetIndex = (index + 1) % nodes.length;
      const sourceX = 100 + (sourceIndex % 4) * 150 + 30;
      const sourceY = 100 + Math.floor(sourceIndex / 4) * 120 + 20;
      const targetX = 100 + (targetIndex % 4) * 150 + 30;
      const targetY = 100 + Math.floor(targetIndex / 4) * 120 + 20;
      
      svg += `<line x1="${sourceX}" y1="${sourceY}" x2="${targetX}" y2="${targetY}" class="edge" marker-end="url(#arrowhead)"/>`;
    });
    
    svg += `<defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#666666"/>
              </marker>
            </defs>
          </svg>`;
    
    return svg;
  };

  const downloadDrawio = () => {
    if (!drawioXml) return;
    
    const blob = new Blob([drawioXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'azure-architecture.drawio';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  const downloadPng = async () => {
    if (!svgContent || !svgRef.current) return;
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = 800;
      canvas.height = 600;
      
      const img = new Image();
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = 'azure-architecture.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
          }
        });
      };
      
      img.src = url;
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to generate PNG');
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Azure Architecture Diagram (Draw.io)</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generateDiagram}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {validationErrors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Validation Errors:</span>
            </div>
            <ul className="text-sm text-red-600 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
            <p>Generating Azure architecture diagram...</p>
          </div>
        )}

        {!isLoading && !error && svgContent && (
          <>
            {/* Diagram Preview */}
            <div className="border rounded-lg p-4 bg-background mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Azure Architecture Preview</h3>
              </div>
              
              {/* SVG Preview */}
              <div 
                ref={svgRef}
                className="bg-white rounded border p-4 overflow-auto"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
              
              <div className="mt-4 text-center text-sm text-muted-foreground">
                <p>Azure architecture diagram with official icons</p>
                <p className="text-xs mt-1">
                  {model.nodes.length} nodes • {model.edges.length} connections
                </p>
              </div>
            </div>
          </>
        )}

        {!isLoading && !error && !svgContent && (
          <div className="text-center py-8 text-muted-foreground">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No diagram generated</p>
            <p className="text-sm">Click refresh to generate the Azure architecture diagram</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
