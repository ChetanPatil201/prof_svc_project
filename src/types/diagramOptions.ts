export type DetailLevel = 'minimal' | 'standard' | 'detailed';

export interface DiagramOptions {
  maxConnectorsPerNode?: number;
  detailLevel?: DetailLevel;
  aggregateObservability?: boolean;
  aggregateSecurity?: boolean;
  aggregateNetworking?: boolean;
  showEdgeCounts?: boolean;
  groupLevel?: 'none' | 'tier' | 'subnet' | 'service';
}

export const DEFAULT_DIAGRAM_OPTIONS: Required<DiagramOptions> = {
  maxConnectorsPerNode: 6,
  detailLevel: 'standard',
  aggregateObservability: true,
  aggregateSecurity: true,
  aggregateNetworking: true,
  showEdgeCounts: true,
  groupLevel: 'service',
};
