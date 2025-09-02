/**
 * Diagram generation options and configuration
 */

export interface DiagramOptions {
  layout?: 'hierarchical' | 'force' | 'circular' | 'dagre';
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  nodeSpacing?: number;
  levelSeparation?: number;
  rankSeparation?: number;
  maxConnections?: number;
  showLabels?: boolean;
  showTooltips?: boolean;
  theme?: 'default' | 'dark' | 'light';
  nodeSize?: {
    width: number;
    height: number;
  };
  edgeStyle?: {
    stroke: string;
    strokeWidth: number;
    strokeDasharray?: string;
  };
  nodeStyle?: {
    fill: string;
    stroke: string;
    strokeWidth: number;
    borderRadius?: number;
  };
  grouping?: {
    enabled: boolean;
    maxNodesPerGroup: number;
    groupByType: boolean;
    groupByLayer: boolean;
  };
  filtering?: {
    enabled: boolean;
    minConnections: number;
    excludeTypes: string[];
    includeTypes: string[];
  };
}

export const DEFAULT_DIAGRAM_OPTIONS: DiagramOptions = {
  layout: 'hierarchical',
  direction: 'TB',
  nodeSpacing: 50,
  levelSeparation: 100,
  rankSeparation: 80,
  maxConnections: 10,
  showLabels: true,
  showTooltips: true,
  theme: 'default',
  nodeSize: {
    width: 120,
    height: 60
  },
  edgeStyle: {
    stroke: '#666',
    strokeWidth: 2,
    strokeDasharray: '5,5'
  },
  nodeStyle: {
    fill: '#f8f9fa',
    stroke: '#dee2e6',
    strokeWidth: 1,
    borderRadius: 4
  },
  grouping: {
    enabled: true,
    maxNodesPerGroup: 5,
    groupByType: true,
    groupByLayer: false
  },
  filtering: {
    enabled: false,
    minConnections: 1,
    excludeTypes: [],
    includeTypes: []
  }
};

export interface DiagramTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    border: string;
    accent: string;
  };
  fonts: {
    family: string;
    size: number;
    weight: string;
  };
}

export const DIAGRAM_THEMES: Record<string, DiagramTheme> = {
  default: {
    name: 'Default',
    colors: {
      primary: '#007bff',
      secondary: '#6c757d',
      background: '#ffffff',
      text: '#212529',
      border: '#dee2e6',
      accent: '#28a745'
    },
    fonts: {
      family: 'Arial, sans-serif',
      size: 12,
      weight: 'normal'
    }
  },
  dark: {
    name: 'Dark',
    colors: {
      primary: '#0d6efd',
      secondary: '#adb5bd',
      background: '#212529',
      text: '#f8f9fa',
      border: '#495057',
      accent: '#198754'
    },
    fonts: {
      family: 'Arial, sans-serif',
      size: 12,
      weight: 'normal'
    }
  },
  light: {
    name: 'Light',
    colors: {
      primary: '#0d6efd',
      secondary: '#6c757d',
      background: '#f8f9fa',
      text: '#212529',
      border: '#dee2e6',
      accent: '#198754'
    },
    fonts: {
      family: 'Arial, sans-serif',
      size: 12,
      weight: 'normal'
    }
  }
};
