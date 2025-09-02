# Generate Diagram API Route

## Overview

The `/api/generate-diagram` route is a comprehensive API endpoint that generates PlantUML architecture diagrams based on Azure Migrate assessment data. This route integrates with the `generateDiagramBlueprint` utility function and provides enhanced error handling, retry mechanisms, and performance monitoring.

## Features

### Core Functionality
- **Assessment Data Processing**: Analyzes Azure Migrate assessment data
- **Diagram Generation**: Creates PlantUML architecture diagrams using Azure OpenAI
- **CAF Alignment**: Generates diagrams aligned with Cloud Adoption Framework principles
- **Type Safety**: Full TypeScript support with comprehensive type checking

### Enhanced Features
- **Retry Mechanism**: Up to 2 retries with exponential backoff for Azure OpenAI failures
- **Input Validation**: Robust validation of report data structure
- **Error Handling**: Comprehensive error handling with appropriate HTTP status codes
- **Performance Monitoring**: Processing time tracking and detailed logging
- **Response Formatting**: Consistent JSON response format with success/error indicators

## API Reference

### Endpoint
```
POST /api/generate-diagram
```

### Request Body
```typescript
{
  reportData: {
    assessedMachines: Array<{
      machine: string;
      operatingSystem: string;
      cores: number;
      memoryMb: number;
      storageGb: number;
      computeMonthlyCostEstimateUsd: number;
      securityMonthlyCostEstimateUsd: number;
      azureReadinessIssues: string;
      securityReadiness: string;
      dataCollectionIssues: string;
      networkAdapters: string;
      ipAddress: string;
      networkInMbps: number;
      networkOutMbps: number;
      cpuUsagePercent: number;
      memoryUsagePercent: number;
    }>;
    assessedDisks: Array<{
      machine: string;
      diskName: string;
      recommendedDiskType: string;
      monthlyCostEstimate: number;
      sourceDiskSizeGb: number;
      targetDiskSizeGb: number;
    }>;
  }
}
```

### Success Response (200)
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

### Error Responses

#### Bad Request (400)
```json
{
  "success": false,
  "error": "Invalid report data structure. Please provide assessedMachines and/or assessedDisks arrays.",
  "processingTime": 50
}
```

#### Unprocessable Entity (422)
```json
{
  "success": false,
  "error": "Invalid PlantUML code generated. Please try again.",
  "processingTime": 1500
}
```

#### Service Unavailable (503)
```json
{
  "success": false,
  "error": "AI service temporarily unavailable. Please try again.",
  "processingTime": 3000
}
```

#### Internal Server Error (500)
```json
{
  "success": false,
  "error": "Failed to generate diagram",
  "processingTime": 2000
}
```

## Implementation Details

### Retry Mechanism
The API implements a sophisticated retry mechanism for Azure OpenAI API calls:

```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T>
```

**Features:**
- **Exponential Backoff**: Delay increases exponentially with each retry
- **Jitter**: Random delay component to prevent thundering herd
- **Smart Retry Logic**: Doesn't retry validation errors or bad requests
- **Configurable**: Adjustable retry count and base delay

### Input Validation
Comprehensive validation ensures data integrity:

```typescript
function validateReportData(reportData: any): boolean
```

**Validation Rules:**
- Report data must be a non-null object
- Must contain at least one of: `assessedMachines` or `assessedDisks` arrays
- Arrays must be properly structured

### Data Processing Pipeline
1. **Input Validation**: Validate report data structure
2. **Data Analysis**: Process raw assessment data into structured summary
3. **Type Conversion**: Convert to format expected by `generateDiagramBlueprint`
4. **Diagram Generation**: Generate PlantUML code with retry logic
5. **Response Formatting**: Return consistent JSON response

### Error Handling Strategy
The API implements a multi-layered error handling approach:

1. **Input Validation Errors** (400): Invalid request structure
2. **Validation Errors** (422): Invalid PlantUML generation
3. **Service Errors** (503): Azure OpenAI service issues
4. **System Errors** (500): Unexpected internal errors

## Usage Examples

