"use client"
import { useEffect, useState } from 'react'
import { generateCafXml, downloadCafXml } from '@/lib/generateCafXml'
import ArchitectureDrawioEmbed from '@/components/ArchitectureDrawioEmbed'

export default function TestCafPage() {
  const [xml, setXml] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      console.log('🔍 [TestCafPage] Generating CAF XML...')
      const generatedXml = generateCafXml()
      setXml(generatedXml)
      console.log('✅ [TestCafPage] CAF XML generated successfully')
    } catch (err) {
      console.error('❌ [TestCafPage] Error generating CAF XML:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleExport = (files: { png?: Blob; svg?: string; xml: string }) => {
    console.log('🔍 [TestCafPage] Export requested:', Object.keys(files))
  }

  const handleDownloadXml = () => {
    if (xml) {
      downloadCafXml(xml, 'caf-hub-spoke-architecture.xml')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating CAF Architecture Diagram...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ Error</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            CAF Hub-and-Spoke Architecture Test
          </h1>
          <p className="text-gray-600">
            Testing the improved CAF architecture diagram with parent-relative geometry
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Generated Architecture Diagram
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
      </div>
    </div>
  )
}
