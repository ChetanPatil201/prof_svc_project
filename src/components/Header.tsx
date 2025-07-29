"use client"
import Link from "next/link"
import { Cloud } from "lucide-react"
import Image from "next/image"

export default function Header() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <Link className="flex items-center justify-center" href="/">
        <Image src="/ingram-micro-logo.png" alt="Ingram Micro Logo" width={120} height={32} priority />
        <span className="ml-2 text-xl font-bold text-gray-900">Ingram Micro Professional Services</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
        <Link className="text-sm font-medium hover:text-blue-600 transition-colors" href="#features">Features</Link>
        <Link className="text-sm font-medium hover:text-blue-600 transition-colors" href="#how-it-works">How It Works</Link>
        <Link className="text-sm font-medium hover:text-blue-600 transition-colors" href="#pricing">Pricing</Link>
        <Link className="text-sm font-medium hover:text-blue-600 transition-colors" href="#contact">Contact</Link>
        <Link href="/signin" className="text-sm font-medium hover:text-blue-600 transition-colors px-4 py-2 border border-blue-600 rounded ml-4">Sign In</Link>
        <Link href="/signup" className="text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors px-4 py-2 rounded ml-2">Sign Up</Link>
      </nav>
    </header>
  )
} 