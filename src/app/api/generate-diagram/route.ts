/**
 * Enhanced Generate Diagram API Route
 * 
 * Dependencies:
 * npm install plantuml-encoder
 * 
 * This route generates PlantUML architecture diagrams from Azure Migrate assessment data
 * and renders them as images using the PlantUML server.
 * 
 * Features:
 * - PlantUML blueprint generation using Azure OpenAI
 * - Image rendering via PlantUML server
 * - Retry mechanism for network failures
 * - Comprehensive error handling
 * - Configurable PlantUML server URL
 * 
 * Environment Variables:
 * - PLANTUML_SERVER_URL: PlantUML server URL (defaults to public server)
 * - AZURE_OPENAI_ENDPOINT: Azure OpenAI endpoint
 * - AZURE_OPENAI_KEY: Azure OpenAI API key
 * - AZURE_OPENAI_DEPLOYMENT: Azure OpenAI deployment name
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateDiagramBlueprint, type AssessmentSummary } from '@/lib/generateDiagramBlueprint';
import { FullAssessmentReportData, ArchitectureAssessmentSummary } from '@/types/assessmentReport';

// PlantUML encoder for URL-safe encoding
let plantumlEncoder: any;
try {
  plantumlEncoder = require('plantuml-encoder');
} catch (error) {
  console.warn('⚠️ [Generate Diagram API] plantuml-encoder not installed. Please run: npm install plantuml-encoder');
  // Fallback encoding function
  plantumlEncoder = {
    encode: (text: string) => {
      try {
        return btoa(unescape(encodeURIComponent(text)));
      } catch (err) {
        throw new Error('Failed to encode PlantUML text');
      }
    }
  };
}

/**
 * Retry mechanism for Azure OpenAI API calls and PlantUML server requests
 * Implements exponential backoff with jitter for better reliability
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on validation errors or bad requests
      if (lastError.message.includes('Invalid PlantUML') || 
          lastError.message.includes('Report data is required')) {
        throw lastError;
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        console.error(`❌ [Generate Diagram API] Final retry attempt failed:`, lastError.message);
        throw lastError;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`🔄 [Generate Diagram API] Retry attempt ${attempt + 1}/${maxRetries + 1} in ${Math.round(delay)}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Validates the input report data structure
 */
function validateReportData(reportData: any): boolean {
  if (!reportData || typeof reportData !== 'object') {
    return false;
  }
  
  // Check if reportData has the expected structure
  const hasAssessedMachines = Array.isArray(reportData.assessedMachines);
  const hasAssessedDisks = Array.isArray(reportData.assessedDisks);
  
  return hasAssessedMachines || hasAssessedDisks;
}

/**
 * Validates PlantUML blueprint format
 */
function validatePlantUMLBlueprint(blueprint: string): boolean {
  if (!blueprint || typeof blueprint !== 'string') {
    return false;
  }
  
  // Check for basic PlantUML structure
  const hasStartUML = blueprint.includes('@startuml');
  const hasEndUML = blueprint.includes('@enduml');
  const hasContent = blueprint.length > 50; // Minimum content length
  
  return hasStartUML && hasEndUML && hasContent;
}

/**
 * Renders PlantUML blueprint to image URL
 * Fetches the rendered image from PlantUML server
 */
