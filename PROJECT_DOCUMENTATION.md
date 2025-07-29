# Azure Migrate Assessment Report Generator - Project Documentation

## 📋 Project Overview

This is a Next.js application that generates comprehensive Azure migration assessment reports using AI-powered analysis. The system processes Azure Migrate assessment reports (Pay-as-you-go, 1-Year Reserved Instance, and 3-Year Reserved Instance) and generates professional Word documents with cost comparisons, VM recommendations, and detailed analysis.

## 🏗️ Architecture & Technology Stack

- **Frontend**: Next.js 14 with TypeScript, App Router, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI Integration**: Azure OpenAI for VM sizing recommendations
- **Document Generation**: Docxtemplater for Word document creation
- **File Processing**: XLSX.js for Excel files, Papa Parse for CSV files
- **UI Components**: Custom components with shadcn/ui

## 📁 File Structure

```
prof-svc-project/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── azure-openai/route.ts          # Azure OpenAI integration
│   │   │   ├── azure-vm-pricing/route.ts      # Azure pricing API
│   │   │   ├── generate-report/route.ts       # Main report generation API
│   │   │   ├── upload-assessment/route.ts     # Assessment file processing
│   │   │   └── vm-recommendation/route.ts     # VM recommendation API
│   │   ├── dashboard/                         # Dashboard pages
│   │   ├── signin/                           # Authentication pages
│   │   ├── signup/
│   │   ├── globals.css                       # Global styles
│   │   ├── layout.tsx                        # Root layout
│   │   └── page.tsx                          # Landing page
│   ├── components/
│   │   ├── ui/                               # Reusable UI components
│   │   ├── AssessmentFileUpload.tsx          # File upload component
│   │   ├── AssessmentReportForm.tsx          # Main form component
│   │   ├── DashboardLayout.tsx               # Dashboard layout
│   │   ├── Header.tsx                        # Navigation header
│   │   └── ... (other UI components)
│   ├── lib/
│   │   ├── azureOpenAI.ts                    # Azure OpenAI client
│   │   ├── azureVmAnalysis.ts                # Azure VM analysis logic
│   │   ├── utils.ts                          # Utility functions
│   │   ├── wordDocumentProcessor.ts          # Word document processing
│   │   └── wordGenerator.ts                  # Document generation
│   └── types/
│       └── assessmentReport.ts               # TypeScript interfaces
├── public/                                   # Static assets
├── package.json                              # Dependencies
└── README.md                                 # Project readme
```

## 🔧 Core Functionality

### 1. Assessment Report Processing

#### File Upload & Parsing (`AssessmentReportForm.tsx`)
- **Purpose**: Handles upload of Azure Migrate assessment reports
- **Supported Formats**: Excel (.xlsx, .xls), CSV, JSON
- **Processing**: Parses multiple sheets (All_Assessed_Machines, All_Assessed_Disks, Assessment_Summary)
- **Region Extraction**: Automatically extracts target Azure region from Assessment_Summary sheet

#### Data Transformation (`azureVmAnalysis.ts`)
- **Purpose**: Transforms raw assessment data into standardized format
- **Functions**:
  - `transformAssessedMachine()`: Converts machine data to standardized format
  - `transformAssessedDisk()`: Converts disk data to standardized format
  - `parseMigrateReport()`: Main parsing function for assessment reports

### 2. AI-Powered Analysis

#### VM Recommendations (`vm-recommendation/route.ts`)
- **Purpose**: Generates AI-powered VM sizing recommendations
- **Input**: Transformed VM workload data
- **Output**: Optimized VM SKU recommendations with cost analysis
- **Features**: Batch processing to handle large datasets

#### Azure OpenAI Integration (`azureOpenAI.ts`)
- **Purpose**: Handles communication with Azure OpenAI service
- **Functions**:
  - `getOpenAICompletion()`: Main function for AI completions
  - Configurable prompts for different analysis types

### 3. Cost Analysis & Comparison

#### Cost Comparison Table (`utils.ts`)
- **Purpose**: Generates cost comparison across different pricing models
- **Function**: `generateCostComparisonTable()`
- **Output**: Structured data for Pay-as-you-go, 1-Year RI, and 3-Year RI
- **Features**: Automatic savings calculation and recommendations

