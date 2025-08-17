"use client"

import React, { useCallback, useMemo, useState } from 'react';
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
  Panel,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Download, 
  Settings,
  Server,
  Database,
  Shield,
  Network,
  Monitor,
  Cloud,
  Users,
  Key,
  Search,
  Bot
} from 'lucide-react';
import type { AssessmentReportData } from '@/types/assessmentReport';
import type { ArchitectureModel, ArchNode, ArchEdge, AacLayer } from '@/types/architecture';
import { generateAzureArchitecture } from '@/lib/azureArchitectureGenerator';

// Custom Node Components
const AzureNode = ({ data }: { data: any }) => {
  const getIcon = () => {
    switch (data.type) {
      case 'vm': 
        return <img src="/Azure_Public_Service_Icons/Icons/compute/10021-icon-service-Virtual-Machine.svg" alt="VM" className="h-4 w-4" />;
      case 'vmss': 
        return <img src="/Azure_Public_Service_Icons/Icons/compute/10034-icon-service-VM-Scale-Sets.svg" alt="VMSS" className="h-4 w-4" />;
      case 'sql': 
        return <img src="/Azure_Public_Service_Icons/Icons/databases/02390-icon-service-Azure-SQL.svg" alt="SQL" className="h-4 w-4" />;
      case 'storage': 
        return <img src="/Azure_Public_Service_Icons/Icons/storage/10086-icon-service-Storage-Accounts.svg" alt="Storage" className="h-4 w-4" />;
      case 'firewall': 
        return <img src="/Azure_Public_Service_Icons/Icons/networking/10084-icon-service-Firewalls.svg" alt="Firewall" className="h-4 w-4" />;
      case 'vnet': 
        return <img src="/Azure_Public_Service_Icons/Icons/networking/10061-icon-service-Virtual-Networks.svg" alt="VNet" className="h-4 w-4" />;
      case 'monitor': 
        return <img src="/Azure_Public_Service_Icons/Icons/monitor/00001-icon-service-Monitor.svg" alt="Monitor" className="h-4 w-4" />;
      case 'keyvault': 
        return <img src="/Azure_Public_Service_Icons/Icons/security/10245-icon-service-Key-Vaults.svg" alt="Key Vault" className="h-4 w-4" />;
      case 'openai': 
        return <img src="/azure-icons/openai.svg" alt="OpenAI" className="h-4 w-4" />;
      case 'search': 
        return <img src="/azure-icons/cognitive-search.svg" alt="Search" className="h-4 w-4" />;
      case 'loganalytics': 
        return <img src="/azure-icons/log-analytics.svg" alt="Log Analytics" className="h-4 w-4" />;
      case 'lb': 
        return <img src="/azure-icons/load-balancer.svg" alt="Load Balancer" className="h-4 w-4" />;
      case 'appgw': 
        return <img src="/azure-icons/app-gateway.svg" alt="App Gateway" className="h-4 w-4" />;
      case 'bastion': 
        return <img src="/azure-icons/bastion.svg" alt="Bastion" className="h-4 w-4" />;
      case 'frontdoor': 
        return <img src="/azure-icons/frontdoor.svg" alt="Front Door" className="h-4 w-4" />;
      case 'nsg': 
        return <img src="/azure-icons/nsg.svg" alt="NSG" className="h-4 w-4" />;
      case 'subnet': 
        return <img src="/azure-icons/subnet.svg" alt="Subnet" className="h-4 w-4" />;
      case 'defender': 
        return <img src="/azure-icons/defender.svg" alt="Defender" className="h-4 w-4" />;
      case 'identity': 
        return <Users className="h-4 w-4" />; // Fallback to Lucide icon
      case 'policy': 
        return <Shield className="h-4 w-4" />; // Fallback to Lucide icon
      case 'disks': 
        return <img src="/Azure_Public_Service_Icons/Icons/compute/10032-icon-service-Disks.svg" alt="Disks" className="h-4 w-4" />;
      case 'availability-set': 
        return <img src="/Azure_Public_Service_Icons/Icons/compute/10025-icon-service-Availability-Sets.svg" alt="Availability Set" className="h-4 w-4" />;
      default: 
        return <Server className="h-4 w-4" />; // Fallback to Lucide icon
    }
  };

  const getNodeColor = () => {
    switch (data.layer) {
      case 'Connectivity': return 'bg-blue-500';
      case 'Networking': return 'bg-purple-500';
      case 'Compute': return 'bg-green-500';
      case 'Data': return 'bg-orange-500';
      case 'Security': return 'bg-red-500';
      case 'Identity': return 'bg-indigo-500';
      case 'Management': return 'bg-gray-500';
      case 'Observability': return 'bg-teal-500';
      case 'DevOps': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`px-3 py-2 shadow-lg rounded-lg border-2 border-white ${getNodeColor()} text-white min-w-[140px]`}>
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <span className="font-medium text-sm truncate">{data.label}</span>
      </div>
      {data.meta && (
        <div className="mt-1 text-xs opacity-90 space-y-0.5">
          {data.meta.sku && <div className="truncate">SKU: {data.meta.sku}</div>}
          {data.meta.size && <div className="truncate">Size: {data.meta.size}</div>}
          {data.meta.tier && <div className="truncate">Tier: {data.meta.tier}</div>}
          {data.meta.cores && <div className="truncate">Cores: {data.meta.cores}</div>}
          {data.meta.memoryGB && <div className="truncate">RAM: {data.meta.memoryGB}GB</div>}
        </div>
      )}
    </div>
  );
};

