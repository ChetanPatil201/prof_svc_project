"use client"
import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquareText, FileCheck, BookText } from "lucide-react"
// import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function RunbookForm({ disabled }: { disabled?: boolean }) {
  const [assessmentReportId, setAssessmentReportId] = useState<string>("")
  const [meetingTranscript, setMeetingTranscript] = useState<File | null>(null)
  const [userNotes, setUserNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const meetingTranscriptRef = useRef<HTMLInputElement>(null)

  // const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // In a real application, you would send these files to a server
    // For now, we'll just show a success message.

    // Simulate AI processing and runbook generation
    await new Promise((resolve) => setTimeout(resolve, 2500))

    // toast({
    //   title: "Runbook Generation Request Submitted!",
    //   description: "The cutover runbook is being prepared and will be available soon.",
    //   variant: "default",
    // })

    // Reset form
    setAssessmentReportId("")
    setMeetingTranscript(null)
    setUserNotes("")
    if (meetingTranscriptRef.current) meetingTranscriptRef.current.value = ""

    setIsSubmitting(false)
  }

  return (
    <>
      <CardHeader className="text-center">
        <BookText className="mx-auto h-12 w-12 text-blue-600" />
        <CardTitle className="text-3xl font-bold mt-2">Generate Cutover Runbook</CardTitle>
        <CardDescription>
          Create a detailed migration runbook based on an assessment report and additional context.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="assessment-report-select" className="flex items-center gap-2 mb-2">
              <FileCheck className="h-4 w-4" />
              Select Existing Assessment Report
            </Label>
            <Select onValueChange={setAssessmentReportId} value={assessmentReportId} required disabled={disabled}>
              <SelectTrigger id="assessment-report-select">
                <SelectValue placeholder="Select an assessment report" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="report-123">Assessment Report #123 (Completed)</SelectItem>
                <SelectItem value="report-456">Assessment Report #456 (Completed)</SelectItem>
                <SelectItem value="report-789" disabled>
                  Assessment Report #789 (In Progress)
                </SelectItem>
              </SelectContent>
            </Select>
            {!assessmentReportId && (
              <p className="text-sm text-red-500 mt-1">An assessment report is required to generate a runbook.</p>
            )}
          </div>

          <div>
            <Label htmlFor="meeting-transcript-runbook" className="flex items-center gap-2 mb-2">
              <MessageSquareText className="h-4 w-4" />
              Meeting Transcript (for Cutover Planning)
            </Label>
            <Input
              id="meeting-transcript-runbook"
              type="file"
              accept=".txt,.srt"
              onChange={(e) => setMeetingTranscript(e.target.files ? e.target.files[0] : null)}
              ref={meetingTranscriptRef}
              disabled={disabled}
            />
            {meetingTranscript && <p className="text-sm text-gray-500 mt-1">Selected: {meetingTranscript.name}</p>}
          </div>

          <div>
            <Label htmlFor="user-notes-runbook" className="mb-2 block">
              User Notes / Specific Runbook Instructions
            </Label>
            <Textarea
              id="user-notes-runbook"
              placeholder="e.g., 'Include detailed rollback plan', 'Specific downtime window requirements', 'Post-migration validation steps'..."
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              rows={5}
              disabled={disabled}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting || !assessmentReportId || disabled}
          >
            {isSubmitting ? "Generating Runbook..." : "Generate Cutover Runbook"}
          </Button>
        </form>
      </CardContent>
    </>
  )
} 