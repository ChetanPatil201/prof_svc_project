# Generate Diagram Blueprint Utility

## Overview

The `generateDiagramBlueprint` utility function is a reusable module that generates PlantUML architecture diagrams based on Azure Migrate assessment data. It encapsulates the Azure OpenAI GPT-4o integration and provides a clean, type-safe interface for diagram generation.

## Features

- **Type-Safe Interface**: Full TypeScript support with comprehensive type definitions
- **Azure OpenAI Integration**: Uses the existing Azure OpenAI client for AI-powered diagram generation
- **CAF Alignment**: Generates diagrams aligned with Cloud Adoption Framework principles
- **Customizable Styling**: Configurable colors, borders, and visual elements
- **Validation**: Built-in PlantUML code validation
- **Error Handling**: Comprehensive error handling with descriptive messages
- **Extensible**: Designed for future enhancements and customizations

## API Reference

### `generateDiagramBlueprint(summary, options?)`

Generates a PlantUML architecture diagram blueprint.

**Parameters:**
- `summary: AssessmentSummary` - Assessment data containing workload and networking information
- `options: DiagramGenerationOptions` (optional) - Configuration options for diagram generation

**Returns:** `Promise<string>` - PlantUML diagram code

**Throws:** `Error` - If Azure OpenAI call fails or invalid response is received

### `generateSimpleTestDiagram()`

Generates a simple test diagram for development and testing purposes.

**Returns:** `string` - Static PlantUML diagram code

## Type Definitions

### `AssessmentSummary`

```typescript
interface AssessmentSummary {
  workloads: {
    totalVMs: number;
    windowsVMs: number;
    linuxVMs: number;
    totalCores: number;
    totalMemoryGB: number;
    totalStorageGB: number;
    averageCpuUsage: number;
    averageMemoryUsage: number;
    vmNames?: string[];
    vmTypes?: string[];
    dependencies?: string[];
  };
  networking: {
    totalNetworkAdapters: number;
    averageNetworkInMbps: number;
    averageNetworkOutMbps: number;
    uniqueIPRanges: number;
    vnetIPs?: string[];
    subnetRanges?: string[];
  };
  securityRisks: {
    machinesWithIssues: number;
    securityReadinessIssues: number;
    dataCollectionIssues: number;
  };
  costEstimates: {
    compute: number;
    storage: number;
    security: number;
    total: number;
  };
  recommendations?: {
    migrationStrategy: string;
    networkSegmentation: string;
    securityPriority: string;
  };
}
```

### `DiagramGenerationOptions`

```typescript
interface DiagramGenerationOptions {
  maxTokens?: number;           // Default: 3000
  temperature?: number;         // Default: 0.2
  seed?: number;               // For deterministic responses
  includeSubscriptions?: boolean;
  includeSecurityGroups?: boolean;
  includeLoadBalancers?: boolean;
}
```

## Usage Examples

### Basic Usage

```typescript
import { generateDiagramBlueprint } from '@/lib/generateDiagramBlueprint';

const summary = {
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
  // ... other properties
};

const plantUmlCode = await generateDiagramBlueprint(summary);
```

### Advanced Usage with Options

```typescript
const plantUmlCode = await generateDiagramBlueprint(summary, {
  maxTokens: 4000,
  temperature: 0.1,
  includeSecurityGroups: true,
  includeLoadBalancers: true
});
```

### Testing with Simple Diagram

```typescript
import { generateSimpleTestDiagram } from '@/lib/generateDiagramBlueprint';

const testDiagram = generateSimpleTestDiagram();
console.log(testDiagram);
```

## Diagram Features

### Styling Specifications

- **Subscriptions**: Light blue dashed borders (#A5D8FF)
- **VNets**: Light purple dashed borders (#DDA0DD)
- **Rounded Corners**: `skinparam rectangleRoundCorner 8`
- **Bold Titles**: `**text**`
- **Gray Subtitles**: `#gray`
- **Green Dependencies**: `#00FF00`

### Azure Landing Zone Structure

- **Production Subscription**: Single subscription design
- **Production VNet**: CIDR 10.0.0.0/16
- **Subnets**:
  - Web Tier: 10.0.1.0/24
  - App Tier: 10.0.2.0/24
  - Data Tier: 10.0.3.0/24
  - Management: 10.0.4.0/24

### CAF Alignment

- **Adopt Pillar**: Workload placement strategy
- **Security Groups**: Network security implementation
- **Management**: Administrative access patterns

## Error Handling

The function includes comprehensive error handling:

- **Azure OpenAI Errors**: Network failures, API errors, authentication issues
- **Validation Errors**: Invalid PlantUML code generation
- **Input Validation**: Missing or invalid assessment data
- **Timeout Handling**: Request timeouts and retries

## Future Enhancements

### Planned Features

1. **Multiple Subscriptions**: Support for Dev, Test, Prod environments
2. **Additional CAF Pillars**: Govern, Secure, Manage implementations
3. **Hybrid Connectivity**: ExpressRoute, VPN Gateway support
4. **Azure Services**: App Service, Functions, Container instances
5. **Custom Themes**: User-defined styling and color schemes
6. **Diagram Templates**: Pre-built templates for common scenarios

### Extension Points

- **Custom Prompt Templates**: User-defined prompt structures
- **Alternative AI Providers**: Support for other AI services
- **Diagram Formats**: Export to other formats (SVG, PNG, etc.)
- **Real-time Collaboration**: Multi-user diagram editing
- **Version Control**: Diagram versioning and history

## Integration

### API Route Integration

The utility is integrated with the `/api/generate-diagram` route:

```typescript
// In src/app/api/generate-diagram/route.ts
import { generateDiagramBlueprint } from '@/lib/generateDiagramBlueprint';

const plantUmlCode = await generateDiagramBlueprint(diagramSummary, {
  maxTokens: 3000,
  temperature: 0.2,
});
```

### Component Integration

Can be used in React components for client-side diagram generation:

```typescript
// In a React component
const [diagram, setDiagram] = useState('');

useEffect(() => {
  generateDiagramBlueprint(assessmentData)
    .then(setDiagram)
    .catch(console.error);
}, [assessmentData]);
```

## Testing

### Unit Tests

The function includes built-in validation and can be tested with:

```typescript
import { generateSimpleTestDiagram, isValidPlantUML } from '@/lib/generateDiagramBlueprint';

// Test validation
const testCode = generateSimpleTestDiagram();
console.log(isValidPlantUML(testCode)); // true
```

### Integration Tests

Test with the API route:

```bash
curl -X POST http://localhost:3000/api/generate-diagram \
  -H "Content-Type: application/json" \
  -d '{"reportData": {...}}'
```

## Environment Variables

Required for Azure OpenAI integration:

```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

## Performance Considerations

- **Token Limits**: Configure `maxTokens` based on diagram complexity
- **Temperature**: Lower values (0.1-0.3) for consistent results
- **Caching**: Consider caching generated diagrams for repeated requests
- **Rate Limiting**: Implement rate limiting for API calls
- **Error Recovery**: Retry logic for transient failures

## Security

- **Input Validation**: All inputs are validated before processing
- **Error Sanitization**: Error messages don't expose sensitive information
- **API Key Protection**: Environment variables for secure credential management
- **Request Validation**: Comprehensive request body validation