const GroupNode = ({ data }: { data: any }) => {
  const getGroupColor = () => {
    switch (data.layer) {
      case 'Connectivity': return 'bg-blue-100 border-blue-300';
      case 'Networking': return 'bg-purple-100 border-purple-300';
      case 'Compute': return 'bg-green-100 border-green-300';
      case 'Data': return 'bg-orange-100 border-orange-300';
      case 'Security': return 'bg-red-100 border-red-300';
      case 'Identity': return 'bg-indigo-100 border-indigo-300';
      case 'Management': return 'bg-gray-100 border-gray-300';
      case 'Observability': return 'bg-teal-100 border-teal-300';
      case 'DevOps': return 'bg-pink-100 border-pink-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${getGroupColor()} min-w-[220px] min-h-[120px]`}>
      <div className="font-semibold text-gray-800 mb-2 text-sm">{data.label}</div>
      {data.description && (
        <div className="text-xs text-gray-600 leading-relaxed">{data.description}</div>
      )}
      {data.meta && data.meta.addressSpace && (
        <div className="text-xs text-gray-500 mt-2 font-mono">
          {data.meta.addressSpace}
        </div>
      )}
    </div>
  );
};

// Custom Edge Component
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, style, data }: any) => {
  const [edgePath, labelX, labelY] = useMemo(() => {
    const centerX = (sourceX + targetX) / 2;
    const centerY = (sourceY + targetY) / 2;
    const path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    return [path, centerX, centerY];
  }, [sourceX, sourceY, targetX, targetY]);

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        stroke={data?.style === 'dashed' ? '#888' : '#333'}
        strokeWidth={2}
        strokeDasharray={data?.style === 'dashed' ? '5,5' : 'none'}
      />
      {data?.label && (
        <text>
          <textPath
            href={`#${id}`}
            style={{ fontSize: '12px' }}
            startOffset="50%"
            textAnchor="middle"
          >
            {data.label}
          </textPath>
        </text>
      )}
    </>
  );
};

const nodeTypes: NodeTypes = {
  azureNode: AzureNode,
  groupNode: GroupNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

// Inner component that can use ReactFlow hooks
function ReactFlowContent({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  onConnect 
}: {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: any;
}) {
  const { fitView } = useReactFlow();

  // Fit view when nodes change
  React.useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.1 }), 100);
    }
  }, [nodes.length, fitView]);

  return (
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
      <Controls />
      <Background color="#aaa" gap={16} />
      <MiniMap 
        nodeColor={(node) => {
          switch (node.data?.layer) {
            case 'Compute': return '#10b981';
            case 'Networking': return '#8b5cf6';
            case 'Data': return '#f97316';
            case 'Security': return '#ef4444';
            case 'Identity': return '#6366f1';
            case 'Management': return '#6b7280';
            case 'Observability': return '#14b8a6';
            default: return '#6b7280';
          }
        }}
      />
      <Panel position="top-right">
        <div className="bg-white p-2 rounded shadow-lg">
          <div className="text-xs font-medium mb-1">Legend</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Compute</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span>Networking</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Data</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Security</span>
            </div>
          </div>
        </div>
      </Panel>
    </ReactFlow>
  );
}

interface AzureArchitectureDiagramProps {
  assessment?: AssessmentReportData;
  className?: string;
}