async function renderPlantUMLToImage(blueprint: string): Promise<string> {
  try {
    console.log('🖼️ [Generate Diagram API] Rendering PlantUML to image...');
    
    // Validate blueprint format
    if (!validatePlantUMLBlueprint(blueprint)) {
      throw new Error('Invalid PlantUML blueprint format');
    }
    
    // Log the PlantUML code for debugging (first 500 characters)
    console.log('🔍 [Generate Diagram API] PlantUML code preview:', blueprint.substring(0, 500) + '...');
    
    // Encode the PlantUML text
    const encoded = plantumlEncoder.encode(blueprint);
    console.log('✅ [Generate Diagram API] PlantUML encoded successfully');
    
    // Get PlantUML server URL from environment or use default
    const plantUMLServerUrl = process.env.PLANTUML_SERVER_URL || 'https://www.plantuml.com/plantuml';
    const imageUrl = `${plantUMLServerUrl}/png/${encoded}`;
    
    console.log('🔄 [Generate Diagram API] Fetching image from PlantUML server...');
    
    // Verify the image URL is accessible
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(imageUrl, { 
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`PlantUML server returned ${response.status}: ${response.statusText}`);
    }
    
    console.log('✅ [Generate Diagram API] Image URL verified successfully');
    return imageUrl;
    
  } catch (error) {
    console.error('❌ [Generate Diagram API] PlantUML rendering failed:', error);
    throw new Error(`Failed to render PlantUML diagram: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Function to analyze Azure Migrate report data and create an assessment summary
 * This function processes raw assessment data and converts it to a structured summary
 * for diagram generation
 */
function analyzeMigrateReport(reportData: any): ArchitectureAssessmentSummary {
  // Extract machines and disks from the report data with safe defaults
  const machines = reportData.assessedMachines || [];
  const disks = reportData.assessedDisks || [];
  
  // Analyze workloads with comprehensive data processing
  const workloads = {
    totalVMs: machines.length,
    windowsVMs: machines.filter((m: any) => 
      m.operatingSystem?.toLowerCase().includes('windows')
    ).length,
    linuxVMs: machines.filter((m: any) => 
      m.operatingSystem?.toLowerCase().includes('linux')
    ).length,
    totalCores: machines.reduce((sum: number, m: any) => sum + (m.cores || 0), 0),
    totalMemoryGB: machines.reduce((sum: number, m: any) => sum + (m.memoryMb || 0) / 1024, 0),
    totalStorageGB: machines.reduce((sum: number, m: any) => sum + (m.storageGb || 0), 0),
    averageCpuUsage: machines.length > 0 
      ? machines.reduce((sum: number, m: any) => sum + (m.cpuUsagePercent || 0), 0) / machines.length
      : 0,
    averageMemoryUsage: machines.length > 0
      ? machines.reduce((sum: number, m: any) => sum + (m.memoryUsagePercent || 0), 0) / machines.length
      : 0,
  };

  // Analyze networking with robust parsing
  const networking = {
    totalNetworkAdapters: machines.reduce((sum: number, m: any) => {
      const adapters = m.networkAdapters ? parseInt(m.networkAdapters) : 0;
      return sum + (isNaN(adapters) ? 0 : adapters);
    }, 0),
    averageNetworkInMbps: machines.length > 0
      ? machines.reduce((sum: number, m: any) => sum + (m.networkInMbps || 0), 0) / machines.length
      : 0,
    averageNetworkOutMbps: machines.length > 0
      ? machines.reduce((sum: number, m: any) => sum + (m.networkOutMbps || 0), 0) / machines.length
      : 0,
    uniqueIPRanges: new Set(machines.map((m: any) => {
      const ip = m.ipAddress || '';
      const parts = ip.split('.');
      return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : '';
    }).filter(Boolean)).size,
  };

  // Analyze security risks with comprehensive checks
  const securityRisks = {
    machinesWithIssues: machines.filter((m: any) => 
      m.azureReadinessIssues && m.azureReadinessIssues.trim() !== ''
    ).length,
    securityReadinessIssues: machines.filter((m: any) => 
      m.securityReadiness && m.securityReadiness.toLowerCase().includes('issue')
    ).length,
    dataCollectionIssues: machines.filter((m: any) => 
      m.dataCollectionIssues && m.dataCollectionIssues.trim() !== ''
    ).length,
  };

  // Analyze storage with detailed categorization
  const storage = {
    totalDisks: disks.length,
    premiumDisks: disks.filter((d: any) => 
      d.recommendedDiskType?.toLowerCase().includes('premium')
    ).length,
    standardDisks: disks.filter((d: any) => 
      d.recommendedDiskType?.toLowerCase().includes('standard')
    ).length,
    totalStorageCost: disks.reduce((sum: number, d: any) => sum + (d.monthlyCostEstimate || 0), 0),
  };

  // Calculate comprehensive costs
  const totalComputeCost = machines.reduce((sum: number, m: any) => 
    sum + (m.computeMonthlyCostEstimateUsd || 0), 0
  );
  const totalStorageCost = storage.totalStorageCost;
  const totalSecurityCost = machines.reduce((sum: number, m: any) => 
    sum + (m.securityMonthlyCostEstimateUsd || 0), 0
  );

  return {
    workloads,
    networking,
    securityRisks,
    storage,
    costs: {
      compute: totalComputeCost,
      storage: totalStorageCost,
      security: totalSecurityCost,
      total: totalComputeCost + totalStorageCost + totalSecurityCost,
    },
    recommendations: {
      migrationStrategy: workloads.windowsVMs > workloads.linuxVMs ? 'Lift and Shift' : 'Rehost',
      networkSegmentation: networking.uniqueIPRanges > 1 ? 'Multi-subnet' : 'Single-subnet',
      securityPriority: securityRisks.machinesWithIssues > 0 ? 'High' : 'Standard',
    },
  };
}

/**
 * Converts ArchitectureAssessmentSummary to AssessmentSummary format
 * This ensures compatibility with the generateDiagramBlueprint function
 */
function convertToAssessmentSummary(assessmentSummary: ArchitectureAssessmentSummary): AssessmentSummary {
  return {
    workloads: {
      totalVMs: assessmentSummary.workloads.totalVMs,
      windowsVMs: assessmentSummary.workloads.windowsVMs,
      linuxVMs: assessmentSummary.workloads.linuxVMs,
      totalCores: assessmentSummary.workloads.totalCores,
      totalMemoryGB: assessmentSummary.workloads.totalMemoryGB,
      totalStorageGB: assessmentSummary.workloads.totalStorageGB,
      averageCpuUsage: assessmentSummary.workloads.averageCpuUsage,
      averageMemoryUsage: assessmentSummary.workloads.averageMemoryUsage,
    },
    networking: {
      totalNetworkAdapters: assessmentSummary.networking.totalNetworkAdapters,
      averageNetworkInMbps: assessmentSummary.networking.averageNetworkInMbps,
      averageNetworkOutMbps: assessmentSummary.networking.averageNetworkOutMbps,
      uniqueIPRanges: assessmentSummary.networking.uniqueIPRanges,
    },
    securityRisks: {
      machinesWithIssues: assessmentSummary.securityRisks.machinesWithIssues,
      securityReadinessIssues: assessmentSummary.securityRisks.securityReadinessIssues,
      dataCollectionIssues: assessmentSummary.securityRisks.dataCollectionIssues,
    },
    costEstimates: {
      compute: assessmentSummary.costs.compute,
      storage: assessmentSummary.costs.storage,
      security: assessmentSummary.costs.security,
      total: assessmentSummary.costs.total,
    },
    recommendations: {
      migrationStrategy: assessmentSummary.recommendations.migrationStrategy,
      networkSegmentation: assessmentSummary.recommendations.networkSegmentation,
      securityPriority: assessmentSummary.recommendations.securityPriority,
    },
  };
}

/**
 * POST handler for generating architecture diagram blueprints
 * 
 * This endpoint:
 * 1. Validates incoming report data
 * 2. Analyzes the data to create an assessment summary
 * 3. Converts the summary to the format expected by generateDiagramBlueprint
 * 4. Generates a PlantUML diagram with retry logic
 * 5. Returns the blueprint with proper error handling
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse and validate the request body
    const body = await req.json();
    const { reportData } = body;
    
    // Enhanced input validation
    if (!validateReportData(reportData)) {
      console.error('❌ [Generate Diagram API] Invalid report data structure');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid report data structure. Please provide assessedMachines and/or assessedDisks arrays.' 
        },
        { status: 400 }
      );
    }

    console.log('🔄 [Generate Diagram API] Processing report data...');
    
    // Analyze the migrate report to get assessment summary
    const assessmentSummary = analyzeMigrateReport(reportData);
    
    console.log(`📊 [Generate Diagram API] Analyzed ${assessmentSummary.workloads.totalVMs} VMs, ${assessmentSummary.storage.totalDisks} disks`);

    // Convert to the format expected by generateDiagramBlueprint
    const diagramSummary = convertToAssessmentSummary(assessmentSummary);

    // Generate the diagram blueprint using the utility function with retry logic
    const plantUmlCode = await retryWithBackoff(async () => {
      return await generateDiagramBlueprint(diagramSummary, {
        maxTokens: 3000,
        temperature: 0.2,
        includeSecurityGroups: true,
        includeLoadBalancers: true,
      });
    }, 2, 1000); // 2 retries with 1-second base delay

    console.log('🖼️ [Generate Diagram API] Generating image from PlantUML blueprint...');
    
    // Try to render PlantUML to image with retry mechanism, but don't fail if it doesn't work
    let imageUrl: string | null = null;
    try {
      imageUrl = await retryWithBackoff(async () => {
        return await renderPlantUMLToImage(plantUmlCode);
      }, 3, 2000); // 3 retries with 2-second base delay for PlantUML server
    } catch (renderError) {
      console.warn('⚠️ [Generate Diagram API] PlantUML rendering failed, returning blueprint only:', renderError);
      // Continue without image URL - the frontend can handle this
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ [Generate Diagram API] Diagram generated successfully in ${processingTime}ms${imageUrl ? ' with image' : ' (blueprint only)'}`);

    // Return success response with blueprint and optional image URL
    return NextResponse.json(
      { 
        success: true, 
        blueprint: plantUmlCode,
        imageUrl: imageUrl,
        processingTime,
        summary: {
          totalVMs: assessmentSummary.workloads.totalVMs,
          totalCost: assessmentSummary.costs.total,
          migrationStrategy: assessmentSummary.recommendations.migrationStrategy
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    // Enhanced error logging with context
    console.error('❌ [Generate Diagram API] Error:', {
      message: error.message,
      stack: error.stack,
      processingTime,
      timestamp: new Date().toISOString()
    });
    
    // Determine appropriate error response
    let statusCode = 500;
    let errorMessage = 'Failed to generate diagram';
    
    if (error.message.includes('Invalid report data')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes('Azure OpenAI')) {
      statusCode = 503; // Service unavailable for AI service issues
      errorMessage = 'AI service temporarily unavailable. Please try again.';
    } else if (error.message.includes('Invalid PlantUML') || error.message.includes('Failed to render PlantUML')) {
      statusCode = 422; // Unprocessable entity for validation errors
      errorMessage = error.message;
    } else if (error.message.includes('PlantUML server')) {
      statusCode = 503; // Service unavailable for PlantUML server issues
      errorMessage = 'Diagram rendering service temporarily unavailable. Please try again.';
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        processingTime
      },
      { status: statusCode }
    );
  }
}
