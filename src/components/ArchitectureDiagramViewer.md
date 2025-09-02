# ArchitectureDiagramViewer Component

## Overview

The `ArchitectureDiagramViewer` is a comprehensive React component that displays Azure architecture diagrams generated from assessment data. It integrates with the `/api/generate-diagram` endpoint to fetch and display PlantUML diagrams with advanced features like zoom controls, fullscreen view, and download functionality.

## Features

### Core Functionality
- **Automatic Diagram Generation**: Fetches diagrams from the API endpoint
- **PlantUML Integration**: Converts PlantUML code to images using PlantUML web service
- **Real-time Updates**: Refreshes diagrams with latest assessment data
- **Error Handling**: Comprehensive error handling with retry mechanisms

### User Interface
- **Loading States**: Animated loading indicators during diagram generation
- **Zoom Controls**: Zoom in/out functionality with percentage display
- **Fullscreen Mode**: Toggle fullscreen view for better diagram visibility
- **Download Functionality**: Save diagrams as PNG images
- **Responsive Design**: Works on desktop and mobile devices

### Advanced Features
- **Summary Information**: Displays VM count, costs, and migration strategy
- **Control Visibility**: Toggle zoom controls on/off
- **Callback Support**: Success and error callback functions
- **Custom Styling**: Configurable CSS classes and styling

## Props Interface

```typescript
interface ArchitectureDiagramViewerProps {
  /** Report ID to fetch data from (alternative to reportData) */
  reportId?: string;
  /** Direct report data (alternative to reportId) */
  reportData?: ReportData;
  /** Title for the diagram card */
  title?: string;
  /** Description for the diagram card */
  description?: string;
  /** CSS class name for additional styling */
  className?: string;
  /** Whether to auto-generate diagram on mount */
  autoGenerate?: boolean;
  /** Callback function when diagram generation completes */
  onDiagramGenerated?: (response: DiagramResponse) => void;
  /** Callback function when an error occurs */
  onError?: (error: string) => void;
}
```

## Usage Examples

### Basic Usage

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

### With Callbacks

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
    />
  );
}
```

### Manual Generation

```tsx
function MyComponent() {
  return (
    <ArchitectureDiagramViewer
      reportData={reportData}
      autoGenerate={false}
      title="Manual Generation"
      description="Click 'Generate Diagram' to create the diagram"
    />
  );
}
```

### Custom Styling

```tsx
function MyComponent() {
  return (
    <ArchitectureDiagramViewer
      reportData={reportData}
      className="max-w-4xl mx-auto bg-gray-50"
      title="Custom Styled Diagram"
    />
  );
}
```

## API Integration

### Request Format

The component sends POST requests to `/api/generate-diagram` with the following format:

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

### Response Format

The component expects responses in the following format:

```typescript
{
  success: boolean;
  blueprint?: string;
  imageUrl?: string;
  processingTime?: number;
  summary?: {
    totalVMs: number;
    totalCost: number;
    migrationStrategy: string;
  };
  error?: string;
}
```

## State Management

### Component State

The component manages several internal states:

```typescript
// Diagram state
const [loading, setLoading] = useState(false);
const [blueprint, setBlueprint] = useState<string>("");
const [imageUrl, setImageUrl] = useState<string>("");
const [error, setError] = useState<string>("");
const [processingTime, setProcessingTime] = useState<number>(0);
const [summary, setSummary] = useState<Summary | null>(null);