### Basic Usage
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
  const plantUmlCode = result.blueprint;
} else {
  console.error(`❌ Error: ${result.error}`);
}
```

### Error Handling
```typescript
try {
  const response = await fetch('/api/generate-diagram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportData })
  });

  const result = await response.json();

  switch (response.status) {
    case 200:
      // Success - use result.blueprint
      break;
    case 400:
      // Bad request - check result.error
      break;
    case 422:
      // Validation error - retry with different data
      break;
    case 503:
      // Service unavailable - retry later
      break;
    default:
      // Handle other errors
      break;
  }
} catch (error) {
  // Handle network errors
}
```

## Performance Considerations

### Processing Time
- **Typical Response Time**: 2-5 seconds
- **Factors Affecting Performance**:
  - Number of VMs and disks in assessment
  - Azure OpenAI API response time
  - Network latency
  - Retry attempts

### Optimization Tips
- **Batch Processing**: Process multiple assessments in parallel
- **Caching**: Cache generated diagrams for repeated requests
- **Rate Limiting**: Implement client-side rate limiting
- **Monitoring**: Track processing times and error rates

## Monitoring and Logging

### Console Logs
The API provides comprehensive logging:

```
🔄 [Generate Diagram API] Processing report data...
📊 [Generate Diagram API] Analyzed 5 VMs, 8 disks
🔄 [Generate Diagram API] Retry attempt 1/3 in 1500ms
✅ [Generate Diagram API] Diagram generated successfully in 2450ms
```

### Error Logging
Detailed error information is logged:

```typescript
console.error('❌ [Generate Diagram API] Error:', {
  message: error.message,
  stack: error.stack,
  processingTime,
  timestamp: new Date().toISOString()
});
```

## Testing

### Unit Tests
Test the API with various scenarios:

```typescript
// Test with valid data
const validResponse = await testApiRoute();

// Test error handling
await testErrorHandling();

// Test with empty data
const emptyResponse = await fetch('/api/generate-diagram', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ reportData: { assessedMachines: [], assessedDisks: [] } })
});
```

### Integration Tests
Test the complete workflow:

1. **Valid Assessment Data**: Ensure successful diagram generation
2. **Invalid Data Structure**: Verify proper error responses
3. **Empty Data**: Test edge cases
4. **Network Failures**: Test retry mechanism
5. **Service Errors**: Test Azure OpenAI failure handling

## Security Considerations

### Input Sanitization
- All input data is validated before processing
- No raw data is passed to external services
- Error messages don't expose sensitive information

### API Key Protection
- Azure OpenAI credentials are stored in environment variables
- No sensitive data is logged or exposed in responses

### Rate Limiting
- Consider implementing rate limiting for production use
- Monitor API usage patterns

## Future Enhancements

### Planned Features
1. **Caching**: Redis-based caching for generated diagrams
2. **Async Processing**: Background job processing for large assessments
3. **Webhook Support**: Notify clients when diagrams are ready
4. **Version Control**: Track diagram versions and changes
5. **Custom Templates**: User-defined diagram templates

### Extension Points
- **Alternative AI Providers**: Support for other AI services
- **Diagram Formats**: Export to SVG, PNG, PDF
- **Real-time Updates**: WebSocket support for live updates
- **Collaboration**: Multi-user diagram editing

## Troubleshooting

### Common Issues

#### "Invalid report data structure"
- Ensure `reportData` contains `assessedMachines` or `assessedDisks` arrays
- Check that arrays are properly formatted

#### "AI service temporarily unavailable"
- Azure OpenAI service may be experiencing issues
- Retry the request after a few minutes
- Check Azure OpenAI service status

#### "Invalid PlantUML code generated"
- Rare issue with AI-generated content
- Retry the request
- Consider adjusting temperature parameter

#### High processing times
- Large assessments may take longer to process
- Check network connectivity to Azure OpenAI
- Monitor Azure OpenAI service performance

### Debug Information
Enable detailed logging by checking console output for:
- Processing steps and timing
- Retry attempts and delays
- Error details and stack traces
- Performance metrics
