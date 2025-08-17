"use client"
import { useEffect, useState } from 'react'
import { generateCafSubscriptionXml } from '@/lib/generateCafSubscriptionXml'

export default function TestCafSimplePage() {
  const [xml, setXml] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      console.log('🔍 [TestCafSimplePage] Generating CAF subscription XML...')
      const generatedXml = generateCafSubscriptionXml()
      setXml(generatedXml)
      console.log('✅ [TestCafSimplePage] CAF subscription XML generated successfully')
    } catch (err) {
      console.error('❌ [TestCafSimplePage] Error generating CAF subscription XML:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            CAF Subscription Architecture - XML Debug
          </h1>
          <p className="text-gray-600">
            Raw XML output for debugging the CAF subscription architecture.
          </p>
        </div>

        {/* XML Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Generated XML Content
                </h2>
                <p className="text-gray-600 mt-1">
                  XML Length: {xml.length} characters
                </p>
              </div>
              <button
                onClick={() => {
                  const blob = new Blob([xml], { type: 'application/xml' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'caf-subscription-architecture.xml';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download XML
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="bg-gray-100 rounded-lg p-4 overflow-auto max-h-96">
              <pre className="text-xs text-gray-800 whitespace-pre-wrap">{xml}</pre>
            </div>
          </div>
        </div>

        {/* Analysis */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">XML Analysis</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Contains mxfile tag: {xml.includes('<mxfile') ? 'Yes' : 'No'}
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Contains subscription containers: {xml.includes('sub-mgmt') ? 'Yes' : 'No'}
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Contains VNet containers: {xml.includes('hub-vnet') ? 'Yes' : 'No'}
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Contains subnet containers: {xml.includes('subnet-hub-gateway') ? 'Yes' : 'No'}
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Contains Azure icons: {xml.includes('/azure-icons/') ? 'Yes' : 'No'}
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Contains image shapes: {xml.includes('shape=image') ? 'Yes' : 'No'}
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Icon Analysis</h3>
            <div className="text-sm text-gray-600">
              {(() => {
                const iconMatches = xml.match(/\/azure-icons\/[^"]+\.svg/g);
                if (iconMatches) {
                  const uniqueIcons = [...new Set(iconMatches)];
                  return (
                    <div>
                      <p className="mb-2">Found {uniqueIcons.length} unique Azure icons:</p>
                      <ul className="space-y-1">
                        {uniqueIcons.map((icon, index) => (
                          <li key={index} className="flex items-center">
                            <span className="text-blue-500 mr-2">•</span>
                            {icon.replace('/azure-icons/', '')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }
                return <p className="text-red-500">No Azure icons found</p>;
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
