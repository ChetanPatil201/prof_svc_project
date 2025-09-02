# Professional Services Assessment Tool - Project Documentation

## Project Overview

The Professional Services Assessment Tool is a comprehensive Azure migration assessment platform built with Next.js 15, TypeScript, and Tailwind CSS. It provides AI-powered analysis, automated report generation, and intelligent runbook creation for cloud migration projects.

## Architecture & Technology Stack

### Frontend Framework
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React 19** with modern hooks
- **Lucide React** for icons

### Key Dependencies
- **docx/docxtemplater**: Word document generation
- **mammoth**: Document processing
- **papaparse**: CSV parsing
- **xlsx**: Excel file processing
- **react-markdown**: Markdown rendering

### Backend & APIs
- **Next.js API Routes** for backend functionality
- **Azure OpenAI** integration for AI-powered analysis
- **Azure VM Pricing API** for cost calculations

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   │   ├── azure-openai/     # Azure OpenAI integration
│   │   ├── azure-vm-pricing/ # Azure VM pricing data
│   │   ├── debug/            # Debug utilities
│   │   ├── generate-report/  # Report generation
│   │   ├── test-deployments/ # Deployment testing
│   │   ├── test-endpoint/    # API testing
│   │   ├── test-openai/      # OpenAI testing
│   │   ├── upload-assessment/ # File upload handling
│   │   └── vm-recommendation/ # VM sizing recommendations
│   ├── dashboard/         # Dashboard pages
│   │   ├── assessment-reports/ # Assessment reports view
│   │   └── cutover-runbooks/  # Runbook management
│   ├── signin/           # Authentication pages
│   ├── signup/           # Registration pages
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Landing page
│   └── globals.css       # Global styles
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   └── textarea.tsx
│   ├── AssessmentFileUpload.tsx
│   ├── AssessmentReportForm.tsx
│   ├── BenefitsSection.tsx
│   ├── CloudReadinessTable.tsx
│   ├── CostComparisonTable.tsx
│   ├── CTASection.tsx
│   ├── DashboardLayout.tsx
│   ├── FeaturesSection.tsx
│   ├── FileUpload.tsx
│   ├── Footer.tsx
│   ├── Header.tsx
│   ├── HeroSection.tsx
│   ├── HowItWorksSection.tsx
│   └── RunbookForm.tsx
├── lib/                  # Utility libraries
│   ├── assessmentUtils.ts    # Assessment processing
│   ├── azureOpenAI.ts        # Azure OpenAI client
│   ├── azureVmAnalysis.ts    # VM analysis logic
│   ├── utils.ts              # Core utilities & disk constraints
│   ├── wordDocumentProcessor.ts # Document processing
│   └── wordGenerator.ts      # Word document generation
├── templates/            # Document templates
│   ├── assessment-report-template.docx
│   └── word-template-structure.md
└── types/               # TypeScript type definitions
    └── assessmentReport.ts
