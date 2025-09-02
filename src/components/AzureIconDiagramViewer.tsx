"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Loader2, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Cloud
} from 'lucide-react';

// Import plantuml-encoder for proper PlantUML encoding
let encode: (text: string) => string;
try {
  const plantumlEncoder = require('plantuml-encoder');
  encode = plantumlEncoder.encode;
} catch (error) {
  // Fallback encoding if plantuml-encoder is not available
  encode = (text: string) => {
    const encoded = btoa(unescape(encodeURIComponent(text)));
    return `~1${encoded}`;
  };
}

/**
 * Interface for Azure icon data
 */
interface AzureIcon {
  name: string;
  category: string;
  description: string;
}

/**
 * Interface for the API response from /api/generate-diagram-with-icons
 */
interface DiagramWithIconsResponse {
  success: boolean;
  blueprint?: string;
  azureIcons?: Record<string, AzureIcon>;
  iconUrls?: Record<string, string>;
  processingTime?: number;
  summary?: {
    totalVMs: number;
    totalCost: number;
    migrationStrategy: string;
  };
  error?: string;
}

/**
 * Props for the AzureIconDiagramViewer component
 */
interface AzureIconDiagramViewerProps {
  /** Report ID to fetch data from (alternative to reportData) */
  reportId?: string;
  /** Direct report data (alternative to reportId) */
  reportData?: any;
  /** Title for the diagram card */
  title?: string;
  /** Description for the diagram card */
  description?: string;
  /** CSS class name for additional styling */
  className?: string;
  /** Whether to auto-generate diagram on mount */
  autoGenerate?: boolean;
  /** Callback function when diagram generation completes */
  onDiagramGenerated?: (response: DiagramWithIconsResponse) => void;
  /** Callback function when an error occurs */
  onError?: (error: string) => void;
}

/**
 * AzureIconDiagramViewer Component
 * 
 * A React component that displays architecture diagrams with Azure icons.
 * Features include:
 * - Azure icon integration for professional appearance
 * - Interactive icon display and information
 * - Enhanced visual representation of Azure services
 * - Download functionality for generated diagrams
 * - Zoom controls and fullscreen view
 * - Responsive design with Tailwind CSS
 * 
 * @param props - Component props
 * @returns JSX element
 */
