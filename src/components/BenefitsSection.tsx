"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cpu, DollarSign, Shield, Users } from "lucide-react"

export default function BenefitsSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="grid gap-10 sm:px-10 md:gap-16 md:grid-cols-2">
          <div className="space-y-4">
            <div className="inline-block rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-600">Efficiency</div>
            <h2 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem]">
              Reduce Migration Time by 70%
            </h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed">
              Automate repetitive tasks and leverage AI insights to accelerate your cloud migration projects while maintaining quality and compliance standards.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center space-x-2">
                <Cpu className="h-5 w-5 text-blue-600" />
                <span className="text-sm">Automated VM Sizing</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span className="text-sm">Cost Optimization</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-sm">Security Best Practices</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm">Team Collaboration</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Traditional Approach</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">4-6 weeks</div>
                  <p className="text-sm text-gray-500">Manual assessment and planning</p>
                </CardContent>
              </Card>
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-blue-900">With Ingram Micro Professional Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">1-2 weeks</div>
                  <p className="text-sm text-blue-700">AI-powered automation</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 