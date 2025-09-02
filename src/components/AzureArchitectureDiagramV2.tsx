import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  NodeTypes,
  EdgeTypes,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Controls,
  Background,
  MiniMap,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom Node for Subscription (Parent Container)
const SubscriptionNode = ({ data }: { data: any }) => {
  return (
    <div className="subscription-node">
      <div className="subscription-header">
        <div className="subscription-icon">📋</div>
        <div className="subscription-title">{data.label}</div>
      </div>
      <div className="subscription-subtitle">{data.subtitle}</div>
      {data.children && (
        <div className="subscription-children">
          {data.children}
        </div>
      )}
    </div>
  );
};

// Custom Node for Virtual Network (Child Component)
const VNetNode = ({ data }: { data: any }) => {
  return (
    <div className="vnet-node">
      <div className="vnet-header">
        <div className="vnet-icon">🌐</div>
        <div className="vnet-title">{data.label}</div>
      </div>
      <div className="vnet-subtitle">{data.subtitle}</div>
      <div className="vnet-ip">{data.ipAddress}</div>
    </div>
  );
};

// Define node types
const nodeTypes: NodeTypes = {
  subscription: SubscriptionNode,
  vnet: VNetNode,
};

// Main Diagram Component
export default function AzureArchitectureDiagramV2() {
  // Initial nodes setup
  const initialNodes: Node[] = [
    {
      id: 'production-subscription',
      type: 'subscription',
      position: { x: 200, y: 100 },
      data: {
        label: 'Production Subscription',
        subtitle: 'Production Workloads and resources',
        children: null, // Will be populated by React Flow's parent-child relationship
      },
      style: {
        width: 300,
        height: 200,
      },
    },
    {
      id: 'production-vnet',
      type: 'vnet',
      position: { x: 250, y: 150 },
      data: {
        label: 'Production Virtual Network',
        subtitle: 'Main production network infrastructure',
        ipAddress: '10.0.0.0/16',
      },
      style: {
        width: 200,
        height: 120,
      },
      parentNode: 'production-subscription',
      extent: 'parent',
    },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <Background color="#aaa" gap={16} />
        <MiniMap />
        <Panel position="top-right">
          <div className="diagram-info">
            <h3>Azure Architecture Diagram</h3>
            <p>Interactive subscription and VNet structure</p>
          </div>
        </Panel>
      </ReactFlow>

      <style dangerouslySetInnerHTML={{
        __html: `
          .subscription-node {
            background: transparent;
            border: 2px dashed #A5D8FF;
            border-radius: 8px;
            padding: 16px;
            min-width: 280px;
            min-height: 180px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .subscription-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
          }

          .subscription-icon {
            font-size: 20px;
          }

          .subscription-title {
            font-weight: bold;
            font-size: 16px;
            color: #000;
          }

          .subscription-subtitle {
            font-size: 12px;
            color: #666;
            margin-bottom: 12px;
          }

          .subscription-children {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .vnet-node {
            background: transparent;
            border: 2px dashed #DDA0DD;
            border-radius: 8px;
            padding: 12px;
            min-width: 180px;
            min-height: 100px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          .vnet-header {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 6px;
          }

          .vnet-icon {
            font-size: 16px;
          }

          .vnet-title {
            font-weight: bold;
            font-size: 14px;
            color: #000;
          }

          .vnet-subtitle {
            font-size: 11px;
            color: #666;
            margin-bottom: 4px;
          }

          .vnet-ip {
            font-size: 10px;
            color: #666;
            font-family: monospace;
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 4px;
            display: inline-block;
          }

          .diagram-info {
            background: white;
            padding: 12px;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            font-size: 12px;
          }

          .diagram-info h3 {
            margin: 0 0 4px 0;
            font-size: 14px;
            color: #333;
          }

          .diagram-info p {
            margin: 0;
            color: #666;
          }
        `
      }} />
    </div>
  );
}

/*
EXTENSION NOTES:

1. ADDING MULTIPLE SUBSCRIPTIONS:
   - Duplicate the subscription node structure
   - Position them side-by-side or in a grid
   - Example: Add "Dev Subscription" and "Test Subscription"
   - Each can have its own VNet child

2. ADDING HUB-SPOKE TOPOLOGY:
   - Create a central "Hub VNet" subscription
   - Add multiple "Spoke VNet" subscriptions around it
   - Connect them with dashed edges labeled "VNet Peering"
   - Add security icons (🛡️) for firewalls
   - Use green arrows for "Forced Tunnel" connections

3. ADDING MORE COMPLEX ELEMENTS:
   - Create custom node types for: Firewall, Load Balancer, Database
   - Add edge types for different connection styles
   - Implement icons using SVG or emoji placeholders
   - Add tooltips and click handlers for interactivity

4. STYLING EXTENSIONS:
   - Add hover effects for nodes
   - Implement different border styles for different node types
   - Add color coding for different environments (prod=blue, dev=green, test=orange)
   - Create custom edge styles for different connection types

5. INTERACTIVITY FEATURES:
   - Add node selection highlighting
   - Implement node editing capabilities
   - Add context menus for node operations
   - Create node expansion/collapse functionality
*/
