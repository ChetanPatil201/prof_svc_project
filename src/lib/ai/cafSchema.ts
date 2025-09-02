import { z } from 'zod';

// Schema for CAF architecture recommendations from AI
export const CafArchitectureSchema = z.object({
  architecture: z.object({
    pattern: z.enum(['hub-spoke', 'simple', 'caf']),
    subscriptions: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['platform-identity', 'platform-management', 'platform-connectivity', 'landingzone-prod', 'landingzone-nonprod', 'platform-data']),
      vnets: z.array(z.object({
        id: z.string(),
        name: z.string(),
        addressSpace: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/), // CIDR format
        subnets: z.array(z.object({
          id: z.string(),
          name: z.string(),
          addressPrefix: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/), // CIDR format
          tier: z.enum(['web', 'app', 'db', 'management', 'bastion']).optional(),
          vmCount: z.number().int().min(0).optional(),
          vmSku: z.string().optional(),
          services: z.array(z.object({
            id: z.string(),
            name: z.string(),
            type: z.enum(['vm', 'vmss', 'sql', 'storage', 'keyvault', 'monitor', 'firewall', 'bastion', 'appgw', 'lb', 'nsg']),
            count: z.number().int().min(0).default(0),
            sku: z.string().optional(),
            config: z.record(z.any()).optional()
          })).optional()
        }))
      }))
    }))
  }),
  meta: z.object({
    assumptions: z.array(z.string()),
    recommendations: z.array(z.string()),
    risks: z.array(z.string()),
    estimatedCost: z.number().optional(),
    complexity: z.enum(['low', 'medium', 'high']).optional()
  })
});

export type CafArchitecture = z.infer<typeof CafArchitectureSchema>;

// Default fallback architecture when AI parsing fails
export const DEFAULT_CAF_ARCHITECTURE: CafArchitecture = {
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
                  },
                  {
                    id: 'bastion-hub',
                    name: 'Azure Bastion',
                    type: 'bastion',
                    count: 1
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'sub-spoke',
        name: 'Spoke Subscription',
        type: 'landingzone-prod',
        vnets: [
          {
            id: 'vnet-spoke',
            name: 'Spoke VNet',
            addressSpace: '10.1.0.0/16',
            subnets: [
              {
                id: 'subnet-spoke-web',
                name: 'Web Tier',
                addressPrefix: '10.1.0.0/24',
                tier: 'web',
                vmCount: 0,
                services: []
              },
              {
                id: 'subnet-spoke-app',
                name: 'App Tier',
                addressPrefix: '10.1.1.0/24',
                tier: 'app',
                vmCount: 0,
                services: []
              },
              {
                id: 'subnet-spoke-db',
                name: 'DB Tier',
                addressPrefix: '10.1.2.0/24',
                tier: 'db',
                vmCount: 0,
                services: []
              }
            ]
          }
        ]
      }
    ]
  },
  meta: {
    assumptions: ['Using default hub-spoke pattern due to parsing error'],
    recommendations: ['Review and customize the architecture based on your specific requirements'],
    risks: ['Default configuration may not meet security or performance requirements'],
    complexity: 'low'
  }
};
