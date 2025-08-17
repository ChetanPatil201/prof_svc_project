import { NodeType } from '@/types/architecture';

export function getAzureIconPath(nodeType: NodeType, label?: string): string {
  const basePath = '/Azure_Public_Service_Icons/Icons';
  const lowerLabel = label?.toLowerCase() || '';
  
  switch (nodeType) {
    // Compute
    case 'vm':
      return `${basePath}/compute/10021-icon-service-Virtual-Machine.svg`;
    case 'vmss':
      return `${basePath}/compute/10034-icon-service-VM-Scale-Sets.svg`;
    
    // Networking
    case 'vnet':
      return `${basePath}/networking/10061-icon-service-Virtual-Networks.svg`;
    case 'subnet':
      return `${basePath}/networking/02742-icon-service-Subnet.svg`;
    case 'nsg':
      return `${basePath}/networking/10067-icon-service-Network-Security-Groups.svg`;
    case 'lb':
      return `${basePath}/networking/10062-icon-service-Load-Balancers.svg`;
    case 'appgw':
      return `${basePath}/networking/10076-icon-service-Application-Gateways.svg`;
    case 'firewall':
      return `${basePath}/networking/10084-icon-service-Firewalls.svg`;
    case 'bastion':
      return `${basePath}/networking/02422-icon-service-Bastions.svg`;
    case 'frontdoor':
      return `${basePath}/networking/10073-icon-service-Front-Door-and-CDN-Profiles.svg`;
    
    // Data
    case 'sql':
      return `${basePath}/databases/10130-icon-service-SQL-Database.svg`;
    case 'storage':
      return `${basePath}/storage/10002-icon-service-Storage-Accounts.svg`;
    
    // Security
    case 'keyvault':
    case 'kv':
      return `${basePath}/security/10245-icon-service-Key-Vaults.svg`;
    case 'defender':
      return `${basePath}/security/10241-icon-service-Microsoft-Defender-for-Cloud.svg`;
    
    // Observability
    case 'monitor':
      return `${basePath}/monitor/00001-icon-service-Monitor.svg`;
    case 'loganalytics':
      return `${basePath}/monitor/00009-icon-service-Log-Analytics-Workspaces.svg`;
    
    // AI & ML
    case 'openai':
      return `${basePath}/ai + machine learning/10370-icon-service-Azure-OpenAI.svg`;
    case 'search':
      return `${basePath}/ai + machine learning/10145-icon-service-Azure-Cognitive-Search.svg`;
    
    // Custom/Other - map based on label
    case 'custom':
      if (lowerLabel.includes('active directory') || lowerLabel.includes('aad')) {
        return `${basePath}/identity/10001-icon-service-Azure-Active-Directory.svg`;
      } else if (lowerLabel.includes('policy')) {
        return `${basePath}/management + governance/10001-icon-service-Policy.svg`;
      } else if (lowerLabel.includes('dns') || lowerLabel.includes('resolver')) {
        return `${basePath}/networking/10064-icon-service-DNS-Zones.svg`;
      } else if (lowerLabel.includes('observability')) {
        return `${basePath}/monitor/00001-icon-service-Monitor.svg`;
      } else if (lowerLabel.includes('vpn') || lowerLabel.includes('gateway')) {
        return `${basePath}/networking/10063-icon-service-Virtual-Network-Gateways.svg`;
      } else if (lowerLabel.includes('expressroute')) {
        return `${basePath}/networking/10079-icon-service-ExpressRoute-Circuits.svg`;
      } else if (lowerLabel.includes('private link') || lowerLabel.includes('private endpoint')) {
        return `${basePath}/networking/00427-icon-service-Private-Link.svg`;
      }
      // Default for custom
      return `${basePath}/general/10001-icon-service-Resource-Groups.svg`;
    
    default:
      // Fallback to general resource icon
      return `${basePath}/general/10001-icon-service-Resource-Groups.svg`;
  }
}

// Helper function to get icon for specific Azure services by name
export function getIconForService(serviceName: string): string {
  const basePath = '/Azure_Public_Service_Icons/Icons';
  const lowerName = serviceName.toLowerCase();
  
  // Azure Active Directory
  if (lowerName.includes('active directory') || lowerName.includes('aad')) {
    return `${basePath}/identity/10001-icon-service-Azure-Active-Directory.svg`;
  }
  
  // Azure Policy
  if (lowerName.includes('policy')) {
    return `${basePath}/management + governance/10001-icon-service-Policy.svg`;
  }
  
  // DNS Private Resolver
  if (lowerName.includes('dns') && lowerName.includes('resolver')) {
    return `${basePath}/networking/02882-icon-service-DNS-Private-Resolver.svg`;
  }
  
  // VPN Gateway
  if (lowerName.includes('vpn') && lowerName.includes('gateway')) {
    return `${basePath}/networking/10063-icon-service-Virtual-Network-Gateways.svg`;
  }
  
  // ExpressRoute Gateway
  if (lowerName.includes('expressroute')) {
    return `${basePath}/networking/10079-icon-service-ExpressRoute-Circuits.svg`;
  }
  
  // Private Endpoints
  if (lowerName.includes('private endpoint') || lowerName.includes('private link')) {
    return `${basePath}/networking/00427-icon-service-Private-Link.svg`;
  }
  
  // Default fallback
  return `${basePath}/general/10001-icon-service-Resource-Groups.svg`;
}
