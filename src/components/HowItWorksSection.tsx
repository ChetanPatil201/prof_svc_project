"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3 } from "lucide-react"

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Simple 4-Step Process</h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              From context gathering to final runbook, our streamlined process ensures efficient migrations.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold">1</div>
              <div>
                <h3 className="text-xl font-bold">Upload Context & Transcripts</h3>
                <p className="text-gray-500">Provide meeting transcripts, requirements, and existing infrastructure details.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold">2</div>
              <div>
                <h3 className="text-xl font-bold">AI Analysis & Assessment</h3>
                <p className="text-gray-500">Our AI analyzes your requirements and generates comprehensive assessment reports.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold">3</div>
              <div>
                <h3 className="text-xl font-bold">Review & Validate</h3>
                <p className="text-gray-500">Review AI-generated recommendations and validate against your requirements.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold">4</div>
              <div>
                <h3 className="text-xl font-bold">Generate Runbook</h3>
                <p className="text-gray-500">Automatically create detailed migration runbooks with step-by-step procedures.</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-75"></div>
              <Card className="relative bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                    Migration Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">VM Assessment</span>
                    <Badge variant="secondary">Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cost Analysis</span>
                    <Badge variant="secondary">Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Landing Zone</span>
                    <Badge className="bg-blue-600">In Progress</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Runbook Generation</span>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 