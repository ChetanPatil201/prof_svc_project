"use client"
import { useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { AssessmentReportForm } from "@/components/AssessmentReportForm"
import ArchitectureDiagram from "@/components/ArchitectureDiagram"
import { Button } from "@/components/ui/button"
import { Building2, Zap, Eye, EyeOff } from "lucide-react"
import { AssessmentReportData } from "@/types/assessmentReport"

export default function AssessmentReportsPage() {
  const [showArchitectureDiagram, setShowArchitectureDiagram] = useState(true)
  const [currentAssessment, setCurrentAssessment] = useState<AssessmentReportData | null>(null)

  const handleAssessmentComplete = (assessment: AssessmentReportData) => {
    console.log('🔍 [AssessmentReportsPage] Assessment completed:', {
      totalServers: assessment.totalServers,
      vmSummary: assessment.vmSummary?.length || 0,
      targetRegion: assessment.targetRegion
    });
    
    // Store the assessment data and automatically show the architecture diagram
    setCurrentAssessment(assessment)
    setShowArchitectureDiagram(true)
  }

  const toggleArchitectureDiagram = () => {
    setShowArchitectureDiagram(!showArchitectureDiagram)
  }

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

        {/* Architecture Diagram Section */}
        {currentAssessment && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-blue-600" />
                    Azure Architecture Diagram
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Automatically generated from your assessment data following Azure Architecture Center guidance
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={toggleArchitectureDiagram}
                  className="flex items-center gap-2"
                >
                  {showArchitectureDiagram ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showArchitectureDiagram ? 'Hide' : 'Show'} Diagram
                </Button>
              </div>
            </div>
            
            {showArchitectureDiagram && (
              <div className="p-6">
                <ArchitectureDiagram 
                  assessment={currentAssessment}
                  className="border-0 shadow-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Assessment Results Summary */}
        {currentAssessment && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              Assessment Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{currentAssessment.totalServers}</div>
                <div className="text-sm text-blue-600 font-medium">Total Servers</div>
                <div className="text-xs text-blue-500 mt-1">
                  {currentAssessment.inScopeServersCount} ready for Azure
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  ${currentAssessment.payAsYouGoData?.totalMonthlyCost?.toFixed(0) || '0'}
                </div>
                <div className="text-sm text-green-600 font-medium">Monthly Cost</div>
                <div className="text-xs text-green-500 mt-1">
                  Pay-as-you-go pricing
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">
                  {currentAssessment.totalStorageTB.toFixed(1)}
                </div>
                <div className="text-sm text-purple-600 font-medium">Total Storage (TB)</div>
                <div className="text-xs text-purple-500 mt-1">
                  {currentAssessment.numDisksInScope} disks in scope
                </div>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Operating System Distribution</h4>
                <div className="space-y-2">
                  {Object.entries(currentAssessment.osDistribution).map(([os, count]) => (
                    <div key={os} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{os}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Target Region</h4>
                <div className="text-sm text-gray-600">
                  <strong>{currentAssessment.targetRegion || 'East US'}</strong>
                  <p className="mt-1 text-xs text-gray-500">
                    All Azure resources will be deployed to this region
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!currentAssessment && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Ready to Generate Architecture
            </h3>
            <p className="text-blue-700">
              Upload your assessment files above to automatically generate an Azure architecture diagram 
              based on your infrastructure requirements and following Azure Architecture Center best practices.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 