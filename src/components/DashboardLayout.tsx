"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { FileText, BookText, LayoutDashboard, Settings, User, LogOut } from "lucide-react"
import Image from "next/image"

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5 mr-2" /> },
  { href: "/dashboard/assessment-reports", label: "Assessment Reports", icon: <FileText className="h-5 w-5 mr-2" /> },
  { href: "/dashboard/cutover-runbooks", label: "Cutover Runbooks", icon: <BookText className="h-5 w-5 mr-2" /> },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const handleSignOut = () => {
    // Here you would clear auth/session if implemented
    router.push("/")
  }
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="flex flex-col items-center px-6 py-8 border-b">
          <Image src="/ingram-micro-logo.png" alt="Ingram Micro Logo" width={120} height={32} priority className="mb-3" />
          <span className="text-lg font-bold text-center text-gray-900 leading-tight">Ingram Micro<br/>Professional Services</span>
        </div>
        <nav className="flex-1 px-4 py-6">
          <div className="mb-4 text-xs text-gray-500 font-semibold">Navigation</div>
          <ul className="space-y-1">
            {navLinks.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center px-3 py-2 rounded transition-colors ${
                    pathname === link.href
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 mb-2 text-xs text-gray-500 font-semibold">Tools</div>
          <Link
            href="#"
            className="flex items-center px-3 py-2 rounded text-gray-700 hover:bg-gray-100"
          >
            <Settings className="h-5 w-5 mr-2" />
            Settings
          </Link>
        </nav>
        <div className="px-6 py-4 border-t flex flex-col gap-2 text-gray-600">
          <div className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            <span>Cloud Engineer</span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center mt-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-8">{children}</main>
    </div>
  )
} 