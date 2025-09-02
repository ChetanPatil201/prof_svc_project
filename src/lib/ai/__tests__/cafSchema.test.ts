import { CafArchitectureSchema, DEFAULT_CAF_ARCHITECTURE } from '../cafSchema';

describe('CAF Schema Tests', () => {
  describe('Schema Parse', () => {
    it('should parse valid CAF architecture', () => {
      const validArchitecture = {
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
                      id: 'subnet-hub-management',
                      name: 'Management Subnet',
                      addressPrefix: '10.0.0.0/24',
                      tier: 'management',
                      services: [
                        {
                          id: 'firewall-hub',
                          name: 'Azure Firewall',
                          type: 'firewall',
                          count: 1
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        meta: {
          assumptions: ['Using hub-spoke pattern for security'],
          recommendations: ['Implement proper NSGs'],
          risks: ['Network complexity'],
          estimatedCost: 5000,
          complexity: 'medium'
        }
      };

      const result = CafArchitectureSchema.safeParse(validArchitecture);
      expect(result.success).toBe(true);
    });

    it('should reject invalid CIDR format', () => {
      const invalidArchitecture = {
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
                  addressSpace: 'invalid-cidr', // Invalid CIDR
                  subnets: []
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

      const result = CafArchitectureSchema.safeParse(invalidArchitecture);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('addressSpace')
        )).toBe(true);
      }
    });

    it('should reject invalid subscription type', () => {
      const invalidArchitecture = {
        architecture: {
          pattern: 'hub-spoke',
          subscriptions: [
            {
              id: 'sub-hub',
              name: 'Hub Subscription',
              type: 'invalid-type', // Invalid subscription type
              vnets: []
            }
          ]
        },
        meta: {
          assumptions: [],
          recommendations: [],
          risks: []
        }
      };

      const result = CafArchitectureSchema.safeParse(invalidArchitecture);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('type')
        )).toBe(true);
      }
    });

    it('should reject invalid service type', () => {
      const invalidArchitecture = {
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
                      services: [
                        {
                          id: 'invalid-service',
                          name: 'Invalid Service',
                          type: 'invalid-service-type', // Invalid service type
                          count: 1
                        }
                      ]
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

      const result = CafArchitectureSchema.safeParse(invalidArchitecture);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('type')
        )).toBe(true);
      }
    });

    it('should validate default architecture', () => {
      const result = CafArchitectureSchema.safeParse(DEFAULT_CAF_ARCHITECTURE);
      expect(result.success).toBe(true);
    });

    it('should handle optional fields correctly', () => {
      const minimalArchitecture = {
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
                      addressPrefix: '10.0.0.0/24'
                      // No tier, vmCount, vmSku, or services
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
          // No estimatedCost or complexity
        }
      };

      const result = CafArchitectureSchema.safeParse(minimalArchitecture);
      expect(result.success).toBe(true);
    });
  });
});
