import AzureArchitectureDiagramV2 from '@/components/AzureArchitectureDiagramV2';

export default function AzureDiagramV2Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Azure Architecture Diagram V2
        </h1>
        <p className="text-gray-600 max-w-4xl">
          This is a React Flow implementation that matches the exact styling requirements:
          transparent backgrounds, dashed borders, proper colors, and nested subscription/VNet structure.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg border p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Interactive Azure Architecture
          </h2>
          <p className="text-sm text-gray-600">
            Features: Draggable nodes, zoom controls, transparent styling, dashed borders
          </p>
        </div>
        
        <AzureArchitectureDiagramV2 />
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Styling Features
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Transparent backgrounds for both subscription and VNet</li>
            <li>• Dashed blue border (#A5D8FF) for subscription</li>
            <li>• Dashed purple border (#DDA0DD) for VNet</li>
            <li>• Rounded corners (8px border-radius)</li>
            <li>• Proper typography with bold titles and gray subtitles</li>
            <li>• Monospace IP address display</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            React Flow Features
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Custom node types for subscription and VNet</li>
            <li>• Parent-child relationship (VNet nested in subscription)</li>
            <li>• Draggable and interactive nodes</li>
            <li>• Zoom and pan controls</li>
            <li>• Mini-map for navigation</li>
            <li>• Background grid pattern</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Extension Notes
        </h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            <strong>Multiple Subscriptions:</strong> Duplicate the subscription node structure and position them side-by-side or in a grid.
          </p>
          <p>
            <strong>Hub-Spoke Topology:</strong> Create a central "Hub VNet" subscription with multiple "Spoke VNet" subscriptions around it, connected with dashed edges.
          </p>
          <p>
            <strong>Complex Elements:</strong> Add custom node types for Firewall, Load Balancer, Database with appropriate icons and styling.
          </p>
          <p>
            <strong>Interactivity:</strong> Add hover effects, node selection highlighting, and context menus for enhanced user experience.
          </p>
        </div>
      </div>
    </div>
  );
}
