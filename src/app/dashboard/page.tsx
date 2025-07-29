"use client"
import DashboardLayout from "@/components/DashboardLayout"
import { Card } from "@/components/ui/card"
import { AssessmentReportForm } from "@/components/AssessmentReportForm"
import { RunbookForm } from "@/components/RunbookForm"
import { useState } from "react"
import { FileText, BookText } from "lucide-react"
import FileUpload from "@/components/FileUpload";
import CloudReadinessTable from "@/components/CloudReadinessTable";

interface MachineData {
  machine: string;
  operatingSystem: string;
  vmReadiness: string;
}
interface CloudReadinessRow {
  machine: string;
  operatingSystem: string;
  vmReadiness: string;
  azurePlan: string;
}

export default function DashboardPage() {
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [cloudReadinessData, setCloudReadinessData] = useState<MachineData[]>([]);
  const [cloudReadinessRows, setCloudReadinessRows] = useState<CloudReadinessRow[]>([]);

  const handleDataParsed = (data: { machineData: MachineData[]; cloudReadiness: CloudReadinessRow[] }) => {
    setCloudReadinessData(data.machineData);
    setCloudReadinessRows(data.cloudReadiness);
  };

  // When generating the report, make sure to include cloudReadinessRows in the payload as cloudReadiness

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 flex flex-col items-start justify-center">
          <div className="flex items-center mb-2">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            <span className="font-semibold">Pending Reviews</span>
          </div>
          <div className="text-2xl font-bold">5</div>
          <div className="text-xs text-gray-500">+20% from last month</div>
        </Card>
        <Card className="p-6 flex flex-col items-start justify-center">
          <div className="flex items-center mb-2">
            <BookText className="h-5 w-5 mr-2 text-blue-600" />
            <span className="font-semibold">Completed Runbooks</span>
          </div>
          <div className="text-2xl font-bold">18</div>
          <div className="text-xs text-gray-500">+19% from last month</div>
        </Card>
        <Card className="p-6 flex flex-col items-start justify-center">
          <div className="flex items-center mb-2">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            <span className="font-semibold">New Assessment</span>
          </div>
          <button className="mt-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-800">+ New Assessment</button>
        </Card>
      </div>
      <div className="mb-8 text-gray-500">Get started by creating a new assessment report or generate a cutover runbook from your existing work.</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <Card className="bg-black text-white p-8 flex flex-col items-center justify-center">
          <FileText className="h-8 w-8 mb-4" />
          <div className="text-xl font-bold mb-2">New Assessment Report</div>
          <div className="mb-4 text-gray-400">AI-powered VM sizing and costing.</div>
          <span className="text-2xl">→</span>
        </Card>
        <Card className="bg-black text-white p-8 flex flex-col items-center justify-center">
          <BookText className="h-8 w-8 mb-4" />
          <div className="text-xl font-bold mb-2">Generate Cutover Runbook</div>
          <div className="mb-4 text-gray-400">Build detailed migration steps from an assessment.</div>
          <span className="text-2xl">→</span>
        </Card>
      </div>
      {/* Cloud Readiness Analysis and Plan Section */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">Cloud Readiness Analysis and Plan</h2>
        <FileUpload onDataParsed={handleDataParsed} />
        {cloudReadinessData.length > 0 && (
          <CloudReadinessTable data={cloudReadinessData} />
        )}
      </section>
    </DashboardLayout>
  );
} 