import { convertCafToReactFlow, applyDagreLayout, clampNodeSizes } from '../fromAiGraph';
import type { CafArchitecture } from '../../ai/cafSchema';
import type { ArchitectureModel } from '@/types/architecture';

describe('AI Graph Conversion Tests', () => {
  describe('Edge Deduplication', () => {
    it('should remove duplicate edges', () => {
      const testArchitecture: CafArchitecture = {
        architecture: {
          pattern: 'hub-spoke',
          subscriptions: [
            {
              id: 'sub-hub',
              name: 'Hub Subscription',
              type: 'platform-connectivity',
              vnets: [
                {
                  id: 'vnet-hub',
                  name: 'Hub VNet',
                  addressSpace: '10.0.0.0/16',
                  subnets: [
                    {
                      id: 'subnet-hub',
                      name: 'Hub Subnet',
                      addressPrefix: '10.0.0.0/24',
                      services: []
                    }
                  ]
                }
              ]
            }
          ]
        },
        meta: {
          assumptions: [],
          recommendations: [],
          risks: []
        }
      };

      const result = convertCafToReactFlow(testArchitecture);
      
      // Should have exactly one containment edge from subscription to VNet
      const subscriptionToVnetEdges = result.edges.filter(
        edge => edge.source === 'sub-hub' && edge.target === 'vnet-hub'
      );
      expect(subscriptionToVnetEdges).toHaveLength(1);
    });

    it('should remove self-edges', () => {
      const testArchitecture: CafArchitecture = {
        architecture: {
          pattern: 'simple',
          subscriptions: [
            {
              id: 'sub-simple',
              name: 'Simple Subscription',
              type: 'landingzone-prod',
              vnets: [
                {
                  id: 'vnet-simple',
                  name: 'Simple VNet',
                  addressSpace: '10.0.0.0/16',
                  subnets: [
                    {
                      id: 'subnet-simple',
                      name: 'Simple Subnet',
                      addressPrefix: '10.0.0.0/24',
                      services: []
                    }
                  ]
                }
              ]
            }
          ]
        },
        meta: {
          assumptions: [],
          recommendations: [],
          risks: []
        }
      };

      const result = convertCafToReactFlow(testArchitecture);
      
      // Should not have any self-edges
      const selfEdges = result.edges.filter(edge => edge.source === edge.target);
      expect(selfEdges).toHaveLength(0);
    });
  });

  describe('CIDR Containment', () => {
    it('should validate subnet containment in VNet', () => {
      const validArchitecture: CafArchitecture = {
        architecture: {
          pattern: 'simple',
          subscriptions: [
            {
              id: 'sub-test',
              name: 'Test Subscription',
              type: 'landingzone-prod',
              vnets: [
                {
                  id: 'vnet-test',
                  name: 'Test VNet',
                  addressSpace: '10.0.0.0/16',
                  subnets: [
                    {
                      id: 'subnet-web',
                      name: 'Web Subnet',
                      addressPrefix: '10.0.1.0/24', // Valid: contained in 10.0.0.0/16
                      services: []
                    },
                    {
                      id: 'subnet-app',
                      name: 'App Subnet',
                      addressPrefix: '10.0.2.0/24', // Valid: contained in 10.0.0.0/16
                      services: []
                    }
                  ]
                }
              ]
            }
          ]
        },
        meta: {
          assumptions: [],
          recommendations: [],
          risks: []
        }
      };

      const result = convertCafToReactFlow(validArchitecture);
      
      // Should successfully convert without CIDR validation errors
      expect(result.nodes.length).toBeGreaterThan(0);
      expect(result.edges.length).toBeGreaterThan(0);
    });

    it('should detect invalid subnet containment', () => {
      const invalidArchitecture: CafArchitecture = {
        architecture: {
          pattern: 'simple',
          subscriptions: [
            {
              id: 'sub-test',
              name: 'Test Subscription',
              type: 'landingzone-prod',
              vnets: [
                {
                  id: 'vnet-test',
                  name: 'Test VNet',
                  addressSpace: '10.0.0.0/16',
                  subnets: [
                    {
                      id: 'subnet-invalid',
                      name: 'Invalid Subnet',
                      addressPrefix: '192.168.1.0/24', // Invalid: not contained in 10.0.0.0/16
                      services: []
                    }
                  ]
                }
              ]
            }
          ]
        },
        meta: {
          assumptions: [],
          recommendations: [],
          risks: []
        }
      };

      // Mock console.warn to capture validation warnings
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = convertCafToReactFlow(invalidArchitecture);
      
      // Should still convert but log warnings
      expect(result.nodes.length).toBeGreaterThan(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        'CIDR validation issues:',
        expect.any(Array)
      );
      
      consoleSpy.mockRestore();
    });

    it('should validate subnet mask is more specific than VNet mask', () => {
      const invalidArchitecture: CafArchitecture = {
        architecture: {
          pattern: 'simple',
          subscriptions: [
            {
              id: 'sub-test',
              name: 'Test Subscription',
              type: 'landingzone-prod',
              vnets: [
                {
                  id: 'vnet-test',
                  name: 'Test VNet',
                  addressSpace: '10.0.0.0/16',
                  subnets: [
                    {
                      id: 'subnet-invalid',
                      name: 'Invalid Subnet',
                      addressPrefix: '10.0.0.0/16', // Invalid: same mask as VNet
                      services: []
                    }
                  ]
                }
              ]
            }
          ]
        },
        meta: {
          assumptions: [],
          recommendations: [],
          risks: []
        }
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = convertCafToReactFlow(invalidArchitecture);
      
      expect(result.nodes.length).toBeGreaterThan(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        'CIDR validation issues:',
        expect.any(Array)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Node Size Clamping', () => {
    it('should clamp node sizes to reasonable bounds', () => {
      const testModel: ArchitectureModel = {
        nodes: [
          {
            id: 'test-node-1',
            type: 'vm',
            label: 'Test Node 1',
            layer: 'Compute',
            bounds: {
              x: 0,
              y: 0,
              w: 50, // Too small
              h: 30  // Too small
            }
          },
          {
            id: 'test-node-2',
            type: 'vm',
            label: 'Test Node 2',
            layer: 'Compute',
            bounds: {
              x: 100,
              y: 100,
              w: 500, // Too large
              h: 200  // Too large
            }
          }
        ],
        edges: []
      };

      const clampedModel = clampNodeSizes(testModel);
      
      // Check that sizes are clamped
      const node1 = clampedModel.nodes.find(n => n.id === 'test-node-1');
      const node2 = clampedModel.nodes.find(n => n.id === 'test-node-2');
      
      expect(node1?.bounds?.w).toBe(100); // Minimum width
      expect(node1?.bounds?.h).toBe(60);  // Minimum height
      expect(node2?.bounds?.w).toBe(400); // Maximum width
      expect(node2?.bounds?.h).toBe(120); // Maximum height
    });

    it('should preserve nodes without bounds', () => {
      const testModel: ArchitectureModel = {
        nodes: [
          {
            id: 'test-node',
            type: 'vm',
            label: 'Test Node',
            layer: 'Compute'
            // No bounds
          }
        ],
        edges: []
      };

      const clampedModel = clampNodeSizes(testModel);
      
      const node = clampedModel.nodes.find(n => n.id === 'test-node');
      expect(node?.bounds).toBeUndefined();
    });
  });

  describe('Dagre Layout', () => {
    it('should apply hierarchical layout', () => {
      const testModel: ArchitectureModel = {
        nodes: [
          {
            id: 'node-1',
            type: 'subscription',
            label: 'Subscription',
            layer: 'Management'
          },
          {
            id: 'node-2',
            type: 'vnet',
            label: 'VNet',
            layer: 'Networking'
          },
          {
            id: 'node-3',
            type: 'vm',
            label: 'VM',
            layer: 'Compute'
          }
        ],
        edges: [
          {
            from: 'node-1',
            to: 'node-2'
          },
          {
            from: 'node-2',
            to: 'node-3'
          }
        ]
      };

      const layoutedModel = applyDagreLayout(testModel);
      
      // Should have bounds assigned
      expect(layoutedModel.nodes.every(node => node.bounds)).toBe(true);
      
      // Should have different Y positions for different layers
      const managementNodes = layoutedModel.nodes.filter(n => n.layer === 'Management');
      const networkingNodes = layoutedModel.nodes.filter(n => n.layer === 'Networking');
      const computeNodes = layoutedModel.nodes.filter(n => n.layer === 'Compute');
      
      if (managementNodes.length > 0 && networkingNodes.length > 0) {
        expect(managementNodes[0].bounds?.y).toBeLessThan(networkingNodes[0].bounds?.y || 0);
      }
      
      if (networkingNodes.length > 0 && computeNodes.length > 0) {
        expect(networkingNodes[0].bounds?.y).toBeLessThan(computeNodes[0].bounds?.y || 0);
      }
    });
  });
});
