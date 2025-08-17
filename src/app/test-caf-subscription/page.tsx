"use client"
import { useEffect, useState } from 'react'
import { generateCafSubscriptionXml, downloadCafSubscriptionXml } from '@/lib/generateCafSubscriptionXml'
import ArchitectureDrawioEmbed from '@/components/ArchitectureDrawioEmbed'

export default function TestCafSubscriptionPage() {
  const [xml, setXml] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      console.log('🔍 [TestCafSubscriptionPage] Generating CAF subscription XML...')
      const generatedXml = generateCafSubscriptionXml()
      setXml(generatedXml)
      console.log('✅ [TestCafSubscriptionPage] CAF subscription XML generated successfully')
    } catch (err) {
      console.error('❌ [TestCafSubscriptionPage] Error generating CAF subscription XML:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleExport = (files: { png?: Blob; svg?: string; xml: string }) => {
    console.log('🔍 [TestCafSubscriptionPage] Export requested:', Object.keys(files))
  }

  const handleDownloadXml = () => {
    if (xml) {
      downloadCafSubscriptionXml(xml, 'caf-subscription-architecture.xml')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating CAF Subscription Architecture...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Generating Architecture</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            CAF Subscription Architecture Test
          </h1>
          <p className="text-gray-600">
            Testing the new CAF subscription view with parent-relative geometry and proper Draw.io XML export.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  CAF Subscription Architecture Diagram
                </h2>
                <p className="text-gray-600 mt-1">
                  XML Length: {xml.length} characters
                </p>
              </div>
              <button
                onClick={handleDownloadXml}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download XML
              </button>
            </div>
          </div>
          
          <div className="p-6">
                         {xml && (
               <ArchitectureDrawioEmbed
                 xml={xml}
                 onExport={handleExport}
               />
             )}
          </div>
        </div>

        {/* Architecture Details */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Features */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">CAF Subscription Features</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Parent-relative geometry for all child nodes
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Subscription containers (Management, Connectivity, Landing Zones)
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Hub VNet with Gateway, Firewall, and Bastion subnets
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Spoke VNets with Web, App, and DB subnets
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Management services (Observability, Policy, Defender)
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Proper edge connections with deduplication
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Azure icon mapping for all node types
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                CAF-compliant color scheme and styling
              </li>
            </ul>
          </div>

          {/* Technical Details */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Implementation</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">🔧</span>
                <code className="bg-gray-100 px-2 py-1 rounded">CafSubscriptionBuilder</code> - Model generation
              </li>
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">🔧</span>
                <code className="bg-gray-100 px-2 py-1 rounded">CafSubscriptionLayout</code> - Parent-relative positioning
              </li>
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">🔧</span>
                <code className="bg-gray-100 px-2 py-1 rounded">DrawioExporter</code> - XML generation with validation
              </li>
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">🔧</span>
                <code className="bg-gray-100 px-2 py-1 rounded">placeGridRel()</code> - Helper for relative positioning
              </li>
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">🔧</span>
                <code className="bg-gray-100 px-2 py-1 rounded">meta.boundsRel</code> - Parent-relative coordinates
              </li>
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">🔧</span>
                <code className="bg-gray-100 px-2 py-1 rounded">AZURE_ICON_MAP</code> - Icon path mapping
              </li>
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">🔧</span>
                <code className="bg-gray-100 px-2 py-1 rounded">validateModel()</code> - Pre-export validation
              </li>
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">🔧</span>
                <code className="bg-gray-100 px-2 py-1 rounded">STYLE_MAP</code> - CAF-compliant styling
              </li>
            </ul>
          </div>
        </div>

        {/* Architecture Structure */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Architecture Structure</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <div className="font-mono">
              <div className="text-blue-600">📁 Management Subscription</div>
              <div className="ml-4">├── 📊 Observability</div>
              <div className="ml-8">├── 📈 Azure Monitor</div>
              <div className="ml-8">└── 📋 Log Analytics</div>
              <div className="ml-4">├── ⚖️ Azure Policy</div>
              <div className="ml-4">└── 🛡️ Microsoft Defender</div>
            </div>
            <div className="font-mono">
              <div className="text-purple-600">📁 Connectivity Subscription</div>
              <div className="ml-4">└── 🌐 Hub VNet (10.0.0.0/16)</div>
              <div className="ml-8">├── 🔗 GatewaySubnet (10.0.2.0/27)</div>
              <div className="ml-8">├── 🔥 AzureFirewallSubnet (10.0.1.0/26)</div>
              <div className="ml-12">└── 🛡️ Azure Firewall</div>
              <div className="ml-8">└── 🏰 AzureBastionSubnet (10.0.3.0/26)</div>
              <div className="ml-12">└── 🏰 Azure Bastion</div>
            </div>
            <div className="font-mono">
              <div className="text-green-600">📁 Landing Zone - Production</div>
              <div className="ml-4">└── 🌐 Production Spoke VNet (10.1.0.0/16)</div>
              <div className="ml-8">├── 🌐 Web Subnet (10.1.1.0/24)</div>
              <div className="ml-12">└── 💻 Web Tier (2 VMs)</div>
              <div className="ml-8">├── ⚙️ App Subnet (10.1.2.0/24)</div>
              <div className="ml-12">└── 💻 App Tier (2 VMs)</div>
              <div className="ml-8">└── 🗄️ DB Subnet (10.1.3.0/24)</div>
              <div className="ml-12">└── 💻 DB Tier (1 VM)</div>
            </div>
            <div className="font-mono">
              <div className="text-green-600">📁 Landing Zone - Non-Production</div>
              <div className="ml-4">└── 🌐 Non-Production Spoke VNet (10.2.0.0/16)</div>
              <div className="ml-8">├── 🌐 Web Subnet (10.2.1.0/24)</div>
              <div className="ml-12">└── 💻 Web Tier (1 VM)</div>
              <div className="ml-8">├── ⚙️ App Subnet (10.2.2.0/24)</div>
              <div className="ml-12">└── 💻 App Tier (1 VM)</div>
              <div className="ml-8">└── 🗄️ DB Subnet (10.2.3.0/24)</div>
              <div className="ml-12">└── 💻 DB Tier (1 VM)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
