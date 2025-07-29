"use client"

import Header from "../components/Header"
import HeroSection from "../components/HeroSection"
import FeaturesSection from "../components/FeaturesSection"
import HowItWorksSection from "../components/HowItWorksSection"
import BenefitsSection from "@/components/BenefitsSection"
import CTASection from "@/components/CTASection"
import Footer from "../components/Footer" 

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <BenefitsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
