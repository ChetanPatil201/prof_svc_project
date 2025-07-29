"use client"
import DashboardLayout from "@/components/DashboardLayout"
import { RunbookForm } from "@/components/RunbookForm"

export default function CutoverRunbooksPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <RunbookForm />
      </div>
    </DashboardLayout>
  )
} 