```

## Core Features

### 1. Azure Migration Assessment
- **File Upload**: Supports Excel (.xlsx, .xls) and CSV files
- **Data Processing**: Parses Azure Migrate assessment data
- **VM Analysis**: AI-powered VM sizing recommendations
- **Cost Optimization**: Detailed cost analysis with multiple pricing tiers

### 2. Disk Constraint System
- **Premium Disk Filtering**: Automatically filters Premium SSD and Premium SSD V2 disks
- **Standard SSD Fallback**: Converts premium disks to cost-effective Standard SSD
- **Flexible Constraints**: Support for various constraint syntaxes
- **Consistent Application**: Ensures constraints are applied across all report sections

### 3. Report Generation
- **Word Document Creation**: Professional assessment reports
- **Cost Comparison Tables**: Pay-as-you-go vs Reserved Instance pricing
- **Custom Templates**: Configurable report templates
- **Multi-format Support**: Excel, CSV, and Word document processing

### 4. AI-Powered Analysis
- **Azure OpenAI Integration**: GPT-4 powered analysis
- **VM Recommendations**: Intelligent VM sizing suggestions
- **Cost Optimization**: AI-driven cost reduction recommendations
- **Landing Zone Design**: Automated landing zone blueprints

### 5. Runbook Generation
- **Automated Procedures**: Step-by-step migration procedures
- **Risk Mitigation**: Built-in risk assessment and mitigation steps
- **Rollback Procedures**: Automated rollback planning
- **Best Practices**: Industry-standard migration practices

## API Endpoints

### Core Assessment APIs
- `POST /api/upload-assessment` - Upload and process assessment files
- `POST /api/generate-report` - Generate comprehensive assessment reports
- `POST /api/vm-recommendation` - Get AI-powered VM recommendations

### Azure Integration APIs
- `POST /api/azure-openai` - Azure OpenAI integration
- `GET /api/azure-vm-pricing` - Azure VM pricing data
- `POST /api/test-openai` - Test OpenAI connectivity

### Utility APIs
- `GET /api/test-endpoint` - API health check
- `GET /api/test-deployments` - Deployment testing
- `GET /api/debug` - Debug utilities

## Key Components

### AssessmentReportForm.tsx
- Main assessment form component
- Handles file uploads (Excel, CSV, Word documents)
- Processes Azure Migrate assessment data
- Applies disk constraints
- Generates comprehensive reports

### Disk Constraint System (utils.ts)
- **applyDiskConstraints()**: Main constraint application function
- **getConstrainedDiskData()**: Ensures consistent constraint application
- **testDiskConstraintApplication()**: Validates constraint application
- Supports premium disk filtering, ultra disk constraints, and standard disk preferences

### Azure VM Analysis (azureVmAnalysis.ts)
- **fetchAzureVmPricing()**: Retrieves Azure VM pricing data
- **transformAssessedMachine()**: Processes VM assessment data
- **transformAssessedDisk()**: Processes disk assessment data
- Cost optimization and VM sizing logic

### Word Document Generation (wordGenerator.ts)
- **generateAssessmentReport()**: Creates professional Word documents
- **processTemplate()**: Handles document templates
- **formatCostData()**: Formats cost comparison tables
- Customizable report templates

## Deployment Options

### 1. Docker Deployment
- **Dockerfile**: Multi-stage build for production
- **docker-compose.yml**: Development environment
- **docker-compose.prod.yml**: Production environment
- Automated deployment scripts

### 2. Azure Container Instances (ACI)
- **aci-deploy.sh**: Automated ACI deployment
- **aci-management.sh**: Container management
- **aci-github-actions.yml**: CI/CD pipeline
- Cost-effective serverless deployment

### 3. Azure Container Apps
- **container-app.yaml**: Container app configuration
- **azure-deploy.sh**: Azure deployment script
- **deploy-to-azure.sh**: Automated deployment
- Scalable containerized deployment

### 4. Traditional Deployment
- **next.config.ts**: Next.js configuration
- **package.json**: Dependencies and scripts
- **tailwind.config.js**: Tailwind CSS configuration
- Standard Node.js deployment

## Environment Configuration

### Required Environment Variables
```bash
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-azure-openai-endpoint.azure.com/
AZURE_OPENAI_KEY=your-azure-openai-key-here
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Security Considerations
- **Git Ignore**: Sensitive files are excluded from version control
- **Environment Variables**: All secrets stored in environment variables
- **Azure Key Vault**: Recommended for production deployments
- **HTTPS**: All production deployments use HTTPS

## Current Status

### ✅ Implemented Features
- Complete assessment file processing (Excel, CSV, Word)
- Disk constraint system with comprehensive filtering
- Azure VM pricing integration
- Word document report generation
- AI-powered VM recommendations
- Docker containerization
- Multiple deployment options (ACI, Container Apps, Docker)
- Responsive UI with Tailwind CSS
- TypeScript type safety

### 🔄 In Progress
- Enhanced error handling and validation
- Performance optimization for large datasets
- Additional report templates
- Advanced AI analysis features

### 📋 Planned Features
- User authentication and authorization
- Multi-tenant support
- Advanced analytics dashboard
- Integration with additional Azure services
- Mobile application support

## Development Guidelines

### Code Quality
- **ESLint**: Code linting and formatting
- **TypeScript**: Strict type checking
- **Prettier**: Code formatting
- **Git Hooks**: Pre-commit validation

### Testing Strategy
- **Unit Tests**: Component and utility testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full workflow testing
- **Performance Tests**: Load testing for large datasets

### Documentation
- **API Documentation**: Comprehensive endpoint documentation
- **Component Documentation**: React component documentation
- **Deployment Guides**: Step-by-step deployment instructions
- **User Guides**: End-user documentation

## Troubleshooting

### Common Issues
1. **File Upload Errors**: Check file format and size limits
2. **Azure OpenAI Errors**: Verify API keys and endpoint configuration
3. **Disk Constraint Issues**: Check constraint syntax and application
4. **Deployment Failures**: Verify Azure credentials and resource limits

### Debug Tools
- `/api/debug` endpoint for system diagnostics
- Comprehensive logging throughout the application
- Disk constraint testing utilities
- Azure connectivity testing

## Performance Considerations

### Optimization Strategies
- **Lazy Loading**: Components and routes loaded on demand
- **Caching**: Azure VM pricing data caching
- **Compression**: Gzip compression for static assets
- **CDN**: Content delivery network for global performance

### Scalability
- **Container Orchestration**: Kubernetes support planned
- **Auto-scaling**: Azure Container Apps auto-scaling
- **Load Balancing**: Multiple instance support
- **Database Integration**: Planned for user data persistence

This documentation provides a comprehensive overview of the Professional Services Assessment Tool for AI agents to understand the codebase structure, functionality, and current implementation status. 