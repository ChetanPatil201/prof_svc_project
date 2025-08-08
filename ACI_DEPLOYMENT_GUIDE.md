# Azure Container Instances Deployment Guide

## Overview
This guide will help you deploy your Next.js application to Azure Container Instances (ACI) using Azure Container Registry (ACR).

## Prerequisites

1. **Azure CLI installed and logged in:**
   ```bash
   # Install Azure CLI (macOS)
   brew install azure-cli
   
   # Login to Azure
   az login
   ```

2. **Docker installed locally** (for testing)

## Quick Deployment

### Option 1: Automated Script Deployment

1. **Make the script executable:**
   ```bash
   chmod +x aci-deploy.sh
   ```

2. **Run the deployment:**
   ```bash
   ./aci-deploy.sh
   ```

3. **Access your application:**
   The script will output the public IP address where your app is available.

### Option 2: GitHub Actions CI/CD

1. **Create Azure Service Principal:**
   ```bash
   az ad sp create-for-rbac --name "prof-svc-sp" --role contributor \
     --scopes /subscriptions/{subscription-id} \
     --sdk-auth
   ```

2. **Add the JSON output as GitHub Secret:**
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Create secret named `AZURE_CREDENTIALS` with the JSON output

3. **Rename the workflow file:**
   ```bash
   mv aci-github-actions.yml .github/workflows/
   ```

4. **Push to trigger deployment:**
   ```bash
   git add .
   git commit -m "Add ACI deployment workflow"
   git push origin main
   ```

## Management Commands

### Using the Management Script

```bash
chmod +x aci-management.sh

# Check status
./aci-management.sh status

# View logs
./aci-management.sh logs

# Restart container
./aci-management.sh restart

# Update with latest code
./aci-management.sh update

# Stop container (to save costs)
./aci-management.sh stop

# Start container
./aci-management.sh start

# Delete container
./aci-management.sh delete
```

### Manual Azure CLI Commands

```bash
# Check container status
az container show \
  --resource-group prof-svc-rg \
  --name prof-svc-container \
  --query "{State:provisioningState,IP:ipAddress.ip,Ports:ipAddress.ports[0].port}" \
  --output table

# View logs
az container logs \
  --resource-group prof-svc-rg \
  --name prof-svc-container

# Restart container
az container restart \
  --resource-group prof-svc-rg \
  --name prof-svc-container
```

## Environment Variables

To add environment variables to your container:

```bash
az container create \
  --resource-group prof-svc-rg \
  --name prof-svc-container \
  --image your-registry.azurecr.io/prof-svc-app:latest \
  --registry-login-server your-registry.azurecr.io \
  --registry-username your-username \
  --registry-password your-password \
  --dns-name-label prof-svc-container \
  --ports 3000 \
  --environment-variables \
    NODE_ENV=production \
    AZURE_OPENAI_API_KEY=your-api-key \
    AZURE_OPENAI_ENDPOINT=your-endpoint \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
  --cpu 1 \
  --memory 1.5
```

## Cost Optimization

### Container Sizing
- **CPU:** 0.5-2 cores (0.5 for dev, 1-2 for production)
- **Memory:** 0.5-4 GB (1.5 GB recommended for Next.js)

### Cost-Saving Tips
1. **Stop containers when not in use:**
   ```bash
   ./aci-management.sh stop
   ```

2. **Use smaller instances for development:**
   ```bash
   --cpu 0.5 --memory 0.5
   ```

3. **Monitor costs:**
   ```bash
   az consumption usage list --query "[?contains(instanceName, 'prof-svc')]"
   ```

## Troubleshooting

### Common Issues

1. **Container fails to start:**
   ```bash
   # Check logs
   az container logs --resource-group prof-svc-rg --name prof-svc-container
   
   # Check events
   az container show --resource-group prof-svc-rg --name prof-svc-container --query "containers[0].instanceView.events"
   ```

2. **Image pull issues:**
   ```bash
   # Verify ACR credentials
   az acr credential show --name profsvcregistry
   
   # Test login
   az acr login --name profsvcregistry
   ```

3. **Port binding issues:**
   - Ensure your app listens on `0.0.0.0:3000`
   - Check the Dockerfile exposes port 3000

### Performance Monitoring

```bash
# Get container metrics
az monitor metrics list \
  --resource "/subscriptions/{subscription-id}/resourceGroups/prof-svc-rg/providers/Microsoft.ContainerInstance/containerGroups/prof-svc-container" \
  --metric "CpuUsage" \
  --interval PT1M
```

## Security Best Practices

1. **Use managed identities instead of service principals**
2. **Store secrets in Azure Key Vault**
3. **Enable network security groups**
4. **Use private container registries**

## Next Steps

1. **Set up custom domain** with Azure Application Gateway
2. **Configure SSL/TLS** certificates
3. **Set up monitoring** with Azure Monitor
4. **Implement auto-scaling** with Azure Container Apps (if needed)

## Cost Estimation

- **Basic ACI:** ~$0.000014/second (~$10-30/month)
- **ACR Basic:** ~$5/month
- **Total estimated cost:** $15-35/month

For higher traffic, consider migrating to Azure Container Apps or App Service. 