#### Compute Breakdown (`utils.ts`)
- **Purpose**: Generates detailed VM-by-VM cost breakdown
- **Function**: `generateComputeBreakdownData()`
- **Features**: 
  - Dynamic region detection
  - AI reasoning for SKU selection
  - Loop-based template generation

### 4. Document Generation

#### Word Document Processing (`wordDocumentProcessor.ts`)
- **Purpose**: Processes Word templates and replaces placeholders
- **Features**:
  - Template analysis and placeholder detection
  - Dynamic content generation
  - Built-in template fallback

#### Report Generation (`generate-report/route.ts`)
- **Purpose**: Main API endpoint for report generation
- **Features**:
  - Docxtemplater integration
  - Custom template support
  - Fallback document generation
  - Dynamic table creation

## 📊 Data Flow

### 1. File Upload Process
```
User Upload → parseAssessmentSheets() → transformAssessedMachine/transformAssessedDisk → AssessmentReportData
```

### 2. AI Analysis Process
```
AssessmentReportData → vm-recommendation API → Azure OpenAI → genAiVmSummary
```

### 3. Report Generation Process
```
AssessmentReportData + genAiVmSummary → generateCostComparisonTable() + generateComputeBreakdownData() → Docxtemplater → Word Document
```

## 🔑 Key Components

### AssessmentReportForm.tsx
**Main Component**: Handles the entire assessment report workflow

**Key Functions**:
- `handleSubmit()`: Main form submission handler
- `parseAssessmentSheets()`: File parsing logic
- `toVMWorkload()`: Data transformation for AI analysis

**State Management**:
- File uploads (azureReport, azureReport1Yr, azureReport3Yr)
- Form data (otherDetails, rulesAndConstraints)
- Processing state (isSubmitting, error, recommendations)

### utils.ts
**Utility Functions**: Core business logic for data processing

**Key Functions**:
- `generateCostComparisonTable()`: Cost analysis across pricing models
- `generateComputeBreakdownData()`: VM-by-VM breakdown with AI reasoning
- `getRegionDisplayName()`: Region name mapping
- `generateSKUReasoning()`: AI reasoning for VM SKU selection

### generate-report/route.ts
**Main API Endpoint**: Handles report generation requests

**Process**:
1. Receives AssessmentReportData
2. Generates cost comparison and compute breakdown data
3. Processes Word template with Docxtemplater
4. Returns generated Word document

**Template Data Structure**:
```typescript
{
  // Basic assessment data
  totalServers, inScopeServersCount, vmSummary, etc.
  
  // Cost comparison data
  cbHeader1-5, paygPricingPlan, oneYearPricingPlan, etc.
  
  // Compute breakdown data
  computeBreakdownTitle, vms: Array<{name, cores, memory, size, cost, reason}>
  
  // Total calculations
  cbTotalLabel, cbTotalCost
}
```

## 🎯 Template System

### Docxtemplater Integration
- **Loop Syntax**: `{#vms}...{/vms}` for dynamic VM rows
- **Placeholder Format**: `{placeholderName}` for single values
- **Dynamic Tables**: Automatically creates rows based on VM count

### Template Placeholders

#### Cost Comparison Table
```
{cbHeader1} - "Machine"
{cbHeader2} - "Cores"
{cbHeader3} - "Memory(MB)"
{cbHeader4} - "Recommended size"
{cbHeader5} - "Compute monthly cost estimate USD"
```

#### Dynamic VM Rows (Loop)
```
{#vms}
{name} | {cores} | {memory} | {size} | {cost}
{/vms}
```

#### Total Row
```
{cbTotalLabel} - "Total Compute Cost"
{cbTotalCost} - Calculated total
```

#### Reasoning Section
```
{#vms}
• {name}: {reason}
{/vms}
```

## 🔄 Data Structures

### AssessmentReportData Interface
```typescript
interface AssessmentReportData {
  totalServers: number;
  inScopeServersCount: number;
  vmSummary: ServerDetails[];
  targetRegion?: string;
  genAiVmSummary?: GenAIVMSummary[];
  payAsYouGoData?: ReservedInstanceData;
  oneYearReservedData?: ReservedInstanceData;
  threeYearReservedData?: ReservedInstanceData;
  // ... other fields
}
```

