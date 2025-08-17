# Professional Services Assessment Tool

A comprehensive Azure migration assessment tool that helps organizations analyze their on-premises infrastructure and generate detailed migration reports with cost optimization recommendations.

## Features

### 🎯 Core Assessment Capabilities
- **Azure Migrate Integration**: Process Azure Migrate assessment data
- **VM Size Recommendations**: AI-powered VM sizing recommendations
- **Cost Analysis**: Detailed cost breakdowns with multiple pricing options
- **Disk Optimization**: Intelligent disk type recommendations
- **Report Generation**: Professional Word document reports

### 🔧 Disk Constraint System
- **Premium Disk Filtering**: Automatically filter out Premium SSD and Premium SSD V2 disks
- **Standard SSD Fallback**: Convert premium disks to cost-effective Standard SSD
- **Flexible Constraints**: Support for various constraint syntaxes
- **Consistent Application**: Ensure constraints are applied across all report sections

### 📊 Reporting Features
- **Cost Comparison Tables**: Pay-as-you-go vs Reserved Instance pricing
- **Compute Breakdown**: Detailed VM sizing and cost analysis
- **Storage Analysis**: Disk recommendations with cost optimization
- **Professional Templates**: Customizable Word document templates

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Azure subscription (for pricing data)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd prof-svc-project

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Azure OpenAI credentials

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-azure-openai-endpoint.azure.com/
AZURE_OPENAI_KEY=your-azure-openai-key-here
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**: Never commit your actual Azure OpenAI keys to the repository. Use environment variables for all sensitive credentials.

## Disk Constraints Usage

### Basic Constraints
```typescript
// Filter out premium disks
"Dont choose premium disks"

// Filter out premium v2 disks
"Dont choose premium v2 disks"

// Filter both types
"Dont choose premium disks or premium v2 disks"
```

### Advanced Constraints
```typescript
// Comprehensive premium filtering
"Dont select any type of premium disk"

// Ultra disk filtering
"Dont choose ultra disks"

// Standard disk preferences
"Prefer standard ssd"
```

### Example Workflow
1. Upload Azure Migrate assessment data
2. Specify disk constraints in the assessment form
3. Generate comprehensive migration report
4. Review cost-optimized recommendations

## Documentation

### 📚 Technical Guides
- **[Disk Constraints Guide](DISK_CONSTRAINTS_GUIDE.md)** - Comprehensive technical documentation for the disk constraint system
- **[Docker Deployment Guide](DOCKER_DEPLOYMENT.md)** - Deployment instructions and disk constraint overview
- **[Azure Deployment Guide](AZURE_DEPLOYMENT_GUIDE.md)** - Azure-specific deployment instructions

### 🔧 API Documentation
- **VM Recommendations**: `/api/vm-recommendation`
- **Report Generation**: `/api/generate-report`
- **Azure OpenAI Integration**: `/api/azure-openai`

## Architecture

### Core Components
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   └── dashboard/         # Dashboard pages
├── components/            # React components
├── lib/                   # Utility functions
│   ├── utils.ts          # Disk constraint system
│   ├── azureVmAnalysis.ts # VM analysis logic
│   └── azureOpenAI.ts    # OpenAI integration
└── types/                # TypeScript interfaces
```

### Disk Constraint System
- **Constraint Application**: `applyDiskConstraints()`
- **Data Consistency**: `getConstrainedDiskData()`
- **Testing Framework**: `testDiskConstraintApplication()`

## Recent Updates

### ✅ Fixed Issues
- **Inconsistent Constraint Application**: Fixed issue where only 2 out of 7 premium disks were being filtered
- **Data Inconsistency**: Ensured constraints are applied consistently across all report sections
- **Debug Logging**: Added comprehensive logging for constraint application tracking

### 🔧 Technical Improvements
- Enhanced constraint detection logic
- Improved error handling and fallback mechanisms
- Added comprehensive testing framework
- Optimized API integration

## Development

### Testing
```bash
# Run constraint tests
npm run test:constraints

# Run full test suite
npm test
```

### Debug Logging
The system provides comprehensive logging for troubleshooting:
```
🧪 [Disk Test] Testing disk constraint application
🔄 [Disk Consistency] Applying constraints to all disk data
✅ [Disk Test] Constraints successfully reduced premium disk count
```

### Code Quality
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Comprehensive error handling

## Deployment

### Docker Deployment
```bash
# Build and run with Docker
docker-compose up -d

# Or use the deployment script
./deploy-to-azure.sh
```

### Azure Deployment
```bash
# Deploy to Azure Container Instances
./aci-deploy.sh

# Or use GitHub Actions
# See .github/workflows/azure-deploy.yml
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Support

For technical support or questions about the disk constraint system:
- Check the [Disk Constraints Guide](DISK_CONSTRAINTS_GUIDE.md)
- Review the debug logs for troubleshooting
- Open an issue for bugs or feature requests

## License

This project is licensed under the MIT License - see the LICENSE file for details.
