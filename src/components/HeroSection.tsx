"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, ArrowRight, CheckCircle } from "lucide-react"

export default function HeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container px-4 md:px-6 ml-8">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <Badge variant="secondary" className="mb-4">
              <Zap className="w-3 h-3 mr-1" />
              AI-Powered Cloud Migration
            </Badge>
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              Streamline Your Cloud Migration Journey
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
              Accelerate cloud migrations with AI-powered TCO analysis, automated assessment reports, and intelligent runbook generation. Built for cloud engineers, by cloud engineers.
            </p>
          </div>
          <div className="space-x-4">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg">
              Watch Demo
            </Button>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              No credit card required
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              Azure certified
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 