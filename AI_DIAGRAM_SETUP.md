# AI-Powered Azure Architecture Diagram Generation

This project now uses Azure OpenAI to generate professional Azure Cloud Adoption Framework (CAF) architecture diagrams instead of ReactFlow-based interactive diagrams.

## Features

### 🎨 **AI-Generated Diagrams**
- **Custom Architecture Diagrams**: Based on assessment data with specific client requirements
- **CAF Overview Diagrams**: Standard Cloud Adoption Framework reference diagrams
- **Professional SVG Output**: High-quality vector graphics suitable for presentations
- **Consistent Styling**: Clean, minimalist design with Azure brand colors

### 🎯 **Diagram Types**

#### 1. Custom Architecture Diagrams
- Generated from client assessment data
- Includes specific server counts, storage requirements, and VM configurations
- Tailored network architecture (Hub-Spoke, etc.)
- Cost estimates and recommendations

#### 2. CAF Overview Diagrams
- Standard Azure Cloud Adoption Framework structure
- Five pillars: Strategy, Plan, Ready, Adopt, Govern
- Management layer connecting all pillars
- Continuous improvement flow

#### 3. CAF Landing Zone Diagrams
- Comprehensive Azure CAF Landing Zone architecture
- Complete management group hierarchy
- Platform subscriptions (Identity, Management, Connectivity, Security)
- Landing zone subscriptions (Production, Non-Production, Shared Services)
- Workload subscriptions (Application, Data, AI/ML)
- Hub-Spoke networking with proper IP addressing
- Security controls and monitoring
- Governance and compliance measures

### 🎨 **Visual Style**
- **Colors**: Light blue (#A5D8FF) and light purple (#DDA0DD) dashed borders
- **Typography**: Bold black titles, gray subtitles
- **Icons**: Blue shield (security), gear (management), checklist (planning), cloud (adoption), document (strategy)
- **Layout**: Hierarchical with clear flow arrows
- **Format**: SVG vector graphics (1792x1024 landscape)

## Setup Instructions

### 1. Azure OpenAI Configuration
Set up your environment variables:

```bash
# .env.local
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=your-api-key-here
```

### 2. API Endpoints
- **POST** `/api/generate-diagram`
  - Body: `{ assessment: AssessmentData, diagramType: 'custom' | 'overview' | 'landing-zone' }`
  - Returns: `{ success: boolean, diagram: string (SVG), diagramType: string }`

### 3. Usage
```typescript
import { generateArchitectureDiagram, generateCAFOverviewDiagram, generateCAFLandingZoneDiagram } from '@/lib/ai/diagramGenerator';

// Generate custom diagram
const customDiagram = await generateArchitectureDiagram(assessmentData);

// Generate overview diagram
const overviewDiagram = await generateCAFOverviewDiagram();

// Generate landing zone diagram
const landingZoneDiagram = await generateCAFLandingZoneDiagram(assessmentData);
```

## Component Usage

```tsx
import AIDiagramViewer from '@/components/AIDiagramViewer';

<AIDiagramViewer 
  assessment={assessmentData}
  className="w-full"
/>
```

## Controls

- **CAF Overview**: Generate standard CAF reference diagram
- **CAF Landing Zone**: Generate comprehensive landing zone architecture
- **Custom Architecture**: Generate diagram based on assessment data
- **Regenerate**: Create new diagram with same parameters
- **Show/Hide**: Toggle diagram visibility
- **Download**: Save diagram as SVG file

## Error Handling

- **Azure OpenAI Not Configured**: Shows setup instructions
- **Generation Failures**: Graceful error messages with retry options
- **Network Issues**: Timeout handling and user feedback

## Technical Details

### AI Prompts
- **System Prompt**: Defines visual style and structure requirements
- **User Prompt**: Includes assessment data and specific requirements
- **Output Format**: SVG code only, no markdown or explanations

### SVG Generation
- **Responsive Design**: Scales to container width
- **Professional Styling**: Consistent with Azure design guidelines
- **Downloadable**: Direct SVG download functionality

### Performance
- **Caching**: Diagrams can be cached for repeated use
- **Async Generation**: Non-blocking UI during generation
- **Progress Indicators**: Loading states and status updates

## Migration from ReactFlow

This approach replaces the previous ReactFlow-based interactive diagrams with:

✅ **Simplified Architecture**: No complex node/edge management  
✅ **Professional Output**: Production-ready SVG diagrams  
✅ **AI Intelligence**: Context-aware diagram generation  
✅ **Better Performance**: No heavy ReactFlow dependencies  
✅ **Easier Maintenance**: Simpler codebase and fewer dependencies  

## Future Enhancements

- [ ] Multiple diagram styles and themes
- [ ] Batch diagram generation
- [ ] Custom color schemes
- [ ] Interactive SVG elements
- [ ] Diagram templates and presets
- [ ] Integration with Azure DevOps
- [ ] Export to PowerPoint/PDF

## Troubleshooting

### Common Issues

1. **"Azure OpenAI not configured"**
   - Check environment variables
   - Verify API key permissions
   - Ensure endpoint URL is correct

2. **"Failed to generate diagram"**
   - Check network connectivity
   - Verify assessment data format
   - Review Azure OpenAI quota limits

3. **"No diagram data received"**
   - Check API response format
   - Verify SVG output from AI
   - Review prompt engineering

### Debug Mode
Enable detailed logging by checking browser console for:
- API request/response details
- Generation progress
- Error messages and stack traces
