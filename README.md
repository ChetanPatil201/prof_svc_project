# Professional Services Assessment Tool

A Next.js 15 application for generating comprehensive Azure migration assessment reports and architecture diagrams using AI.

## Features

- **Assessment Report Generation**: Upload Azure Migrate data and generate detailed reports
- **Architecture Diagram Generation**: Create PlantUML diagrams from assessment data
- **AI-Powered Analysis**: Leverage Azure OpenAI for intelligent recommendations
- **Cost Optimization**: Analyze and compare pricing options
- **Migration Planning**: Generate step-by-step migration runbooks

## API Routes

### Generate Architecture Diagram

**Endpoint**: `POST /api/generate-diagram`

**Description**: Generates a PlantUML architecture diagram blueprint based on Azure Migrate assessment data.

**Request Body**:
```json
{
  "reportData": {
    "assessedMachines": [
      {
        "machine": "VM-001",
        "operatingSystem": "Windows Server 2019",
        "cores": 4,
        "memoryMb": 8192,
        "storageGb": 100,
        "computeMonthlyCostEstimateUsd": 150.00,
        "securityMonthlyCostEstimateUsd": 25.00,
        "azureReadinessIssues": "",
        "securityReadiness": "Ready",
        "dataCollectionIssues": "",
        "networkAdapters": "2",
        "ipAddress": "192.168.1.10",
        "networkInMbps": 100,
        "networkOutMbps": 50
      }
    ],
    "assessedDisks": [
      {
        "machine": "VM-001",
        "diskName": "Disk-001",
        "recommendedDiskType": "Premium SSD",
        "monthlyCostEstimate": 25.00,
        "sourceDiskSizeGb": 100,
        "targetDiskSizeGb": 100
      }
    ]
  }
}
```

**Response**:
```json
{
  "success": true,
  "blueprint": "@startuml\n!theme plain\n... PlantUML diagram code ...\n@enduml",
  "processingTime": 2450,
  "summary": {
    "totalVMs": 5,
    "totalCost": 650.00,
    "migrationStrategy": "Lift and Shift"
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message describing the issue",
  "processingTime": 1200
}
```

**Features**:
- Analyzes workload distribution (Windows vs Linux VMs)
- Calculates total compute, storage, and security costs
- Assesses networking requirements and security risks
- Generates CAF-aligned Azure Landing Zone diagrams
- Uses PlantUML format for easy visualization
- Configurable diagram generation options
- Built-in validation for PlantUML code
- Support for custom styling and themes
- **Enhanced Error Handling**: Comprehensive error handling with retry logic
- **Retry Mechanism**: Up to 2 retries with exponential backoff for Azure OpenAI failures
- **Input Validation**: Robust validation of report data structure
- **Performance Monitoring**: Processing time tracking and detailed logging
- **Status Codes**: Proper HTTP status codes (200, 400, 422, 500, 503)

## React Components

### ArchitectureDiagramViewer

A comprehensive React component for displaying Azure architecture diagrams generated from assessment data.

**Features**:
- **Automatic Diagram Generation**: Fetches diagrams from the API endpoint
- **PlantUML Integration**: Converts PlantUML code to images using PlantUML web service
- **Interactive Controls**: Zoom in/out, fullscreen mode, download functionality
- **Loading States**: Animated loading indicators during diagram generation
- **Error Handling**: Comprehensive error handling with retry mechanisms
- **Responsive Design**: Works on desktop and mobile devices
- **Summary Information**: Displays VM count, costs, and migration strategy

**Basic Usage**:
```tsx
import ArchitectureDiagramViewer from '@/components/ArchitectureDiagramViewer';

function MyComponent() {
  const reportData = {
    assessedMachines: [...],
    assessedDisks: [...]
  };

  return (
    <ArchitectureDiagramViewer
      reportData={reportData}
      title="My Architecture Diagram"
      description="Generated from assessment data"
    />
  );
}
```

**Advanced Usage with Callbacks**:
```tsx
function MyComponent() {
  const handleDiagramGenerated = (response) => {
    console.log('Diagram generated:', response);
  };

  const handleError = (error) => {
    console.error('Error:', error);
  };

  return (
    <ArchitectureDiagramViewer
      reportData={reportData}
      onDiagramGenerated={handleDiagramGenerated}
      onError={handleError}
      autoGenerate={true}
    />
  );
}
```

**Props**:
- `reportData`: Azure Migrate assessment data
- `reportId`: Alternative to reportData for fetching by ID
- `title`: Diagram card title
- `description`: Diagram card description
- `className`: Custom CSS classes
- `autoGenerate`: Whether to auto-generate on mount
- `onDiagramGenerated`: Success callback function
- `onError`: Error callback function

**User Interactions**:
- **Zoom Controls**: Zoom in/out with percentage display
- **Fullscreen Mode**: Toggle fullscreen view
- **Download**: Save diagram as PNG image
- **Regenerate**: Manually trigger diagram generation
- **Control Visibility**: Toggle zoom controls on/off

## Environment Variables

Required for Azure OpenAI integration:

```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── generate-diagram/     # Architecture diagram generation
│   │   ├── azure-openai/        # Azure OpenAI integration
│   │   └── ...                  # Other API routes
│   ├── dashboard/               # Main dashboard pages
│   └── ...                      # Other app pages
├── components/                  # Reusable UI components
├── lib/                        # Utility functions and integrations
│   ├── generateDiagramBlueprint.ts  # PlantUML diagram generation utility
│   ├── azureOpenAI.ts          # Azure OpenAI client
│   └── ...                     # Other utilities
├── types/                      # TypeScript type definitions
└── public/                     # Static assets
```

## Usage Examples

### Generate Architecture Diagram

#### Using the API Route
```typescript
const response = await fetch('/api/generate-diagram', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    reportData: {
      assessedMachines: [...],
      assessedDisks: [...]
    }
  })
});

const result = await response.json();

if (result.success) {
  console.log(`✅ Diagram generated in ${result.processingTime}ms`);
  console.log(`📊 Summary: ${result.summary.totalVMs} VMs, $${result.summary.totalCost}/month`);
  // Use the PlantUML blueprint to render the diagram
  const plantUmlCode = result.blueprint;
} else {
  console.error(`❌ Error: ${result.error}`);
}

#### Using the Utility Function Directly
```typescript
import { generateDiagramBlueprint, type AssessmentSummary } from '@/lib/generateDiagramBlueprint';

const assessmentSummary: AssessmentSummary = {
  workloads: {
    totalVMs: 5,
    windowsVMs: 3,
    linuxVMs: 2,
    totalCores: 16,
    totalMemoryGB: 64,
    totalStorageGB: 500,
    averageCpuUsage: 45,
    averageMemoryUsage: 60
  },
  networking: {
    totalNetworkAdapters: 8,
    averageNetworkInMbps: 75,
    averageNetworkOutMbps: 40,
    uniqueIPRanges: 2
  },
  securityRisks: {
    machinesWithIssues: 1,
    securityReadinessIssues: 1,
    dataCollectionIssues: 0
  },
  costEstimates: {
    compute: 450.00,
    storage: 125.00,
    security: 75.00,
    total: 650.00
  },
  recommendations: {
    migrationStrategy: 'Lift and Shift',
    networkSegmentation: 'Multi-subnet',
    securityPriority: 'High'
  }
};

const plantUmlCode = await generateDiagramBlueprint(assessmentSummary, {
  maxTokens: 3000,
  temperature: 0.2,
  includeSecurityGroups: true
});
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
