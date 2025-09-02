"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Bot,
  FileImage,
  Loader2
} from 'lucide-react';
import type { AssessmentReportData } from '@/types/assessmentReport';

interface AIDiagramViewerProps {
  assessment?: AssessmentReportData;
  className?: string;
}

export default function AIDiagramViewer({ assessment, className = '' }: AIDiagramViewerProps) {
  const [diagram, setDiagram] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDiagram, setShowDiagram] = useState(true);
  const [diagramType, setDiagramType] = useState<'landing-zone'>('landing-zone');
  const [error, setError] = useState<string>('');
  const [downloadMessage, setDownloadMessage] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const generateDiagram = async (type: 'landing-zone' = 'landing-zone') => {
    setIsGenerating(true);
    setError('');
    setDiagramType(type);

    try {
      console.log('Generating diagram...', { type, assessment });

      // Use sample assessment data if none provided
      const assessmentData = assessment || {
        id: 'sample',
        clientName: 'Sample Client',
        assessmentDate: new Date().toISOString(),
        totalServers: 5,
        windowsServers: 3,
        linuxServers: 2,
        totalStorageTB: 1.0,
        targetRegion: 'East US',
        estimatedMonthlyCost: 2000,
        vmSummary: [
          {
            vmName: 'WEB-SRV-01',
            recommendedSku: 'Standard_D2s_v3',
            estimatedCost: 120,
            osType: 'Windows',
            cores: 2,
            memoryGB: 8,
            storageGB: 100
          },
          {
            vmName: 'APP-SRV-01',
            recommendedSku: 'Standard_D4s_v3',
            estimatedCost: 240,
            osType: 'Windows',
            cores: 4,
            memoryGB: 16,
            storageGB: 200
          },
          {
            vmName: 'DB-SRV-01',
            recommendedSku: 'Standard_D8s_v3',
            estimatedCost: 480,
            osType: 'Linux',
            cores: 8,
            memoryGB: 32,
            storageGB: 500
          }
        ],
        recommendations: ['Implement hub-spoke architecture'],
        risks: ['Network complexity'],
        nextSteps: ['Review architecture design']
      };

      const response = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessment: assessmentData
        }),
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to generate diagram');
      }

      const result = await response.json();
      console.log('Diagram generated successfully');

      if (result.success && result.diagram) {
        setDiagram(result.diagram);
      } else {
        throw new Error('No diagram data received');
      }

    } catch (error) {
      console.error('Error generating diagram:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate diagram');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!diagram) {
      console.error('No diagram to download');
      return;
    }

    try {
      // Check if it's an image (contains <img tag)
      if (diagram.includes('<img')) {
        // Extract image URL from img tag
        const imgMatch = diagram.match(/src="([^"]+)"/);
        if (imgMatch) {
          const imageUrl = imgMatch[1];
          
          // Download the image
          fetch(imageUrl)
            .then(response => response.blob())
            .then(blob => {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `azure-caf-diagram-${diagramType}-${new Date().toISOString().split('T')[0]}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              
              console.log('Image download initiated successfully');
              setDownloadMessage('Image download started! Check your downloads folder.');
              setTimeout(() => setDownloadMessage(''), 3000);
            })
            .catch(error => {
              console.error('Error downloading image:', error);
              setDownloadMessage('Failed to download image. Please try again.');
              setTimeout(() => setDownloadMessage(''), 3000);
            });
        }
      } else {
        // Handle SVG download
        if (!diagram.includes('<svg') || !diagram.includes('</svg>')) {
          throw new Error('Invalid SVG format');
        }

        // Create a blob from the SVG
        const blob = new Blob([diagram], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `azure-caf-diagram-${diagramType}-${new Date().toISOString().split('T')[0]}.svg`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 100);
        
        console.log('SVG download initiated successfully');
        setDownloadMessage('SVG download started! Check your downloads folder.');
        setTimeout(() => setDownloadMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error downloading diagram:', error);
      setDownloadMessage('Failed to download diagram. Please try again.');
      setTimeout(() => setDownloadMessage(''), 3000);
    }
  };

  const getDiagramTitle = () => {
    return assessment ? `${assessment.clientName} - CAF Landing Zone` : 'Azure CAF Landing Zone';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI-Generated Architecture Diagram
            </CardTitle>
            <CardDescription>
              {getDiagramTitle()}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => generateDiagram('landing-zone')}
              disabled={isGenerating}
            >
              <Bot className="h-4 w-4 mr-2" />
              Generate CAF Landing Zone
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDiagram(!showDiagram)}
              className="flex items-center gap-2"
            >
              {showDiagram ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showDiagram ? 'Hide' : 'Show'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateDiagram(diagramType)}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleDownload}
              disabled={!diagram || isGenerating}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            
            {diagram && (
              <div className="flex items-center gap-2 ml-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}
                  disabled={zoomLevel <= 50}
                >
                  -
                </Button>
                <span className="text-sm font-medium min-w-[60px] text-center">{zoomLevel}%</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
                  disabled={zoomLevel >= 200}
                >
                  +
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isGenerating && (
          <div className="text-center py-12 text-blue-600 bg-blue-50 rounded-lg border border-blue-200">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
            <p className="font-medium">Generating AI architecture diagram...</p>
            <p className="text-sm mt-1">This may take a few moments</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-600 bg-red-50 rounded-lg border border-red-200">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Error generating diagram</p>
            <p className="text-sm mt-1">{error}</p>
            {error.includes('not configured') && (
              <div className="mt-3 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                💡 <strong>Setup Required:</strong> Configure Azure OpenAI environment variables to generate diagrams.
              </div>
            )}
          </div>
        )}

        {!isGenerating && !error && !diagram && (
          <div className="text-center py-12 text-gray-600 bg-gray-50 rounded-lg border border-gray-200">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No diagram generated yet</p>
            <p className="text-sm mt-1">Click "Generate CAF Landing Zone" to create your first diagram</p>
          </div>
        )}

        {downloadMessage && (
          <div className={`text-center py-2 rounded-lg mb-4 ${
            downloadMessage.includes('started') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {downloadMessage}
          </div>
        )}

        {!isGenerating && !error && diagram && showDiagram && (
          <div className="border rounded-lg overflow-auto bg-white max-h-[600px] shadow-sm">
            <div 
              className="w-full min-w-full flex justify-center"
              style={{ 
                minHeight: '600px',
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s ease-in-out'
              }}
              dangerouslySetInnerHTML={{ __html: diagram }}
            />
          </div>
        )}

        {!isGenerating && !error && diagram && !showDiagram && (
          <div className="text-center py-8 text-gray-600 bg-gray-50 rounded-lg border border-gray-200">
            <EyeOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Diagram hidden</p>
            <p className="text-sm mt-1">Click "Show" to display the architecture diagram</p>
          </div>
        )}

        {/* Assessment Info */}
        {assessment && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-6">
            <div>
              <h4 className="font-medium mb-2">Assessment Summary</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Total Servers: {assessment.totalServers}</li>
                <li>• Target Region: {assessment.targetRegion || 'East US'}</li>
                <li>• Windows Servers: {assessment.windowsServers}</li>
                <li>• Linux Servers: {assessment.linuxServers}</li>
                <li>• Total Storage: {assessment.totalStorageTB.toFixed(2)} TB</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Architecture Features</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• {assessment.totalServers > 20 ? 'Hub-Spoke' : 'Single'} VNet Design</li>
                <li>• Load Balancer: {assessment.totalServers > 5 ? 'Yes' : 'No'}</li>
                <li>• Firewall: {assessment.totalServers > 10 ? 'Yes' : 'No'}</li>
                <li>• Database Tier: {assessment.vmSummary?.some(vm => vm.vmName?.toLowerCase().includes('db')) ? 'Yes' : 'No'}</li>
                <li>• Monitoring & Security: Enabled</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
