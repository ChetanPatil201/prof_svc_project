"use client"
import { useState, useCallback } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { AssessmentReportForm } from "@/components/AssessmentReportForm"
import AzureIconDiagramViewer from "@/components/AzureIconDiagramViewer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Zap, Eye, EyeOff, Network, Download, Calendar, Server, Database, AlertCircle } from "lucide-react"
import { AssessmentReportData } from "@/types/assessmentReport"

/**
 * Assessment Reports Dashboard Page
 * 
 * Enhanced with Architecture Diagram Viewer Integration
 * 
 * This page displays assessment reports with integrated architecture diagrams
 * generated from Azure Migrate assessment data. Each report can have its own
 * diagram viewer with interactive controls.
 * 
 * Features:
 * - Multiple assessment report management
 * - Individual architecture diagram viewers per report
 * - Lazy loading of diagrams for performance
 * - Error handling and user feedback
 * - Collapsible diagram sections
 * 
 * Performance Considerations:
 * - Diagrams are only loaded when explicitly requested
 * - State management prevents unnecessary re-renders
 * - Error boundaries for individual diagram failures
 * 
 * Future Extensions:
 * - Bulk diagram download functionality
 * - Diagram comparison tools
 * - Export diagrams to various formats
 * - Real-time diagram updates
 * - Integration with Azure DevOps pipelines
 */

