export interface AzureIconConfig {
  filename: string;
  defaultColor: string;
  category: 'networking' | 'compute' | 'data' | 'security' | 'observability' | 'ai' | 'storage';
}

export const azureIconMap: Record<string, AzureIconConfig> = {
  // Networking
  vnet: {
    filename: 'vnet.svg',
    defaultColor: '#0078d4', // Azure Blue
    category: 'networking'
  },
  subnet: {
    filename: 'subnet.svg',
    defaultColor: '#0078d4',
    category: 'networking'
  },
  nsg: {
    filename: 'nsg.svg',
    defaultColor: '#0078d4',
    category: 'networking'
  },
  firewall: {
    filename: 'firewall.svg',
    defaultColor: '#0078d4',
    category: 'networking'
  },
  appGateway: {
    filename: 'app-gateway.svg',
    defaultColor: '#0078d4',
    category: 'networking'
  },
  bastion: {
    filename: 'bastion.svg',
    defaultColor: '#0078d4',
    category: 'networking'
  },
  loadBalancer: {
    filename: 'load-balancer.svg',
    defaultColor: '#0078d4',
    category: 'networking'
  },
  frontDoor: {
    filename: 'frontdoor.svg',
    defaultColor: '#0078d4',
    category: 'networking'
  },

  // Compute
  vm: {
    filename: 'vm.svg',
    defaultColor: '#107c10', // Azure Green
    category: 'compute'
  },
  vmss: {
    filename: 'vmss.svg',
    defaultColor: '#107c10',
    category: 'compute'
  },

  // Data
  sql: {
    filename: 'sql.svg',
    defaultColor: '#68217a', // Azure Purple
    category: 'data'
  },
  storageBlob: {
    filename: 'storage-blob.svg',
    defaultColor: '#68217a',
    category: 'data'
  },
  cognitiveSearch: {
    filename: 'cognitive-search.svg',
    defaultColor: '#68217a',
    category: 'data'
  },

  // Security & Identity
  keyVault: {
    filename: 'key-vault.svg',
    defaultColor: '#d13438', // Azure Red
    category: 'security'
  },
  defender: {
    filename: 'defender.svg',
    defaultColor: '#d13438',
    category: 'security'
  },

  // Observability
  monitor: {
    filename: 'monitor.svg',
    defaultColor: '#00bcf2', // Azure Teal
    category: 'observability'
  },
  logAnalytics: {
    filename: 'log-analytics.svg',
    defaultColor: '#00bcf2',
    category: 'observability'
  },

  // AI
  openai: {
    filename: 'openai.svg',
    defaultColor: '#68217a',
    category: 'ai'
  }
};

export const getIconForNodeType = (nodeType: string): AzureIconConfig => {
  return azureIconMap[nodeType] || {
    filename: 'vm.svg', // Default fallback
    defaultColor: '#107c10',
    category: 'compute'
  };
};

export const getCategoryColor = (category: string): string => {
  const config = Object.values(azureIconMap).find(icon => icon.category === category);
  return config?.defaultColor || '#107c10';
};

// Draw.io Azure icon mapping
export const AZURE_ICON: Record<string, string> = {
  // Networking
  vnet: '/azure-icons/vnet.svg',
  subnet: '/azure-icons/subnet.svg',
  nsg: '/azure-icons/nsg.svg',
  firewall: '/azure-icons/firewall.svg',
  appGateway: '/azure-icons/app-gateway.svg',
  bastion: '/azure-icons/bastion.svg',
  loadBalancer: '/azure-icons/load-balancer.svg',
  frontDoor: '/azure-icons/frontdoor.svg',
  
  // Compute
  vm: '/azure-icons/vm.svg',
  vmss: '/azure-icons/vm.svg',
  
  // Data
  sql: '/azure-icons/sql.svg',
  storage: '/azure-icons/storage-blob.svg',
  storageBlob: '/azure-icons/storage-blob.svg',
  
  // Security & Identity
  keyVault: '/azure-icons/key-vault.svg',
  defender: '/azure-icons/defender.svg',
  policy: '/azure-icons/policy.svg',
  
  // Observability
  monitor: '/azure-icons/monitor.svg',
  logAnalytics: '/azure-icons/log-analytics.svg',
  
  // AI
  openai: '/azure-icons/openai.svg',
  cognitiveSearch: '/azure-icons/cognitive-search.svg',
  
  // Additional services
  privateEndpoint: '/azure-icons/private-endpoint.svg',
  
  // Fallback
  custom: '/azure-icons/vm.svg',
  identity: '/azure-icons/vm.svg', // For Azure AD
  management: '/azure-icons/vm.svg' // For Azure Policy
};

export const getDrawioIconForNodeType = (nodeType: string): string => {
  return AZURE_ICON[nodeType] || '/azure-icons/vm.svg';
};