export default function AzureArchitectureDiagram({ assessment, className = '' }: AzureArchitectureDiagramProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showDiagram, setShowDiagram] = useState(true);
  const [layoutPreset, setLayoutPreset] = useState<'caf' | 'simple' | 'hub-spoke'>('hub-spoke');
  const [showNonProd, setShowNonProd] = useState(true);
  const [includeObservability, setIncludeObservability] = useState(true);
  const [includeSecurity, setIncludeSecurity] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Generate Azure architecture
  const generateArchitecture = useCallback(() => {
    setIsLoading(true);
    
    try {
      // Use sample assessment data if none provided
      const assessmentData = assessment || {
        id: 'sample',
        clientName: 'Sample Client',
        assessmentDate: new Date().toISOString(),
        totalServers: 5,
        windowsServers: 3,
        linuxServers: 2,
        totalStorageTB: 1.0,
        targetRegion: 'East US',
        estimatedMonthlyCost: 2000,
        vmSummary: [
          {
            vmName: 'WEB-SRV-01',
            recommendedSku: 'Standard_D2s_v3',
            estimatedCost: 120,
            osType: 'Windows',
            cores: 2,
            memoryGB: 8,
            storageGB: 100
          },
          {
            vmName: 'APP-SRV-01',
            recommendedSku: 'Standard_D4s_v3',
            estimatedCost: 240,
            osType: 'Windows',
            cores: 4,
            memoryGB: 16,
            storageGB: 200
          },
          {
            vmName: 'DB-SRV-01',
            recommendedSku: 'Standard_D8s_v3',
            estimatedCost: 480,
            osType: 'Linux',
            cores: 8,
            memoryGB: 32,
            storageGB: 500
          }
        ],
        recommendations: [],
        risks: [],
        nextSteps: []
      };

      const { nodes: newNodes, edges: newEdges } = generateAzureArchitecture(
        assessmentData,
        layoutPreset,
        {
          showNonProd,
          includeObservability,
          includeSecurity
        }
      );

      setNodes(newNodes);
      setEdges(newEdges);
    } catch (error) {
      console.error('Error generating architecture:', error);
    } finally {
      setIsLoading(false);
    }
  }, [assessment, layoutPreset, showNonProd, includeObservability, includeSecurity, setNodes, setEdges]);

  // Generate architecture on mount and when options change
  React.useEffect(() => {
    generateArchitecture();
  }, [generateArchitecture]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleRefresh = () => {
    generateArchitecture();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify({ nodes, edges }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `azure-architecture-${layoutPreset}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getSummaryCounts = () => {
    const counts = {
      compute: nodes.filter(n => n.data?.layer === 'Compute').length,
      networking: nodes.filter(n => n.data?.layer === 'Networking').length,
      data: nodes.filter(n => n.data?.layer === 'Data').length,
      security: nodes.filter(n => n.data?.layer === 'Security').length,
    };
    return counts;
  };

  const summaryCounts = getSummaryCounts();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Azure Architecture Diagram
            </CardTitle>
            <CardDescription>
              Interactive Azure architecture based on your assessment data
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Layout Preset Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Layout:</span>
              <Button
                variant={layoutPreset === 'hub-spoke' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayoutPreset('hub-spoke')}
              >
                Hub-Spoke
              </Button>
              <Button
                variant={layoutPreset === 'simple' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayoutPreset('simple')}
              >
                Simple
              </Button>
              <Button
                variant={layoutPreset === 'caf' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayoutPreset('caf')}
              >
                CAF
              </Button>
            </div>
            
            {/* CAF Options */}
            {layoutPreset === 'caf' && (
              <div className="flex items-center gap-2">
                <Button
                  variant={showNonProd ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowNonProd(!showNonProd)}
                >
                  Show NonProd
                </Button>
                <Button
                  variant={includeObservability ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIncludeObservability(!includeObservability)}
                >
                  Observability
                </Button>
                <Button
                  variant={includeSecurity ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIncludeSecurity(!includeSecurity)}
                >
                  Security
                </Button>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDiagram(!showDiagram)}
              className="flex items-center gap-2"
            >
              {showDiagram ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showDiagram ? 'Hide' : 'Show'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Summary Counts */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-blue-600 font-semibold">{summaryCounts.compute}</div>
            <div className="text-sm text-blue-600">Compute</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-purple-600 font-semibold">{summaryCounts.networking}</div>
            <div className="text-sm text-purple-600">Networking</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-orange-600 font-semibold">{summaryCounts.data}</div>
            <div className="text-sm text-orange-600">Data</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-green-600 font-semibold">{summaryCounts.security}</div>
            <div className="text-sm text-green-600">Security</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="text-center py-8 text-blue-600 bg-blue-50 rounded-lg border border-blue-200">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin" />
            <p className="font-medium">Generating architecture diagram...</p>
            <p className="text-sm mt-1">Please wait while we process your assessment data</p>
          </div>
        )}

        {!isLoading && showDiagram && (
          <div style={{ height: '600px', width: '100%' }}>
            <ReactFlowProvider>
              <ReactFlowContent
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
              />
            </ReactFlowProvider>
          </div>
        )}

        {!isLoading && !showDiagram && (
          <div className="text-center py-8 text-gray-600 bg-gray-50 rounded-lg border border-gray-200">
            <EyeOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Diagram hidden</p>
            <p className="text-sm mt-1">Click "Show" to display the architecture diagram</p>
          </div>
        )}

        {/* Assessment Info */}
        {assessment && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-6">
            <div>
              <h4 className="font-medium mb-2">Assessment Summary</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Total Servers: {assessment.totalServers}</li>
                <li>• Target Region: {assessment.targetRegion || 'East US'}</li>
                <li>• Windows Servers: {assessment.windowsServers}</li>
                <li>• Linux Servers: {assessment.linuxServers}</li>
                <li>• Total Storage: {assessment.totalStorageTB.toFixed(2)} TB</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Architecture Features</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• {assessment.totalServers > 20 ? 'Hub-Spoke' : 'Single'} VNet Design</li>
                <li>• Load Balancer: {assessment.totalServers > 5 ? 'Yes' : 'No'}</li>
                <li>• Firewall: {assessment.totalServers > 10 ? 'Yes' : 'No'}</li>
                <li>• Database Tier: {assessment.vmSummary?.some(vm => vm.vmName?.toLowerCase().includes('db')) ? 'Yes' : 'No'}</li>
                <li>• Monitoring & Security: Enabled</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