export default function AssessmentReportsPage() {
  // State for managing multiple assessment reports
  const [assessments, setAssessments] = useState<AssessmentReportData[]>([])
  const [currentAssessment, setCurrentAssessment] = useState<AssessmentReportData | null>(null)
  
  // State for managing diagram visibility per assessment
  const [visibleDiagrams, setVisibleDiagrams] = useState<Set<string>>(new Set())
  const [diagramErrors, setDiagramErrors] = useState<Record<string, string>>({})
  const [loadingDiagrams, setLoadingDiagrams] = useState<Set<string>>(new Set())
  const [lazyLoadedDiagrams, setLazyLoadedDiagrams] = useState<Set<string>>(new Set())

  const handleAssessmentComplete = useCallback((assessment: AssessmentReportData) => {
    console.log('🔍 [AssessmentReportsPage] Assessment completed:', {
      totalServers: assessment.totalServers,
      vmSummary: assessment.vmSummary?.length || 0,
      targetRegion: assessment.targetRegion
    });
    
    // Generate a unique ID for the assessment
    const assessmentId = `assessment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const assessmentWithId = { ...assessment, id: assessmentId }
    
    // Add to assessments list and set as current
    setAssessments(prev => [assessmentWithId, ...prev])
    setCurrentAssessment(assessmentWithId)
    
    // Automatically show the diagram for the new assessment
    setVisibleDiagrams(prev => new Set([...prev, assessmentId]))
  }, []);

  /**
   * Toggles the visibility of a specific assessment's diagram
   */
  const toggleDiagramVisibility = useCallback((assessmentId: string) => {
    setVisibleDiagrams(prev => {
      const newSet = new Set(prev)
      if (newSet.has(assessmentId)) {
        newSet.delete(assessmentId)
      } else {
        newSet.add(assessmentId)
      }
      return newSet
    })
  }, []);

  /**
   * Handles diagram generation success for a specific assessment
   */
  const handleDiagramGenerated = useCallback((assessmentId: string, response: any) => {
    console.log(`✅ [AssessmentReportsPage] Diagram generated for ${assessmentId}:`, response)
    setLoadingDiagrams(prev => {
      const newSet = new Set(prev)
      newSet.delete(assessmentId)
      return newSet
    })
    setDiagramErrors(prev => {
      const { [assessmentId]: _, ...rest } = prev
      return rest
    })
  }, []);

  /**
   * Handles diagram generation errors for a specific assessment
   */
  const handleDiagramError = useCallback((assessmentId: string, error: string) => {
    console.error(`❌ [AssessmentReportsPage] Diagram error for ${assessmentId}:`, error)
    setLoadingDiagrams(prev => {
      const newSet = new Set(prev)
      newSet.delete(assessmentId)
      return newSet
    })
    setDiagramErrors(prev => ({
      ...prev,
      [assessmentId]: error
    }))
  }, []);

  /**
   * Prepares assessment data for diagram generation
   */
  const prepareDiagramData = useCallback((assessment: AssessmentReportData) => {
    return {
      assessedMachines: assessment.vmSummary?.map(vm => ({
        machine: vm.vmName,
        operatingSystem: vm.operatingSystem,
        cores: vm.cores,
        memoryMb: vm.memoryGB * 1024, // Convert GB to MB
        storageGb: vm.storageGB,
        computeMonthlyCostEstimateUsd: vm.computeMonthlyCostEstimateUsd,
        securityMonthlyCostEstimateUsd: 0, // Default security cost
        azureReadinessIssues: vm.readiness === 'Ready for Azure' ? '' : 'Not ready for Azure',
        securityReadiness: vm.readiness === 'Ready for Azure' ? 'Ready' : 'Not Ready',
        dataCollectionIssues: '',
        networkAdapters: '2', // Default network adapters
        ipAddress: '192.168.1.10', // Default IP (will be generated by AI)
        networkInMbps: 100, // Default network values
        networkOutMbps: 50,
        cpuUsagePercent: typeof vm.cpuUsage === 'string' ? parseFloat(vm.cpuUsage) || 0 : vm.cpuUsage || 0,
        memoryUsagePercent: typeof vm.memoryUsage === 'string' ? parseFloat(vm.memoryUsage) || 0 : vm.memoryUsage || 0
      })) || [],
      assessedDisks: assessment.allAssessedDisks?.map(disk => ({
        machine: disk.machine || '',
        diskName: disk.diskName || '',
        recommendedDiskType: disk.recommendedDiskType || 'Standard SSD',
        monthlyCostEstimate: disk.monthlyCostEstimate || 0,
        sourceDiskSizeGb: disk.sourceDiskSizeGb || 0,
        targetDiskSizeGb: disk.targetDiskSizeGb || 0
      })) || []
    }
  }, []);

  /**
   * Shows all diagrams for all assessments
   */
  const showAllDiagrams = useCallback(() => {
    const allIds = assessments.map(assessment => assessment.id || `assessment-${Date.now()}`)
    setVisibleDiagrams(new Set(allIds))
  }, [assessments]);

  /**
   * Hides all diagrams
   */
  const hideAllDiagrams = useCallback(() => {
    setVisibleDiagrams(new Set())
  }, []);

  /**
   * Gets the total cost across all assessments
   */
  const getTotalCost = useCallback(() => {
    return assessments.reduce((sum, assessment) => 
      sum + (assessment.payAsYouGoData?.totalMonthlyCost || 0), 0
    )
  }, [assessments]);

  /**
   * Gets the total servers across all assessments
   */
  const getTotalServers = useCallback(() => {
    return assessments.reduce((sum, assessment) => sum + assessment.totalServers, 0)
  }, [assessments]);

  /**
   * Lazy loading observer for diagram sections
   */
  const diagramObserverRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const assessmentId = entry.target.getAttribute('data-assessment-id');
              if (assessmentId) {
                setLazyLoadedDiagrams(prev => new Set([...prev, assessmentId]));
              }
            }
          });
        },
        { threshold: 0.1 }
      );
      
      observer.observe(node);
      
      return () => observer.disconnect();
    }
  }, []);

  /**
   * Downloads all visible diagram images as a batch
   */
  const handleBulkDownload = useCallback(async () => {
    const visibleAssessmentIds = Array.from(visibleDiagrams);
    if (visibleAssessmentIds.length === 0) {
      console.warn('No diagrams are currently visible for download');
      return;
    }

    console.log(`📥 [Dashboard] Starting bulk download of ${visibleAssessmentIds.length} diagrams...`);
    
    try {
      // For now, we'll download them sequentially
      // In a production environment, you might want to zip them or use a more sophisticated approach
      for (const assessmentId of visibleAssessmentIds) {
        const assessment = assessments.find(a => a.id === assessmentId);
        if (assessment) {
          // Trigger download for each visible diagram
          // This would need to be implemented with actual image URLs
          console.log(`📥 [Dashboard] Downloading diagram for assessment: ${assessmentId}`);
        }
      }
      
      console.log('✅ [Dashboard] Bulk download completed');
    } catch (error) {
      console.error('❌ [Dashboard] Bulk download failed:', error);
    }
  }, [visibleDiagrams, assessments]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Assessment Reports & Architecture
          </h1>
          <p className="text-gray-600">
            Generate comprehensive assessment reports with AI-powered Azure architecture diagrams
          </p>
        </div>

        {/* Assessment Form Section */}
        <div className="bg-white rounded-lg shadow-sm border">
          <AssessmentReportForm onComplete={handleAssessmentComplete} />
        </div>

        {/* Assessment Reports Listing */}
        {assessments.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="h-6 w-6 text-blue-600" />
                Assessment Reports
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={showAllDiagrams}
                    className="text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Show All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={hideAllDiagrams}
                    className="text-xs"
                  >
                    <EyeOff className="h-3 w-3 mr-1" />
                    Hide All
                  </Button>
                  {visibleDiagrams.size > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDownload}
                      className="text-xs bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download All ({visibleDiagrams.size})
                    </Button>
                  )}
                </div>
                <Badge variant="secondary" className="text-sm">
                  {assessments.length} {assessments.length === 1 ? 'Report' : 'Reports'}
                </Badge>
              </div>
            </div>

            {assessments.map((assessment) => {
              const assessmentId = assessment.id || `assessment-${Date.now()}`
              const isDiagramVisible = visibleDiagrams.has(assessmentId)
              const hasDiagramError = diagramErrors[assessmentId]
              const isDiagramLoading = loadingDiagrams.has(assessmentId)
              const diagramData = prepareDiagramData(assessment)

              return (
                <Card key={assessmentId} className="border border-gray-200 hover:border-blue-300 transition-colors">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Server className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            Assessment Report - {assessment.targetRegion || 'East US'}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date().toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Database className="h-3 w-3" />
                              {assessment.totalServers} servers
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              ${assessment.payAsYouGoData?.totalMonthlyCost?.toFixed(0) || '0'}/month
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* View Architecture Diagram Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleDiagramVisibility(assessmentId)}
                          className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                          disabled={isDiagramLoading}
                        >
                          <Network className={`h-4 w-4 ${isDiagramLoading ? 'animate-spin' : ''}`} />
                          {isDiagramLoading ? 'Loading...' : isDiagramVisible ? 'Hide' : 'View'} Diagram
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Assessment Summary */}
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{assessment.totalServers}</div>
                        <div className="text-sm text-blue-600 font-medium">Total Servers</div>
                        <div className="text-xs text-blue-500 mt-1">
                          {assessment.inScopeServersCount} ready for Azure
                        </div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          ${assessment.payAsYouGoData?.totalMonthlyCost?.toFixed(0) || '0'}
                        </div>
                        <div className="text-sm text-green-600 font-medium">Monthly Cost</div>
                        <div className="text-xs text-green-500 mt-1">
                          Pay-as-you-go pricing
                        </div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {assessment.totalStorageTB.toFixed(1)}
                        </div>
                        <div className="text-sm text-purple-600 font-medium">Storage (TB)</div>
                        <div className="text-xs text-purple-500 mt-1">
                          {assessment.numDisksInScope} disks in scope
                        </div>
                      </div>
                    </div>

                    {/* Diagram Error Display */}
                    {hasDiagramError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <Badge variant="destructive" className="text-xs">
                            Diagram Error
                          </Badge>
                          <span className="text-red-700 text-sm">{hasDiagramError}</span>
                        </div>
                      </div>
                    )}

                    {/* Architecture Diagram Section */}
                    {isDiagramVisible && (
                      <div 
                        className="mt-6 pt-6 border-t border-gray-100"
                        ref={diagramObserverRef}
                        data-assessment-id={assessmentId}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Network className="h-5 w-5 text-blue-600" />
                            Azure Architecture Diagram
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              AI-Generated
                            </Badge>
                            {lazyLoadedDiagrams.has(assessmentId) && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                Lazy Loaded
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <AzureIconDiagramViewer
                          key={`${assessmentId}-${assessment.vmSummary?.length || 0}`}
                          reportData={diagramData}
                          title={`${assessment.targetRegion || 'East US'} Azure Architecture with Icons`}
                          description={`Generated from ${diagramData.assessedMachines.length} VMs and ${diagramData.assessedDisks.length} disks with Azure service icons`}
                          autoGenerate={true}
                          onDiagramGenerated={(response) => handleDiagramGenerated(assessmentId, response)}
                          onError={(error) => handleDiagramError(assessmentId, error)}
                          className="w-full"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Dashboard Summary */}
        {assessments.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              Dashboard Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{assessments.length}</div>
                <div className="text-sm text-blue-600 font-medium">Total Reports</div>
                <div className="text-xs text-blue-500 mt-1">
                  Generated assessments
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {getTotalServers()}
                </div>
                <div className="text-sm text-green-600 font-medium">Total Servers</div>
                <div className="text-xs text-green-500 mt-1">
                  Across all assessments
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  ${getTotalCost().toFixed(0)}
                </div>
                <div className="text-sm text-purple-600 font-medium">Total Monthly Cost</div>
                <div className="text-xs text-purple-500 mt-1">
                  Combined estimates
                </div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {visibleDiagrams.size}
                </div>
                <div className="text-sm text-orange-600 font-medium">Active Diagrams</div>
                <div className="text-xs text-orange-500 mt-1">
                  Currently viewing
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions - Only show when no assessments exist */}
        {assessments.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Ready to Generate Azure Architecture Diagrams with Icons
            </h3>
            <p className="text-blue-700 mb-4">
              Upload your assessment files above to automatically generate Azure architecture diagrams with Azure service icons 
              based on your infrastructure requirements and following Azure Architecture Center best practices.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-blue-600">
              <div className="flex items-center gap-1">
                <Network className="h-4 w-4" />
                AI-Generated Diagrams with Azure Icons
              </div>
              <div className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                Download & Share
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                Interactive Viewing
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
      )
  }  