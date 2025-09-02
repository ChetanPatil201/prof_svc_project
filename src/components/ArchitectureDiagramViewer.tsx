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
  ZoomOut
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
 * Interface for the report data structure
 * Aligns with the Azure Migrate assessment data format
 */
interface ReportData {
  assessedMachines: Array<{
    machine: string;
    operatingSystem: string;
    cores: number;
    memoryMb: number;
    storageGb: number;
    computeMonthlyCostEstimateUsd: number;
    securityMonthlyCostEstimateUsd: number;
    azureReadinessIssues: string;
    securityReadiness: string;
    dataCollectionIssues: string;
    networkAdapters: string;
    ipAddress: string;
    networkInMbps: number;
    networkOutMbps: number;
    cpuUsagePercent: number;
    memoryUsagePercent: number;
  }>;
  assessedDisks: Array<{
    machine: string;
    diskName: string;
    recommendedDiskType: string;
    monthlyCostEstimate: number;
    sourceDiskSizeGb: number;
    targetDiskSizeGb: number;
  }>;
}

/**
 * Interface for the API response from /api/generate-diagram
 */
interface DiagramResponse {
  success: boolean;
  blueprint?: string;
  imageUrl?: string;
  processingTime?: number;
  summary?: {
    totalVMs: number;
    totalCost: number;
    migrationStrategy: string;
  };
  error?: string;
}

/**
 * Props for the ArchitectureDiagramViewer component
 */
interface ArchitectureDiagramViewerProps {
  /** Report ID to fetch data from (alternative to reportData) */
  reportId?: string;
  /** Direct report data (alternative to reportId) */
  reportData?: ReportData;
  /** Title for the diagram card */
  title?: string;
  /** Description for the diagram card */
  description?: string;
  /** CSS class name for additional styling */
  className?: string;
  /** Whether to auto-generate diagram on mount */
  autoGenerate?: boolean;
  /** Callback function when diagram generation completes */
  onDiagramGenerated?: (response: DiagramResponse) => void;
  /** Callback function when an error occurs */
  onError?: (error: string) => void;
}

/**
 * ArchitectureDiagramViewer Component
 * 
 * A React component that displays architecture diagrams generated from Azure Migrate assessment data.
 * Features include:
 * - Automatic diagram generation from report data
 * - Loading states and error handling
 * - Download functionality for generated diagrams
 * - Zoom controls and fullscreen view
 * - Retry mechanism for failed requests
 * - Responsive design with Tailwind CSS
 * 
 * @param props - Component props
 * @returns JSX element
 * 
 * Potential extensions:
 * - Add diagram editing capabilities
 * - Implement diagram versioning
 * - Add collaborative features
 * - Support for multiple diagram formats
 * - Real-time diagram updates
 */
export default function ArchitectureDiagramViewer({
  reportId,
  reportData,
  title = "Azure Architecture Diagram",
  description = "Generated from your assessment data using AI-powered analysis",
  className = "",
  autoGenerate = true,
  onDiagramGenerated,
  onError
}: ArchitectureDiagramViewerProps) {
  // State management for component functionality
  const [loading, setLoading] = useState(false);
  const [blueprint, setBlueprint] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [summary, setSummary] = useState<{ totalVMs: number; totalCost: number; migrationStrategy: string } | null>(null);
  
  // UI state management
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showControls, setShowControls] = useState(true);

  /**
   * Downloads the diagram image
   * Creates a temporary link and triggers download
   */
  const handleDownload = useCallback(async () => {
    if (!imageUrl) {
      setError('No diagram available for download');
      return;
    }

    try {
      console.log('📥 [ArchitectureDiagramViewer] Downloading diagram image...');
      
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
      link.download = `azure-architecture-diagram-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      console.log('✅ [ArchitectureDiagramViewer] Diagram downloaded successfully');
    } catch (err) {
      console.error('❌ [ArchitectureDiagramViewer] Download failed:', err);
      setError('Failed to download diagram');
    }
  }, [imageUrl]);



  /**
   * Fetches diagram from the API endpoint
   * Handles the complete workflow from data to diagram generation
   */
  const generateDiagram = useCallback(async (data: ReportData) => {
    setLoading(true);
    setError("");
    const startTime = Date.now();

    try {
      console.log('🔄 [ArchitectureDiagramViewer] Generating diagram...');
      
      const response = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportData: data }),
      });

      const result: DiagramResponse = await response.json();
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      if (response.ok && result.success) {
        console.log('✅ [ArchitectureDiagramViewer] Diagram generated successfully');
        
        setBlueprint(result.blueprint || "");
        setProcessingTime(result.processingTime || totalTime);
        setSummary(result.summary || null);
        
        // Use the imageUrl from the API response directly
        if (result.imageUrl) {
          setImageUrl(result.imageUrl);
        } else if (result.blueprint) {
                    // Fallback: generate image URL from PlantUML blueprint if imageUrl not provided
          const fallbackImageUrl = encode(result.blueprint);
          setImageUrl(`https://www.plantuml.com/plantuml/png/${fallbackImageUrl}`);
        }
        
        // Call success callback
        onDiagramGenerated?.(result);
      } else {
        const errorMessage = result.error || 'Failed to generate diagram';
        console.error('❌ [ArchitectureDiagramViewer] API Error:', errorMessage);
        
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      console.error('❌ [ArchitectureDiagramViewer] Network Error:', errorMessage);
      
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [onDiagramGenerated, onError]);

  /**
   * Handles manual diagram generation
   * Triggered by the "Generate Diagram" button
   */
  const handleGenerateDiagram = useCallback(() => {
    if (reportData) {
      generateDiagram(reportData);
    } else if (reportId) {
      // TODO: Fetch report data by ID
      console.warn('Report ID fetching not implemented yet');
      setError('Report ID fetching not implemented yet');
    } else {
      setError('No report data or ID provided');
    }
  }, [reportData, reportId, generateDiagram]);

  /**
   * Refreshes the diagram by regenerating it
   */
  const handleRefresh = useCallback(() => {
    if (reportData) {
      console.log('🔄 [ArchitectureDiagramViewer] Refreshing diagram...');
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
      return Math.max(0.5, Math.min(3, newZoom)); // Limit zoom between 0.5x and 3x
    });
  }, []);

  /**
   * Resets zoom to default
   */
  const resetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  // Auto-generate diagram on mount if enabled and data is available
  useEffect(() => {
    if (autoGenerate && reportData && !loading && !blueprint) {
      generateDiagram(reportData);
    }
  }, [autoGenerate, reportData, loading, blueprint, generateDiagram]);

  // Component render logic
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Generating architecture diagram...</p>
          {processingTime > 0 && (
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
          <Button onClick={handleGenerateDiagram} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      );
    }

    if (!imageUrl && !blueprint) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Eye className="h-8 w-8 text-gray-400" />
          <p className="text-gray-600">No diagram available</p>
          <Button onClick={handleGenerateDiagram}>
            Generate Diagram
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Diagram Image */}
        <div className="relative bg-gray-50 rounded-lg overflow-hidden border shadow-sm">
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Azure Architecture Diagram"
              className="w-full h-auto max-w-full transition-transform duration-200 hover:shadow-lg"
              style={{ transform: `scale(${zoomLevel})` }}
              onError={() => setError('Failed to load diagram image')}
              onLoad={() => console.log('✅ [ArchitectureDiagramViewer] Image loaded successfully')}
            />
          )}
          
          {/* Zoom Controls */}
          {showControls && imageUrl && (
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
          {imageUrl && (
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
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
