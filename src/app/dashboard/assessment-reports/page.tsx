"use client"
import DashboardLayout from "@/components/DashboardLayout"
import { AssessmentReportForm } from "@/components/AssessmentReportForm"

export default function AssessmentReportsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <AssessmentReportForm />
      </div>
    </DashboardLayout>
  )
} 