"use client"

import React from 'react';
import AzureArchitectureDiagram from '@/components/AzureArchitectureDiagram';
import { AssessmentReportData } from '@/types/assessmentReport';

// Sample assessment data for demonstration
const sampleAssessment: AssessmentReportData = {
  id: 'demo-assessment-001',
  clientName: 'Demo Corporation',
  assessmentDate: new Date().toISOString(),
  totalServers: 15,
  windowsServers: 10,
  linuxServers: 5,
  totalStorageTB: 2.5,
  targetRegion: 'East US',
  estimatedMonthlyCost: 8500,
  vmSummary: [
    {
      vmName: 'WEB-SRV-01',
      recommendedSku: 'Standard_D2s_v3',
      estimatedCost: 120,
      osType: 'Windows',
      cores: 2,
      memoryGB: 8,
      storageGB: 100
    },
    {
      vmName: 'APP-SRV-01',
      recommendedSku: 'Standard_D4s_v3',
      estimatedCost: 240,
      osType: 'Windows',
      cores: 4,
      memoryGB: 16,
      storageGB: 200
    },
    {
      vmName: 'DB-SRV-01',
      recommendedSku: 'Standard_D8s_v3',
      estimatedCost: 480,
      osType: 'Linux',
      cores: 8,
      memoryGB: 32,
      storageGB: 500
    }
  ],
  recommendations: [
    'Implement Hub-Spoke network architecture for better security and management',
    'Use Azure Firewall for centralized network security',
    'Deploy Azure Monitor and Log Analytics for comprehensive monitoring',
    'Implement Azure Key Vault for secure secret management',
    'Consider Azure SQL Database for managed database services'
  ],
  risks: [
    'Network security configuration complexity',
    'Potential cost overruns without proper monitoring',
    'Data migration challenges'
  ],
  nextSteps: [
    'Review and approve architecture design',
    'Set up Azure subscription and resource groups',
    'Begin network infrastructure deployment',
    'Plan and execute data migration strategy'
  ]
};

export default function TestAzureArchitecturePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Azure Architecture Diagram Demo
        </h1>
        <p className="text-gray-600 max-w-4xl">
          This page demonstrates the interactive Azure architecture diagram component built with ReactFlow. 
          The diagram shows different Azure architecture patterns including Hub-Spoke, Simple, and CAF (Cloud Adoption Framework) layouts.
          You can switch between different layouts, toggle visibility of components, and export the diagram as JSON.
        </p>
      </div>

      <div className="space-y-8">
        {/* Architecture Diagram */}
        <AzureArchitectureDiagram 
          assessment={sampleAssessment}
          className="w-full"
        />

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Interactive Controls</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Switch between Hub-Spoke, Simple, and CAF layouts</li>
              <li>• Toggle visibility of security and observability components</li>
              <li>• Show/hide non-production environments</li>
              <li>• Export diagram as JSON for further processing</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Azure Services</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Virtual Machines with SKU recommendations</li>
              <li>• Virtual Networks and subnets</li>
              <li>• Azure Firewall and Load Balancer</li>
              <li>• Azure SQL Database and Storage</li>
              <li>• Key Vault and monitoring services</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Visual Features</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Color-coded nodes by Azure service layer</li>
              <li>• Interactive connections with labels</li>
              <li>• Mini-map for navigation</li>
              <li>• Zoom and pan controls</li>
              <li>• Legend showing service categories</li>
            </ul>
          </div>
        </div>

        {/* Sample Data */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sample Assessment Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Infrastructure Summary</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>• Total Servers: {sampleAssessment.totalServers}</div>
                <div>• Windows Servers: {sampleAssessment.windowsServers}</div>
                <div>• Linux Servers: {sampleAssessment.linuxServers}</div>
                <div>• Total Storage: {sampleAssessment.totalStorageTB} TB</div>
                <div>• Target Region: {sampleAssessment.targetRegion}</div>
                <div>• Estimated Monthly Cost: ${sampleAssessment.estimatedMonthlyCost.toLocaleString()}</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Key Recommendations</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                {sampleAssessment.recommendations.slice(0, 4).map((rec, index) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