// UI state
const [isFullscreen, setIsFullscreen] = useState(false);
const [zoomLevel, setZoomLevel] = useState(1);
const [showControls, setShowControls] = useState(true);
```

### State Transitions

1. **Initial State**: Component loads with no diagram
2. **Loading State**: Shows spinner while generating diagram
3. **Success State**: Displays diagram with controls
4. **Error State**: Shows error message with retry button

## User Interactions

### Zoom Controls

- **Zoom In**: Increases zoom level by 20% (max 300%)
- **Zoom Out**: Decreases zoom level by 20% (min 50%)
- **Reset Zoom**: Returns to 100% zoom level
- **Zoom Display**: Shows current zoom percentage

### Fullscreen Mode

- **Enter Fullscreen**: Expands component to full screen
- **Exit Fullscreen**: Returns to normal view
- **Fullscreen Controls**: Additional controls in fullscreen mode

### Download Functionality

- **Download Button**: Triggers image download
- **File Naming**: Automatic timestamp-based naming
- **Format**: PNG format for best quality

## Error Handling

### Error Types

1. **Network Errors**: Connection issues or timeouts
2. **API Errors**: Server-side errors from the API
3. **Validation Errors**: Invalid data format
4. **Image Loading Errors**: Failed to load diagram image

### Error Recovery

- **Retry Button**: Manual retry for failed requests
- **Error Messages**: User-friendly error descriptions
- **Console Logging**: Detailed error logging for debugging

## Performance Considerations

### Optimization Features

- **Memoized Callbacks**: Prevents unnecessary re-renders
- **Lazy Loading**: Images loaded only when needed
- **Error Boundaries**: Graceful error handling
- **State Optimization**: Efficient state updates

### Best Practices

- **Debounced API Calls**: Prevents excessive API requests
- **Image Caching**: Browser-level image caching
- **Responsive Images**: Optimized for different screen sizes

## Styling and Theming

### Tailwind CSS Classes

The component uses Tailwind CSS for styling:

```css
/* Card styling */
.rounded-xl.border.bg-white.text-gray-900.shadow-sm

/* Loading states */
.animate-spin.text-blue-600

/* Error states */
.text-red-500.text-red-600

/* Success states */
.text-green-600.text-blue-600
```

### Custom Styling

You can customize the component appearance:

```tsx
<ArchitectureDiagramViewer
  className="custom-class"
  title="Custom Title"
  description="Custom description"
/>
```

## Accessibility

### ARIA Support

- **Loading States**: Proper ARIA labels for loading indicators
- **Error Messages**: Screen reader friendly error descriptions
- **Button Labels**: Descriptive button text and icons
- **Keyboard Navigation**: Full keyboard support

### Screen Reader Support

- **Alt Text**: Descriptive alt text for images
- **Status Messages**: Live region updates for status changes
- **Focus Management**: Proper focus handling in fullscreen mode

## Browser Compatibility

### Supported Browsers

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### Feature Support

- **Fetch API**: Modern browsers only
- **CSS Grid**: Responsive layout support
- **ES6+ Features**: Arrow functions, destructuring, etc.

## Testing

### Unit Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import ArchitectureDiagramViewer from './ArchitectureDiagramViewer';

test('renders loading state initially', () => {
  render(<ArchitectureDiagramViewer reportData={mockData} />);
  expect(screen.getByText(/generating/i)).toBeInTheDocument();
});

test('handles error states', () => {
  render(<ArchitectureDiagramViewer reportData={invalidData} />);
  expect(screen.getByText(/error/i)).toBeInTheDocument();
});
```

### Integration Tests

```tsx
test('generates diagram successfully', async () => {
  render(<ArchitectureDiagramViewer reportData={mockData} />);
  
  await waitFor(() => {
    expect(screen.getByAltText(/architecture diagram/i)).toBeInTheDocument();
  });
});
```

## Future Enhancements

### Planned Features

1. **Diagram Editing**: In-place diagram modification
2. **Version Control**: Track diagram versions and changes
3. **Collaboration**: Multi-user diagram editing
4. **Export Formats**: SVG, PDF, and other formats
5. **Real-time Updates**: Live diagram updates

### Extension Points

- **Custom Themes**: User-defined color schemes
- **Plugin System**: Extensible functionality
- **API Integration**: Support for additional diagram services
- **Offline Support**: Cached diagrams for offline viewing

## Troubleshooting

### Common Issues

#### "Failed to load diagram image"
- Check network connectivity
- Verify PlantUML service availability
- Ensure valid PlantUML code

#### "API Error: Invalid report data"
- Verify report data structure
- Check required fields are present
- Validate data types

#### "Network error occurred"
- Check internet connection
- Verify API endpoint availability
- Review browser console for details

### Debug Information

Enable detailed logging by checking browser console for:
- API request/response details
- Error messages and stack traces
- Performance metrics
- State transitions

## Contributing

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Run tests: `npm test`

### Code Style

- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error boundaries
- Add comprehensive JSDoc comments

### Testing Guidelines

- Write unit tests for all functions
- Include integration tests for API calls
- Test error scenarios and edge cases
- Ensure accessibility compliance