export default function AzureIconDiagramViewer({
  reportId,
  reportData,
  title = "Azure Architecture Diagram",
  description = "Generated from your assessment data with Azure-native styling",
  className = "",
  autoGenerate = true,
  onDiagramGenerated,
  onError
}: AzureIconDiagramViewerProps) {
  // State management for component functionality
  const [blueprint, setBlueprint] = useState<string>("");
  const [azureIcons, setAzureIcons] = useState<Record<string, AzureIcon> | null>(null);
  const [iconUrls, setIconUrls] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState<string>("");
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [summary, setSummary] = useState<{ totalVMs: number; totalCost: number; migrationStrategy: string } | null>(null);
  
  // Retry mechanism state
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);
  const [hasExceededMaxRetries, setHasExceededMaxRetries] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // UI state management
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showIcons, setShowIcons] = useState(true);

  /**
   * Downloads the diagram image
   */
  const handleDownload = useCallback(async () => {
    if (!blueprint) {
      setError('No diagram available for download');
      return;
    }

    try {
      console.log('📥 [AzureIconDiagramViewer] Downloading diagram image...');
      
                        // Encode the PlantUML code with proper PlantUML encoding
                  const encoded = encode(blueprint);
                  const imageUrl = `https://www.plantuml.com/plantuml/png/${encoded}`;
      
      // Fetch the image as a blob
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `azure-architecture-diagram-with-icons-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      console.log('✅ [AzureIconDiagramViewer] Diagram downloaded successfully');
    } catch (err) {
      console.error('❌ [AzureIconDiagramViewer] Download failed:', err);
      setError('Failed to download diagram');
    }
  }, [blueprint]);

  /**
   * Fetches diagram with Azure icons from the API endpoint with retry mechanism
   */
  const generateDiagram = useCallback(async (data: any, isRetry: boolean = false) => {
    // Check if we've exceeded max retries
    if (isRetry && retryCount >= maxRetries) {
      console.log(`❌ [AzureIconDiagramViewer] Max retries (${maxRetries}) exceeded. Stopping retry attempts.`);
      setHasExceededMaxRetries(true);
      setError(`Failed to generate diagram after ${maxRetries} attempts. Please try again later.`);
      return;
    }

    setIsLoading(true);
    setError("");
    const startTime = Date.now();

    // Increment retry count if this is a retry attempt
    if (isRetry) {
      setRetryCount(prev => prev + 1);
      console.log(`🔄 [AzureIconDiagramViewer] Retry attempt ${retryCount + 1}/${maxRetries}...`);
    }

    try {
      console.log('🔄 [AzureIconDiagramViewer] Generating diagram with Azure icons...');
      
      const response = await fetch('/api/generate-diagram-with-icons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportData: data }),
      });

      const result: DiagramWithIconsResponse = await response.json();
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      if (response.ok && result.success) {
        console.log('✅ [AzureIconDiagramViewer] Diagram with icons generated successfully');
        
        setBlueprint(result.blueprint || "");
        setAzureIcons(result.azureIcons || null);
        setIconUrls(result.iconUrls || null);
        setProcessingTime(result.processingTime || totalTime);
        setSummary(result.summary || null);
        
        // Reset retry count on success
        setRetryCount(0);
        setHasExceededMaxRetries(false);
        
        // Call success callback
        onDiagramGenerated?.(result);
      } else {
        const errorMessage = result.error || 'Failed to generate diagram with icons';
        console.error('❌ [AzureIconDiagramViewer] API Error:', errorMessage);
        
        // Check if we should retry
        if (retryCount < maxRetries - 1) {
          console.log(`🔄 [AzureIconDiagramViewer] Will retry in 2 seconds... (${retryCount + 1}/${maxRetries})`);
          setTimeout(() => {
            generateDiagram(data, true);
          }, 2000);
        } else {
          setError(`Failed to generate diagram after ${maxRetries} attempts: ${errorMessage}`);
          setHasExceededMaxRetries(true);
          onError?.(errorMessage);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      console.error('❌ [AzureIconDiagramViewer] Network Error:', errorMessage);
      
      // Check if we should retry
      if (retryCount < maxRetries - 1) {
        console.log(`🔄 [AzureIconDiagramViewer] Will retry in 2 seconds... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          generateDiagram(data, true);
        }, 2000);
      } else {
        setError(`Failed to generate diagram after ${maxRetries} attempts: ${errorMessage}`);
        setHasExceededMaxRetries(true);
        onError?.(errorMessage);
      }
    } finally {
              setIsLoading(false);
    }
  }, [onDiagramGenerated, onError, retryCount, maxRetries]);

  /**
   * Handles manual diagram generation with retry reset
   */
  const handleGenerateDiagram = useCallback(() => {
    // Reset retry count for manual generation
    setRetryCount(0);
    setHasExceededMaxRetries(false);
    setError("");
    
    if (reportData) {
      generateDiagram(reportData);
    } else if (reportId) {
      console.warn('Report ID fetching not implemented yet');
      setError('Report ID fetching not implemented yet');
    } else {
      setError('No report data or ID provided');
    }
  }, [reportData, reportId, generateDiagram]);

  /**
   * Generates a simple diagram without icons as fallback
   */
  const generateSimpleDiagram = useCallback(() => {
    if (!reportData) return;
    
    console.log('🔄 [AzureIconDiagramViewer] Generating simple diagram without icons...');
    
    // Create a simple PlantUML diagram without icons
    const simpleBlueprint = `@startuml
!theme plain
skinparam rectangleRoundCorner 12
skinparam defaultFontName 'Segoe UI'
skinparam shadowing false
skinparam backgroundColor #FFFFFF
skinparam arrowColor #0078D4
skinparam arrowThickness 2

title **Azure Landing Zone Architecture** \\n <size:16><color:#0078D4>Generated from Azure Migrate Assessment</color></size>

rectangle "**Production Subscription**" as subscription #E3F2FD {
  rectangle "**Production VNet**\\n**10.0.0.0/16**" as vnet #E8F5E8 {
    rectangle "**Web Tier**\\n**10.0.1.0/24**" as web #BBDEFB
    rectangle "**App Tier**\\n**10.0.2.0/24**" as app #C8E6C9
    rectangle "**Data Tier**\\n**10.0.3.0/24**" as data #FFF3E0
    rectangle "**Management**\\n**10.0.4.0/24**" as mgmt #F3E5F5
  }
  
  rectangle "**Network Security Group**" as nsg #FFCDD2
  rectangle "**Storage Account**" as storage #B2DFDB
  rectangle "**Load Balancer**" as lb #FFF9C4
  rectangle "**Key Vault**" as kv #FFCCBC
  rectangle "**Monitor**" as monitor #E1BEE7
  rectangle "**Application Gateway**" as agw #C5CAE9
}

web -[#0078D4,thickness=2]-> app : **HTTP/HTTPS**
app -[#0078D4,thickness=2]-> data : **Database**
mgmt -[#FF6B6B,thickness=2]-> web : **Management**
lb -[#00C851,thickness=2]-> web : **Load Balance**
nsg -[#FF0000,thickness=2]-> vnet : **Security Rules**
storage -[#4ECDC4,thickness=2]-> data : **Data Storage**
kv -[#FFB347,thickness=2]-> app : **Secrets**
monitor -[#87CEEB,thickness=2]-> vnet : **Monitoring**
agw -[#9C27B0,thickness=2]-> lb : **Traffic**

note bottom
  **Azure Architecture**: This diagram represents a production-ready Azure Landing Zone
  with proper network segmentation, security controls, and monitoring.
  Using simplified styling for better compatibility.
end note

@enduml`;

    setBlueprint(simpleBlueprint);
    setError("");
  }, [reportData]);

  /**
   * Refreshes the diagram by regenerating it with retry reset
   */
  const handleRefresh = useCallback(() => {
    if (reportData) {
      console.log('🔄 [AzureIconDiagramViewer] Refreshing diagram with icons...');
      // Reset retry count for refresh
      setRetryCount(0);
      setHasExceededMaxRetries(false);
      setError("");
      generateDiagram(reportData);
    }
  }, [reportData, generateDiagram]);

  /**
   * Toggles fullscreen view
   */
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  /**
   * Handles zoom controls
   */
  const handleZoom = useCallback((direction: 'in' | 'out') => {
    setZoomLevel(prev => {
      const newZoom = direction === 'in' ? prev * 1.2 : prev / 1.2;
      return Math.max(0.5, Math.min(3, newZoom));
    });
  }, []);

  /**
   * Resets zoom to default
   */
  const resetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  // Clear diagram state when reportData changes (new assessment uploaded)
  useEffect(() => {
    if (reportData) {
      const vmCount = reportData.assessedMachines?.length || 0;
      const diskCount = reportData.assessedDisks?.length || 0;
      console.log('🔄 [AzureIconDiagramViewer] Report data changed:', { vmCount, diskCount });
      setIsRefreshing(true);
      setBlueprint("");
      setAzureIcons(null);
      setIconUrls(null);
      setError("");
      setProcessingTime(0);
      setSummary(null);
      setRetryCount(0);
      setHasExceededMaxRetries(false);
      
      // Clear refreshing state after a short delay
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  }, [reportData?.assessedMachines?.length, reportData?.assessedDisks?.length]);

  // Auto-generate diagram on mount if enabled and data is available
  useEffect(() => {
    if (autoGenerate && reportData && !isLoading && !blueprint && !hasExceededMaxRetries) {
      const vmCount = reportData.assessedMachines?.length || 0;
      const diskCount = reportData.assessedDisks?.length || 0;
      console.log('🚀 [AzureIconDiagramViewer] Auto-generating diagram for:', { vmCount, diskCount });
      generateDiagram(reportData);
    }
  }, [autoGenerate, reportData, isLoading, blueprint, generateDiagram, hasExceededMaxRetries]);

  // Component render logic
  const renderContent = () => {
    if (isLoading || isRefreshing) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">
            {isRefreshing 
              ? 'Refreshing diagram with new data...'
              : retryCount > 0 
                ? `Retry attempt ${retryCount}/${maxRetries}: Generating Azure architecture diagram...`
                : 'Generating Azure architecture diagram...'
            }
          </p>
          {processingTime > 0 && !isRefreshing && (
            <p className="text-sm text-gray-500">Processing time: {processingTime}ms</p>
          )}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-red-600 text-center">{error}</p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500">
              Retry attempts: {retryCount}/{maxRetries}
            </p>
          )}
          {hasExceededMaxRetries ? (
            <div className="space-y-2">
              <p className="text-sm text-orange-600">
                Maximum retry attempts reached. Please try again later.
              </p>
              <Button onClick={handleGenerateDiagram} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : (
            <Button onClick={handleGenerateDiagram} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      );
    }

    if (!blueprint) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Cloud className="h-8 w-8 text-gray-400" />
          <p className="text-gray-600">No diagram available</p>
          <Button onClick={handleGenerateDiagram}>
            Generate Azure Architecture Diagram
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Diagram Image */}
        <div className="relative bg-gray-50 rounded-lg overflow-hidden border shadow-sm">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Generating Azure Architecture Diagram...</p>
              </div>
            </div>
          )}
          {!isLoading && blueprint && (() => {
            try {
              // Try PlantUML server first
              const imageUrl = `https://www.plantuml.com/plantuml/png/${encode(blueprint)}`;
              console.log('🖼️ [AzureIconDiagramViewer] Generated image URL:', imageUrl);
              
              return (
                <img
                  src={imageUrl}
                  alt="Azure Architecture Diagram"
                  className="w-full h-auto max-w-full transition-transform duration-200 hover:shadow-lg"
                  style={{ transform: `scale(${zoomLevel})` }}
                  loading="lazy"
                  onError={(e) => {
                    console.error('❌ [AzureIconDiagramViewer] PlantUML image failed to load, showing diagram code instead');
                    setError("PlantUML server unavailable. Showing diagram code.");
                  }}
                  onLoad={() => console.log('✅ [AzureIconDiagramViewer] Image loaded successfully')}
                />
              );
            } catch (encodingError) {
              console.error('❌ [AzureIconDiagramViewer] PlantUML encoding failed:', encodingError);
              setError("Failed to encode PlantUML diagram. Showing diagram code.");
            }
          })()}
          {!isLoading && !blueprint && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Cloud className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No diagram available</p>
                <Button onClick={() => reportData && generateDiagram(reportData)} className="mt-2">
                  Generate Diagram
                </Button>
              </div>
            </div>
          )}
          
          {/* Error state with PlantUML code display */}
          {error && blueprint && (
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="text-yellow-800 font-medium">Diagram Preview Unavailable</span>
                </div>
                <p className="text-yellow-700 text-sm mb-3">
                  The PlantUML server is currently unavailable. You can copy the diagram code below and paste it into a PlantUML editor to view the diagram.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(blueprint);
                      console.log('📋 [AzureIconDiagramViewer] PlantUML code copied to clipboard');
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Copy PlantUML Code
                  </Button>
                  <Button 
                    onClick={() => window.open('https://www.plantuml.com/plantuml/uml/', '_blank')}
                    size="sm"
                    variant="outline"
                  >
                    Open PlantUML Editor
                  </Button>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">PlantUML Diagram Code:</h4>
                <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-96">
                  {blueprint}
                </pre>
              </div>
            </div>
          )}
          
          {/* Zoom Controls */}
          {showControls && (
            <div className="absolute top-4 right-4 flex space-x-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleZoom('out')}
                disabled={zoomLevel <= 0.5}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={resetZoom}
                className="h-8 px-2"
              >
                {Math.round(zoomLevel * 100)}%
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleZoom('in')}
                disabled={zoomLevel >= 3}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Azure Architecture Information */}
        {summary && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <Cloud className="h-6 w-6" />
                Azure Architecture Overview
              </h3>
              <Button
                onClick={() => setShowIcons(!showIcons)}
                variant="outline"
                size="sm"
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                {showIcons ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                {showIcons ? 'Hide' : 'Show'} Details
              </Button>
            </div>
            
            {showIcons && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Azure Services Used</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Azure Virtual Network (VNet)</li>
                      <li>• Azure Virtual Machines</li>
                      <li>• Network Security Groups (NSG)</li>
                      <li>• Azure Storage Account</li>
                      <li>• Azure Load Balancer</li>
                      <li>• Azure Key Vault</li>
                      <li>• Azure Monitor</li>
                      <li>• Azure Application Gateway</li>
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Architecture Features</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Multi-tier application design</li>
                      <li>• Network segmentation (Web/App/Data)</li>
                      <li>• Security controls and monitoring</li>
                      <li>• Load balancing and traffic management</li>
                      <li>• Secrets management with Key Vault</li>
                      <li>• Cost optimization and tracking</li>
                    </ul>
                  </div>
                </div>
                
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This diagram uses PlantUML's built-in Azure styling and colors 
                    to represent a production-ready Azure Landing Zone architecture with proper security, 
                    networking, and monitoring components.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary Information */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="font-medium text-blue-900">Total VMs</p>
              <p className="text-2xl font-bold text-blue-600">{summary.totalVMs}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="font-medium text-green-900">Monthly Cost</p>
              <p className="text-2xl font-bold text-green-600">${typeof summary.totalCost === 'number' ? summary.totalCost.toFixed(2) : '0.00'}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="font-medium text-purple-900">Strategy</p>
              <p className="text-lg font-semibold text-purple-600">{summary.migrationStrategy}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button 
            onClick={handleGenerateDiagram} 
            variant="outline"
            className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
          {blueprint && (
            <Button 
              onClick={handleDownload} 
              variant="outline"
              className="hover:bg-green-50 hover:border-green-300 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
          <Button 
            onClick={handleRefresh} 
            variant="outline"
            className="hover:bg-purple-50 hover:border-purple-300 transition-colors"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={toggleFullscreen} 
            variant="outline"
            className="hover:bg-orange-50 hover:border-orange-300 transition-colors"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-4 w-4 mr-2" />
                Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 mr-2" />
                Fullscreen
              </>
            )}
          </Button>
          <Button
            onClick={() => setShowControls(!showControls)}
            variant="outline"
            size="sm"
            className="hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            {showControls ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showControls ? 'Hide' : 'Show'} Controls
          </Button>
          <Button
            onClick={() => setShowIcons(!showIcons)}
            variant="outline"
            size="sm"
            className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            <Cloud className="h-4 w-4 mr-2" />
            {showIcons ? 'Hide' : 'Show'} Icons
          </Button>
        </div>
      </div>
    );
  };

  // Main component render
  return (
    <div className={`${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <Card className={`h-full ${isFullscreen ? 'rounded-none' : ''}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            {isFullscreen && (
              <Button onClick={toggleFullscreen} variant="outline" size="sm">
                <Minimize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
