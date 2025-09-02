# Diagram Optimization Guide

## Overview

This guide covers the optimization techniques used in the Professional Services Assessment Tool for generating clean, readable architecture diagrams from Azure Migrate assessment data.

## Key Optimization Features

### 1. Node Grouping
- **Service-based grouping**: Groups related services (monitoring, security, networking)
- **Hub-spoke architecture**: Organizes resources in logical tiers
- **Resource consolidation**: Reduces visual clutter while maintaining clarity

### 2. Connector Management
- **Overflow hubs**: Prevents excessive connections to single nodes
- **Connection limits**: Enforces maximum connectors per node (default: 8)
- **Smart routing**: Routes connections through logical hubs

### 3. Visual Hierarchy
- **Layer organization**: Compute, Data, Networking, Security, Management
- **Color coding**: Consistent color scheme for different service types
- **Icon mapping**: Azure service icons for better recognition

## Optimization Algorithms

### Connector Limiting Algorithm

```typescript
function limitConnectors(model: ArchitectureModel, maxConnectors: number = 8): ArchitectureModel {
  // 1. Identify nodes with excessive connections
  // 2. Create overflow hubs for high-connection nodes
  // 3. Route connections through hubs
  // 4. Validate final model
}
```

### Grouping Algorithm

```typescript
function groupByService(model: ArchitectureModel): GroupingResult {
  // 1. Categorize nodes by service type
  // 2. Create service groups (observability, security, networking)
  // 3. Maintain individual nodes for compute/data resources
  // 4. Update connections to reflect grouping
}
```

## Configuration Options

### Diagram Options

```typescript
interface DiagramOptions {
  maxConnectorsPerNode?: number;    // Default: 8
  groupLevel?: GroupLevel;          // 'none' | 'service' | 'tier'
  aggregateObservability?: boolean; // Default: true
  useHubSpoke?: boolean;           // Default: true for large assessments
}
```

### Performance Settings

```typescript
const PERFORMANCE_SETTINGS = {
  maxNodes: 100,           // Maximum nodes before grouping
  maxConnectors: 8,        // Maximum connectors per node
  groupThreshold: 20,      // Nodes threshold for grouping
  hubSpokeThreshold: 50    // Nodes threshold for hub-spoke
};
```

## Best Practices

### 1. Node Organization
- Keep compute resources as individual nodes
- Group supporting services (monitoring, security)
- Use logical naming conventions

### 2. Connection Management
- Limit connections per node to prevent visual clutter
- Use overflow hubs for high-connection scenarios
- Maintain logical connection patterns

### 3. Visual Clarity
- Use consistent icon mapping
- Apply color coding for service types
- Maintain readable text labels

## Troubleshooting

### Common Issues

1. **Too many connections to a single node**
   - Solution: Enable overflow hubs
   - Configuration: `maxConnectorsPerNode: 8`

2. **Diagram too cluttered**
   - Solution: Enable service grouping
   - Configuration: `groupLevel: 'service'`

3. **Performance issues with large diagrams**
   - Solution: Enable tier grouping
   - Configuration: `groupLevel: 'tier'`

### Performance Optimization

```typescript
// For large assessments (>50 nodes)
const optimizedOptions: DiagramOptions = {
  maxConnectorsPerNode: 6,
  groupLevel: 'tier',
  aggregateObservability: true,
  useHubSpoke: true
};

// For small assessments (<20 nodes)
const simpleOptions: DiagramOptions = {
  maxConnectorsPerNode: 10,
  groupLevel: 'none',
  aggregateObservability: false,
  useHubSpoke: false
};
```

## Customization

### Custom Grouping Rules

```typescript
function customGroupingRule(node: ArchNode): string {
  if (node.type.includes('monitor') || node.type.includes('log')) {
    return 'observability';
  }
  if (node.type.includes('security') || node.type.includes('defender')) {
    return 'security';
  }
  return 'individual';
}
```

### Custom Icon Mapping

```typescript
const customIconMap = {
  'custom-service': '/azure-icons/custom-service.svg',
  'legacy-system': '/azure-icons/legacy-system.svg'
};
```

## Monitoring and Metrics

### Diagram Quality Metrics

- **Node count**: Total nodes in diagram
- **Connection density**: Average connections per node
- **Grouping efficiency**: Percentage of nodes grouped
- **Visual clarity score**: Subjective readability rating

### Performance Metrics

- **Generation time**: Time to create optimized diagram
- **Memory usage**: RAM consumption during optimization
- **Iteration count**: Number of optimization passes

## Future Enhancements

### Planned Features

1. **Auto-layout algorithms**: Automatic positioning optimization
2. **Interactive grouping**: User-controlled grouping options
3. **Export formats**: Additional diagram export formats
4. **Real-time optimization**: Live diagram updates

### Research Areas

- **Machine learning**: AI-powered layout optimization
- **User preference learning**: Adaptive optimization based on usage
- **Collaborative editing**: Multi-user diagram editing
- **Version control**: Diagram versioning and comparison
