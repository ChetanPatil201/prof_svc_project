"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, FileText, Network, CheckCircle } from "lucide-react"

export default function FeaturesSection() {
  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Everything You Need for Cloud Migration
            </h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              From initial assessment to final migration, our platform provides comprehensive tools to ensure successful cloud transformations.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
          {/* TCO Analysis */}
          <Card className="relative overflow-hidden">
            <CardHeader>
              <Calculator className="h-10 w-10 text-blue-600" />
              <CardTitle>TCO Analysis</CardTitle>
              <CardDescription>
                Automated Total Cost of Ownership analysis using Azure Migrate tools with AI-enhanced insights.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Azure Migrate integration
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Cost optimization recommendations
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Multi-scenario analysis
                </li>
              </ul>
            </CardContent>
          </Card>
          {/* AI Assessment Reports */}
          <Card className="relative overflow-hidden">
            <CardHeader>
              <FileText className="h-10 w-10 text-blue-600" />
              <CardTitle>AI Assessment Reports</CardTitle>
              <CardDescription>
                Generate comprehensive assessment reports with VM sizing, costing, and landing zone design.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Automated VM right-sizing
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Landing zone blueprints
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Custom company templates
                </li>
              </ul>
            </CardContent>
          </Card>
          {/* Smart Runbooks */}
          <Card className="relative overflow-hidden">
            <CardHeader>
              <Network className="h-10 w-10 text-blue-600" />
              <CardTitle>Smart Runbooks</CardTitle>
              <CardDescription>
                AI-assisted runbook generation with step-by-step migration procedures and best practices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Automated procedure generation
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Risk mitigation steps
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Rollback procedures
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
} 