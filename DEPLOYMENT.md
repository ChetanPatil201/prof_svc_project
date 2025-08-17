# Professional Services Cloud Migration Tool - Deployment Guide

## 🚀 Overview

This guide covers multiple deployment options for the Professional Services Cloud Migration Tool, a Next.js application that analyzes Azure Migrate assessment data and provides VM sizing recommendations with cost optimization.

## 📋 Prerequisites

- ✅ Azure account with active subscription
- ✅ Docker Desktop installed and running
- ✅ Azure CLI installed and logged in
- ✅ Node.js 18+ (for local development)

## 🔧 Environment Setup

### 1. Azure OpenAI Configuration

Create a `.env.local` file with your Azure OpenAI credentials:

```bash
# Create environment file
cat > .env.local << EOF
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=your-azure-openai-key-here
AZURE_OPENAI_DEPLOYMENT=gpt-4o
EOF
```

### 2. Azure CLI Login

```bash
# Login to Azure
az login

# Set subscription (if you have multiple)
az account list --output table
az account set --subscription "your-subscription-id"
```

## 🐳 Option 1: Local Docker Deployment (Recommended for Development)

### Quick Start

```bash
# Make script executable
chmod +x quick-start.sh

# Start the application
./quick-start.sh
```

### Manual Docker Commands

```bash
# Start application
docker compose up -d

# View logs
docker compose logs -f

# Stop application
docker compose down

# Rebuild after changes
docker compose up --build -d
```

### Verification

```bash
# Check container status
docker compose ps

# Test endpoints
curl http://localhost:3000
curl http://localhost:3000/api/test-endpoint
```

**Access your application at:** http://localhost:3000

## ☁️ Option 2: Azure Container Instances (ACI) - Simple Cloud Deployment

### Automated Deployment

```bash
# Make script executable
chmod +x aci-deploy-simple.sh

# Deploy to ACI
./aci-deploy-simple.sh
```

### Manual ACI Deployment

```bash
# Create resource group
az group create --name "prof-svc-rg" --location "West US"

# Create container registry
az acr create --resource-group "prof-svc-rg" \
  --name "profsvcregistry" --sku Basic

# Enable admin user
az acr update --name profsvcregistry --admin-enabled true

# Login to registry
az acr login --name profsvcregistry

# Build and push image
docker build -t profsvcregistry.azurecr.io/prof-svc-project:latest .
docker push profsvcregistry.azurecr.io/prof-svc-project:latest

# Deploy to ACI
az container create \
  --resource-group "prof-svc-rg" \
  --name "prof-svc-container" \
  --image profsvcregistry.azurecr.io/prof-svc-project:latest \
  --dns-name-label "prof-svc-app" \
  --ports 3000 \
  --environment-variables \
    AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/ \
    AZURE_OPENAI_KEY=your-azure-openai-key-here \
    AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

### ACI Management

```bash
# Check status
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

# Delete container (to save costs)
az container delete \
  --resource-group prof-svc-rg \
  --name prof-svc-container \
  --yes
```

## 🌍 Option 3: Azure Container Apps - Production Deployment

### Step-by-Step Deployment

```bash
# 1. Create resource group
az group create --name "prof-svc-rg" --location "West US"

# 2. Create container registry
az acr create --resource-group "prof-svc-rg" \
  --name "profsvcregistry" --sku Basic

# 3. Enable admin user
az acr update --name profsvcregistry --admin-enabled true

# 4. Login to registry
az acr login --name profsvcregistry

# 5. Build and push image
docker build -t profsvcregistry.azurecr.io/prof-svc-project:latest .
docker push profsvcregistry.azurecr.io/prof-svc-project:latest

# 6. Create Container Apps Environment
az containerapp env create \
  --name "prof-svc-env" \
  --resource-group "prof-svc-rg" \
  --location "West US"

# 7. Deploy Container App
az containerapp create \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --environment "prof-svc-env" \
  --image profsvcregistry.azurecr.io/prof-svc-project:latest \
  --target-port 3000 \
  --ingress external \
  --registry-server profsvcregistry.azurecr.io \
  --registry-username profsvcregistry \
  --registry-password $(az acr credential show --name profsvcregistry --query "passwords[0].value" -o tsv) \
  --env-vars \
    AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/ \
    AZURE_OPENAI_KEY=your-azure-openai-key-here \
    AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

### Container Apps Management

```bash
# Get application URL
az containerapp show \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --query "properties.configuration.ingress.fqdn" \
  --output tsv

# View logs
az containerapp logs show \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg"

# Scale application
az containerapp revision set-mode \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --mode Single

# Update with new image
az containerapp update \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --image profsvcregistry.azurecr.io/prof-svc-project:latest
```

## 🔄 Option 4: GitHub Actions CI/CD

### Setup GitHub Actions

1. **Create Azure Service Principal:**
```bash
az ad sp create-for-rbac --name "prof-svc-sp" --role contributor \
  --scopes /subscriptions/{subscription-id} \
  --sdk-auth
```

2. **Add GitHub Secret:**
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Create secret named `AZURE_CREDENTIALS` with the JSON output

