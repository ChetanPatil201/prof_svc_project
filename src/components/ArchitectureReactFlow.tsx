"use client"

import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  EdgeTypes,
  ReactFlowProvider,
  useReactFlow,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { ArchitectureModel } from '@/types/architecture';

// Custom Node Types
interface AzureNodeData {
  label: string;
  nodeType: string;
  iconPath: string;
  backgroundColor: string;
  borderColor: string;
  isContainer?: boolean;
  children?: string[];
  subscriptionType?: string;
  vmCount?: number;
  addressSpace?: string;
}

// Azure Service Node Component
const AzureServiceNode: React.FC<{ data: AzureNodeData }> = ({ data }) => {
  const { label, iconPath, backgroundColor, borderColor, vmCount, addressSpace } = data;
  
  return (
    <div
      style={{
        background: backgroundColor,
        border: `2px solid ${borderColor}`,
        borderRadius: '8px',
        padding: '12px',
        minWidth: '140px',
        minHeight: '60px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <img 
          src={iconPath} 
          alt={label}
          style={{ width: '24px', height: '24px' }}
          onError={(e) => {
            // Fallback to a default icon if the Azure icon fails to load
            e.currentTarget.src = '/Azure_Public_Service_Icons/Icons/compute/10021-icon-service-Virtual-Machine.svg';
          }}
        />
        <span style={{ 
          fontSize: '12px', 
          fontWeight: '600', 
          color: '#333',
          textAlign: 'center',
          lineHeight: '1.2'
        }}>
          {label}
        </span>
      </div>
      {vmCount && (
        <span style={{ fontSize: '10px', color: '#666' }}>
          {vmCount} VMs
        </span>
      )}
      {addressSpace && (
        <span style={{ fontSize: '10px', color: '#666' }}>
          {addressSpace}
        </span>
      )}
    </div>
  );
};

// Subscription Container Node Component
const SubscriptionContainerNode: React.FC<{ data: AzureNodeData }> = ({ data }) => {
  const { label, backgroundColor, borderColor, subscriptionType, children } = data;
  
  return (
    <div
      style={{
        background: backgroundColor,
        border: `3px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '16px',
        minWidth: '200px',
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '8px',
        padding: '4px 8px',
        background: 'rgba(255,255,255,0.8)',
        borderRadius: '6px',
        border: `1px solid ${borderColor}`
      }}>
        <span style={{ 
          fontSize: '14px', 
          fontWeight: 'bold', 
          color: '#333',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {label}
        </span>
        {subscriptionType && (
          <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
            {subscriptionType.replace('-', ' ')}
          </div>
        )}
      </div>
      {children && children.length > 0 && (
        <div style={{ 
          fontSize: '10px', 
          color: '#666', 
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          {children.length} resources
        </div>
      )}
    </div>
  );
};

// Management Group Node Component
const ManagementGroupNode: React.FC<{ data: AzureNodeData }> = ({ data }) => {
  const { label, backgroundColor, borderColor, children } = data;
  
  return (
    <div
      style={{
        background: backgroundColor,
        border: `4px solid ${borderColor}`,
        borderRadius: '16px',
        padding: '20px',
        minWidth: '180px',
        minHeight: '80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 6px 12px rgba(0,0,0,0.2)',
      }}
    >
      <div style={{ 
        textAlign: 'center',
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.9)',
        borderRadius: '8px',
        border: `2px solid ${borderColor}`
      }}>
        <span style={{ 
          fontSize: '16px', 
          fontWeight: 'bold', 
          color: '#333',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          {label}
        </span>
        {children && children.length > 0 && (
          <div style={{ 
            fontSize: '12px', 
            color: '#666', 
            marginTop: '4px',
            fontWeight: '500'
          }}>
            {children.length} subscriptions
          </div>
        )}
      </div>
    </div>
  );
};

// Custom Edge Component with Labels
const CustomEdge: React.FC<{ data?: { label?: string; edgeType?: string } }> = ({ data }) => {
  const { label, edgeType } = data || {};
  
  // Edge color mapping based on connection type
  const getEdgeColor = (type?: string) => {
    switch (type) {
      case 'peering': return '#1976d2'; // Blue
      case 'private-endpoint': return '#f57c00'; // Orange
      case 'ingress': return '#4caf50'; // Green
      case 'management': return '#9c27b0'; // Purple
      case 'diagnostics': return '#607d8b'; // Gray
      default: return '#666666'; // Default gray
    }
  };

  return (
    <>
      <path
        stroke={getEdgeColor(edgeType)}
        strokeWidth={2}
        fill="none"
        markerEnd="url(#arrowhead)"
      />
      {label && (
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: '10px',
            fill: getEdgeColor(edgeType),
            fontWeight: '600',
            background: 'white',
            padding: '2px 4px',
            borderRadius: '4px',
          }}
        >
          {label}
        </text>
      )}
    </>
  );
};

// Node type mapping
const nodeTypes: NodeTypes = {
  azureService: AzureServiceNode,
  subscriptionContainer: SubscriptionContainerNode,
  managementGroup: ManagementGroupNode,
};

// Edge type mapping
const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

// Main Architecture React Flow Component
interface ArchitectureReactFlowProps {
  model: ArchitectureModel;
  onExport?: (files: { png?: Blob; svg?: string; xml: string }) => void;
}

const ArchitectureReactFlowInner: React.FC<ArchitectureReactFlowProps> = ({ model }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  // Convert architecture model to React Flow nodes and edges
  const convertModelToReactFlow = useCallback((archModel: ArchitectureModel) => {
    const reactFlowNodes: Node[] = [];
    const reactFlowEdges: Edge[] = [];
    const nodeIdMap = new Map<string, string>();

    // Helper function to get Azure icon path
    const getAzureIconPath = (nodeType: string): string => {
      const basePath = '/Azure_Public_Service_Icons/Icons';
      
      // Map node types to Azure icons
      const iconMap: Record<string, string> = {
        // Compute
        vm: `${basePath}/compute/10021-icon-service-Virtual-Machine.svg`,
        vmss: `${basePath}/compute/10022-icon-service-Virtual-Machine-Scale-Sets.svg`,
        
        // Networking
        vnet: `${basePath}/networking/10061-icon-service-Virtual-Networks.svg`,
        subnet: `${basePath}/networking/02742-icon-service-Subnet.svg`,
        nsg: `${basePath}/networking/10067-icon-service-Network-Security-Groups.svg`,
        firewall: `${basePath}/networking/10084-icon-service-Firewalls.svg`,
        lb: `${basePath}/networking/10062-icon-service-Load-Balancers.svg`,
        appgw: `${basePath}/networking/10063-icon-service-Application-Gateways.svg`,
        bastion: `${basePath}/networking/10085-icon-service-Bastions.svg`,
        frontdoor: `${basePath}/networking/10086-icon-service-Front-Doors.svg`,
        
        // Data
        sql: `${basePath}/databases/10130-icon-service-SQL-Database.svg`,
        storage: `${basePath}/storage/10087-icon-service-Storage-Accounts.svg`,
        
        // Security
        keyvault: `${basePath}/security/10245-icon-service-Key-Vaults.svg`,
        defender: `${basePath}/security/10246-icon-service-Defender-for-Cloud.svg`,
        
        // Observability
        monitor: `${basePath}/monitor/00001-icon-service-Monitor.svg`,
        loganalytics: `${basePath}/monitor/00009-icon-service-Log-Analytics-Workspaces.svg`,
        
        // Identity & Management
        identity: `${basePath}/identity/10001-icon-service-Azure-Active-Directory.svg`,
        management: `${basePath}/management + governance/10002-icon-service-Azure-Policy.svg`,
      };

      return iconMap[nodeType] || iconMap.vm;
    };

    // Helper function to get background color based on entity type
    const getBackgroundColor = (entityType?: string, subscriptionType?: string): string => {
      if (entityType === 'vnet') return '#f3e5f5'; // Light purple
      if (entityType === 'subnet') return '#e8f5e8'; // Light green
      if (entityType === 'service' || entityType === 'compute') return '#e3f2fd'; // Light blue
      
      // Subscription colors
      if (subscriptionType?.includes('identity')) return '#fff3e0'; // Light orange
      if (subscriptionType?.includes('management')) return '#fce4ec'; // Light pink
      if (subscriptionType?.includes('connectivity')) return '#e8f5e8'; // Light green
      if (subscriptionType?.includes('landingzone')) return '#f3e5f5'; // Light purple
      
      return '#f5f5f5'; // Default light gray
    };

    // Helper function to get border color
    const getBorderColor = (entityType?: string, subscriptionType?: string): string => {
      if (entityType === 'vnet') return '#7b1fa2'; // Purple
      if (entityType === 'subnet') return '#4caf50'; // Green
      if (entityType === 'service' || entityType === 'compute') return '#1976d2'; // Blue
      
      // Subscription colors
      if (subscriptionType?.includes('identity')) return '#f57c00'; // Orange
      if (subscriptionType?.includes('management')) return '#e91e63'; // Pink
      if (subscriptionType?.includes('connectivity')) return '#4caf50'; // Green
      if (subscriptionType?.includes('landingzone')) return '#7b1fa2'; // Purple
      
      return '#666666'; // Default gray
    };

    let nodeCounter = 0;

    // Add Management Groups at the top
    if (archModel.managementGroups) {
      archModel.managementGroups.forEach((mg, index) => {
        const nodeId = `mg-${mg.id}`;
        nodeIdMap.set(mg.id, nodeId);
        
        reactFlowNodes.push({
          id: nodeId,
          type: 'managementGroup',
          position: { x: 50, y: 50 + (index * 120) },
          data: {
            label: mg.name,
            nodeType: 'managementGroup',
            iconPath: '/Azure_Public_Service_Icons/Icons/management + governance/10002-icon-service-Azure-Policy.svg',
            backgroundColor: '#e8eaf6',
            borderColor: '#3f51b5',
            children: mg.children,
          },
        });
      });
    }

    // Add Subscriptions
    if (archModel.subscriptions) {
      archModel.subscriptions.forEach((sub, index) => {
        const nodeId = `sub-${sub.id}`;
        nodeIdMap.set(sub.id, nodeId);
        
        // Position subscriptions below management groups
        const x = 50 + (index * 250);
        const y = 200;
        
        reactFlowNodes.push({
          id: nodeId,
          type: 'subscriptionContainer',
          position: { x, y },
          data: {
            label: sub.name,
            nodeType: 'subscription',
            iconPath: '/Azure_Public_Service_Icons/Icons/management + governance/10002-icon-service-Azure-Policy.svg',
            backgroundColor: getBackgroundColor('subscription', sub.type),
            borderColor: getBorderColor('subscription', sub.type),
            subscriptionType: sub.type,
            children: sub.vnets?.map(vnet => vnet.id) || [],
          },
        });

        // Connect to parent management group if exists
        if (sub.mgId && nodeIdMap.has(sub.mgId)) {
          reactFlowEdges.push({
            id: `edge-${nodeCounter++}`,
            source: nodeIdMap.get(sub.mgId)!,
            target: nodeId,
            type: 'custom',
            data: { label: 'contains', edgeType: 'management' },
          });
        }
      });
    }

    // Add VNets and their resources
    archModel.nodes.forEach((node, index) => {
      const nodeId = `node-${node.id}`;
      nodeIdMap.set(node.id, nodeId);
      
      let x = 100 + (index * 180);
      let y = 350;
      
      // Position based on subscription if available
      if (node.subscriptionId && nodeIdMap.has(node.subscriptionId)) {
        const subscriptionNodeId = nodeIdMap.get(node.subscriptionId);
        if (subscriptionNodeId) {
          const parentNode = reactFlowNodes.find(n => n.id === subscriptionNodeId);
          if (parentNode) {
            x = parentNode.position.x + 50;
            y = parentNode.position.y + 150;
          }
        }
      }

      reactFlowNodes.push({
        id: nodeId,
        type: 'azureService',
        position: { x, y },
        data: {
          label: node.label,
          nodeType: node.type,
          iconPath: getAzureIconPath(node.type),
          backgroundColor: getBackgroundColor(node.entityType, node.subscriptionType),
          borderColor: getBorderColor(node.entityType, node.subscriptionType),
          vmCount: node.vmCount,
          addressSpace: node.addressSpace,
        },
      });

      // Connect to parent subscription if available
      if (node.subscriptionId && nodeIdMap.has(node.subscriptionId)) {
        reactFlowEdges.push({
          id: `edge-${nodeCounter++}`,
          source: nodeIdMap.get(node.subscriptionId)!,
          target: nodeId,
          type: 'custom',
          data: { label: 'contains', edgeType: 'management' },
        });
      }
    });

    // Add edges between nodes
    archModel.edges.forEach((edge) => {
      if (nodeIdMap.has(edge.from) && nodeIdMap.has(edge.to)) {
        reactFlowEdges.push({
          id: `edge-${nodeCounter++}`,
          source: nodeIdMap.get(edge.from)!,
          target: nodeIdMap.get(edge.to)!,
          type: 'custom',
          data: { 
            label: edge.label, 
            edgeType: edge.edgeType 
          },
        });
      }
    });

    return { nodes: reactFlowNodes, edges: reactFlowEdges };
  }, []);

  // Initialize nodes and edges when model changes
  React.useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = convertModelToReactFlow(model);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [model, convertModelToReactFlow, setNodes, setEdges]);

  // Handle edge connections
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Export functions
  const exportAsSvg = useCallback(() => {
    const svgElement = document.querySelector('.react-flow__viewport svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'azure-architecture.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, []);

  const exportAsPng = useCallback(() => {
    const svgElement = document.querySelector('.react-flow__viewport svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'azure-architecture.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        });
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  }, []);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.1 });
  }, [fitView]);

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        
        {/* SVG Definitions for markers */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#666666" />
            </marker>
          </defs>
        </svg>
        
        {/* Custom Controls Panel */}
        <Panel position="top-right">
          <div className="flex gap-2 p-2 bg-white rounded-lg shadow-lg border">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFitView}
              className="flex items-center gap-1"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => zoomIn()}
              className="flex items-center gap-1"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => zoomOut()}
              className="flex items-center gap-1"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportAsSvg}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              SVG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportAsPng}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              PNG
            </Button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

// Wrapper component with ReactFlowProvider
const ArchitectureReactFlow: React.FC<ArchitectureReactFlowProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ArchitectureReactFlowInner {...props} />
    </ReactFlowProvider>
  );
};

export default ArchitectureReactFlow;