### ComputeBreakdownData Interface
```typescript
interface ComputeBreakdownData {
  title: string;
  description: string;
  rows: ComputeBreakdownRow[];
  vms: Array<{
    name: string;
    cores: string;
    memory: string;
    size: string;
    cost: string;
    reason: string;
  }>;
  totalComputeCost: number;
  summary: string;
}
```

## 🚀 Key Features

### 1. Dynamic Region Detection
- Automatically extracts target Azure region from assessment reports
- Falls back to 'eastus' if region not found
- Supports all Azure regions with proper display names

### 2. Multi-Pricing Model Support
- Pay-as-you-go (PAYG)
- 1-Year Reserved Instance
- 3-Year Reserved Instance
- Automatic cost comparison and savings calculation

### 3. AI-Powered Recommendations
- Azure OpenAI integration for VM sizing
- Batch processing for large datasets
- Detailed reasoning for each recommendation

### 4. Flexible Template System
- Custom Word template support
- Built-in fallback templates
- Dynamic table generation
- Loop-based content generation

### 5. Comprehensive Cost Analysis
- VM-by-VM cost breakdown
- Storage cost analysis
- Total cost calculations
- Savings recommendations

## 🔧 Configuration

### Environment Variables
```env
AZURE_OPENAI_API_KEY=your_openai_api_key
AZURE_OPENAI_ENDPOINT=your_openai_endpoint
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
```

### Azure OpenAI Settings
- **Model**: GPT-4 or GPT-3.5-turbo
- **Temperature**: 0 (for deterministic results)
- **Max Tokens**: 4000
- **System Prompt**: Cloud infrastructure expert specializing in Azure VM sizing

## 📝 Usage Workflow

### 1. User Uploads Assessment Reports
- Pay-as-you-go assessment report (required)
- 1-Year Reserved Instance report (optional)
- 3-Year Reserved Instance report (optional)

### 2. System Processes Data
- Parses Excel/CSV/JSON files
- Extracts region information
- Transforms data to standardized format

### 3. AI Analysis
- Sends VM data to Azure OpenAI
- Receives optimized recommendations
- Generates detailed reasoning

### 4. Report Generation
- Creates cost comparison tables
- Generates compute breakdown
- Processes Word template
- Returns final document

## 🐛 Error Handling

### File Processing Errors
- Unsupported file format detection
- Missing required sheets validation
- Data transformation error handling

### AI Service Errors
- Azure OpenAI API error handling
- Fallback to assessment data if AI fails
- Graceful degradation

### Template Processing Errors
- Missing placeholder handling
- Invalid template format detection
- Fallback to built-in templates

## 🔮 Future Enhancements

### Potential Improvements
1. **Additional Pricing Models**: Spot instances, hybrid benefit calculations
2. **Enhanced AI Analysis**: Network optimization, storage tier recommendations
3. **Template Customization**: Web-based template editor
4. **Batch Processing**: Multiple assessment reports in one session
5. **Export Formats**: PDF, PowerPoint, Excel output
6. **Real-time Pricing**: Live Azure pricing API integration

### Scalability Considerations
- **Caching**: Redis for AI responses
- **Queue Processing**: Background job processing for large reports
- **CDN**: Static asset delivery optimization
- **Database**: Assessment data persistence

## 📚 Dependencies

### Core Dependencies
```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.0.0",
  "docxtemplater": "^3.37.0",
  "pizzip": "^3.6.0",
  "xlsx": "^0.18.0",
  "papaparse": "^5.4.0"
}
```

### Development Dependencies
```json
{
  "@types/node": "^20.0.0",
  "@types/react": "^18.0.0",
  "eslint": "^8.0.0",
  "prettier": "^3.0.0"
}
```

## 🎯 Success Metrics

### Performance Indicators
- **Processing Time**: < 30 seconds for typical assessment reports
- **Accuracy**: > 95% cost estimation accuracy
- **User Satisfaction**: Intuitive interface and professional output
- **Reliability**: 99.9% uptime for report generation

### Quality Assurance
- **Code Coverage**: Unit tests for core functions
- **Integration Tests**: End-to-end workflow testing
- **Error Monitoring**: Comprehensive error tracking
- **User Feedback**: Continuous improvement based on user input

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Maintainer**: AI Assistant
**Status**: Production Ready 