3. **Create workflow file:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Azure Container Apps

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Azure Container Registry Login
      uses: azure/docker-login@v1
      with:
        login-server: profsvcregistry.azurecr.io
        username: ${{ secrets.REGISTRY_USERNAME }}
        password: ${{ secrets.REGISTRY_PASSWORD }}
    
    - name: Build and Push Image
      run: |
        docker build -t profsvcregistry.azurecr.io/prof-svc-project:${{ github.sha }} .
        docker push profsvcregistry.azurecr.io/prof-svc-project:${{ github.sha }}
    
    - name: Deploy to Azure Container Apps
      uses: azure/container-apps-deploy-action@v1
      with:
        appSourcePath: ${{ github.workspace }}
        acrName: profsvcregistry
        acrUsername: ${{ secrets.REGISTRY_USERNAME }}
        acrPassword: ${{ secrets.REGISTRY_PASSWORD }}
        containerAppName: prof-svc-app
        resourceGroupName: prof-svc-rg
        imageToDeploy: profsvcregistry.azurecr.io/prof-svc-project:${{ github.sha }}
```

## 🧪 Testing Your Deployment

### Basic Functionality Tests

1. **Health Check:**
```bash
curl https://your-app-url.azurecontainerapps.io
# Should return HTTP 200
```

2. **API Endpoints:**
```bash
curl https://your-app-url.azurecontainerapps.io/api/test-endpoint
# Should return JSON response
```

### Application Features Testing

1. **Upload Assessment File:**
   - Navigate to `/dashboard/assessment-reports`
   - Upload a CSV file with VM data
   - Verify data processing

2. **Generate Reports:**
   - Click "Generate Assessment Report"
   - Test Azure OpenAI integration
   - Verify report generation

3. **VM Recommendations:**
   - Check VM recommendations display
   - Verify pricing calculations
   - Test disk constraint functionality

## 🔍 Troubleshooting

### Common Issues

#### 1. Container Won't Start
```bash
# Check logs
docker compose logs
# or
az container logs --resource-group prof-svc-rg --name prof-svc-container
```

#### 2. Environment Variables Not Loading
```bash
# Verify .env.local exists
ls -la .env.local

# Check environment variables in container
docker compose exec app env | grep AZURE
```

#### 3. Azure OpenAI Connection Issues
```bash
# Test API endpoint
curl -H "Content-Type: application/json" \
  -H "api-key: your-key" \
  "https://your-resource.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-15-preview" \
  -d '{"messages":[{"role":"user","content":"test"}]}'
```

#### 4. Registry Authentication Issues
```bash
# Re-login to ACR
az acr login --name profsvcregistry

# Check credentials
az acr credential show --name profsvcregistry
```

### Performance Optimization

#### 1. Container Apps Scaling
```bash
# Enable scaling
az containerapp update \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --min-replicas 1 \
  --max-replicas 10
```

#### 2. Resource Limits
```bash
# Set CPU and memory limits
az containerapp update \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --cpu 1.0 \
  --memory 2.0Gi
```

## 📊 Monitoring and Logs

### Azure Monitor Integration

```bash
# Enable monitoring
az monitor diagnostic-settings create \
  --resource-group "prof-svc-rg" \
  --resource-name "prof-svc-app" \
  --name "container-app-monitoring" \
  --workspace "your-log-analytics-workspace"
```

### Custom Logging

The application includes comprehensive logging:
- 🔍 Debug logs for troubleshooting
- ✅ Success confirmations
- ❌ Error details with stack traces
- 🔄 Progress indicators for long operations

## 💰 Cost Optimization

### Azure Container Instances
- **Stop when not in use:** `az container stop --resource-group prof-svc-rg --name prof-svc-container`
- **Use Basic SKU:** Suitable for development and testing
- **Monitor usage:** Check Azure portal for cost analysis

### Azure Container Apps
- **Scale to zero:** Set `--min-replicas 0` for cost savings
- **Use consumption plan:** Pay only for actual usage
- **Monitor scaling:** Use Azure Monitor for optimization

## 🔐 Security Best Practices

1. **Use Azure Key Vault for secrets:**
```bash
# Store secrets in Key Vault
az keyvault secret set --vault-name "your-keyvault" --name "AZURE-OPENAI-KEY" --value "your-key"
```

2. **Enable managed identity:**
```bash
# Assign managed identity to Container App
az containerapp identity assign \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --system-assigned
```

3. **Network security:**
```bash
# Restrict to specific IPs
az containerapp update \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --ingress external \
  --target-port 3000 \
  --allow-insecure false
```

## 📝 Quick Reference

### Local Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

### Docker Commands
```bash
docker compose up -d     # Start application
docker compose down      # Stop application
docker compose logs -f   # View logs
```

### Azure CLI Commands
```bash
az login                    # Login to Azure
az group list              # List resource groups
az container list          # List containers
az acr list               # List container registries
```

### Environment Variables
```bash
AZURE_OPENAI_ENDPOINT     # Your Azure OpenAI endpoint
AZURE_OPENAI_KEY          # Your Azure OpenAI API key
AZURE_OPENAI_DEPLOYMENT   # Your deployment name (e.g., gpt-4o)
```

---

**Need Help?** Check the troubleshooting section above or create an issue in the repository.
