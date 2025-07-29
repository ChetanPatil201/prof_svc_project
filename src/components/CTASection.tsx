"use client"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function CTASection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-blue-600">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
              Ready to Transform Your Cloud Migrations?
            </h2>
            <p className="mx-auto max-w-[600px] text-blue-100 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Join hundreds of cloud engineers who are already using Ingram Micro Professional Services to streamline their migration projects.
            </p>
          </div>
          <div className="space-x-4">
            <Button size="lg" variant="secondary">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
} 