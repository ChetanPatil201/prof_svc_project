# Azure Container Apps Deployment Guide

## 🚀 Complete Step-by-Step Deployment Process

This guide documents the exact steps that worked for deploying your Next.js application to Azure Container Apps.

## 📋 Prerequisites

- ✅ Azure account with active subscription
- ✅ Docker Desktop installed and running
- ✅ Azure CLI installed
- ✅ Your Next.js application ready

## 🔧 Step 1: Azure Setup

### 1.1 Login to Azure
```bash
# Login to Azure
az login
```

### 1.2 Set Subscription (if you have multiple)
```bash
# List subscriptions
az account list --output table

# Set your subscription
az account set --subscription "your-subscription-id"
```

### 1.3 Create Resource Group
```bash
# Create resource group
az group create --name "prof-svc-rg" --location "West US"
```

## 📦 Step 2: Azure Container Registry Setup

### 2.1 Create Container Registry
```bash
# Create Azure Container Registry
az acr create --resource-group "prof-svc-rg" \
  --name "profsvcregistry" --sku Basic
```

### 2.2 Enable Admin User
```bash
# Enable admin user for authentication
az acr update --name profsvcregistry --admin-enabled true
```

### 2.3 Login to Container Registry
```bash
# Login to ACR
az acr login --name profsvcregistry
```

## 🐳 Step 3: Build and Push Docker Image

### 3.1 Build Docker Image
```bash
# Build the image for Azure Container Registry
docker build -t profsvcregistry.azurecr.io/prof-svc-project:latest .
```

### 3.2 Push to Container Registry
```bash
# Push the image to ACR
docker push profsvcregistry.azurecr.io/prof-svc-project:latest
```

## 🌍 Step 4: Create Container Apps Environment

### 4.1 Create Environment
```bash
# Create Container Apps Environment
az containerapp env create \
  --name "prof-svc-env" \
  --resource-group "prof-svc-rg" \
  --location "West US"
```

## 🔐 Step 5: Deploy Container App with Environment Variables

### 5.1 Create Container App with Authentication
```bash
# Create Container App with registry authentication and environment variables
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
    AZURE_OPENAI_ENDPOINT=https://cp-azureopenai.openai.azure.com/ \
    AZURE_OPENAI_KEY=***REMOVED*** \
    AZURE_OPENAI_DEPLOYMENT=gpt-4o \
    NODE_ENV=production
```

## ✅ Step 6: Verify Deployment

### 6.1 Get Application URL
```bash
# Get the application URL
az containerapp show \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --query properties.configuration.ingress.fqdn
```

### 6.2 Check Application Status
```bash
# Check running status
az containerapp show \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --query properties.runningStatus
```

### 6.3 View Logs
```bash
# View container logs
az containerapp logs show \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --follow
```

## 🧪 Step 7: Test Your Application

### 7.1 Test Endpoints
```bash
# Test main page
curl https://your-app-url.azurecontainerapps.io

# Test API endpoint
curl https://your-app-url.azurecontainerapps.io/api/test-endpoint
```

### 7.2 Access in Browser
- Open your browser and navigate to: `https://your-app-url.azurecontainerapps.io`
- Test all application features (upload files, generate reports, etc.)

## 🔄 Step 8: Update Application (After Code Changes)

### 8.1 Rebuild and Push Image
```bash
# Build updated image
docker build -t profsvcregistry.azurecr.io/prof-svc-project:latest .

# Push to registry
docker push profsvcregistry.azurecr.io/prof-svc-project:latest
```

### 8.2 Update Container App
```bash
# Update Container App with new image
az containerapp update \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --image profsvcregistry.azurecr.io/prof-svc-project:latest
```

## 📊 Step 9: Management Commands

### 9.1 View Application Details
```bash
# Get Container App details
az containerapp show \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg"
```

### 9.2 Scale Application
```bash
# Scale to specific number of replicas
az containerapp revision set-mode \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --mode single
```

### 9.3 Increase Resources (Performance Optimization)
```bash
# Update Container App with more CPU and Memory
az containerapp update \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --cpu 2.0 \
  --memory 4.0Gi

# Or for even more resources (for heavy workloads)
az containerapp update \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --cpu 4.0 \
  --memory 8.0Gi
```

### 9.4 Configure Auto-scaling
```bash
# Enable auto-scaling with custom rules
az containerapp update \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --min-replicas 1 \
  --max-replicas 10 \
  --scale-rule-name "http-scaling" \
  --scale-rule-type "http" \
  --scale-rule-http-concurrency 50 \
  --scale-rule-http-concurrency-percent 80
```

### 9.5 Performance Monitoring
```bash
# View current resource usage
az containerapp show \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --query "properties.template.containers[0].resources"

# Monitor scaling events
az containerapp revision list \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --query "[].{name:name,created:properties.createdTime,replicas:properties.replicas}"
```

### 9.3 View Logs
```bash
# View recent logs
az containerapp logs show \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --tail 100
```

### 9.4 Delete Resources (if needed)
```bash
# Delete Container App
az containerapp delete \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --yes

# Delete Container Apps Environment
az containerapp env delete \
  --name "prof-svc-env" \
  --resource-group "prof-svc-rg" \
  --yes

# Delete Container Registry
az acr delete \
  --name profsvcregistry \
  --resource-group "prof-svc-rg" \
  --yes
```

## 🚀 Performance Optimization Guide

### 🎯 Resource Allocation Strategies

#### **Option 1: Increase CPU and Memory**
```bash
# Standard performance (recommended for most workloads)
az containerapp update \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --cpu 2.0 \
  --memory 4.0Gi

# High performance (for heavy file processing)
az containerapp update \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --cpu 4.0 \
  --memory 8.0Gi

# Maximum performance (for intensive AI workloads)
az containerapp update \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --cpu 8.0 \
  --memory 16.0Gi
```

#### **Option 2: Enable Auto-scaling**
```bash
# Auto-scale based on HTTP requests
az containerapp update \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --min-replicas 1 \
  --max-replicas 5 \
  --scale-rule-name "http-scaling" \
  --scale-rule-type "http" \
  --scale-rule-http-concurrency 50

# Auto-scale based on CPU usage
az containerapp update \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --min-replicas 1 \
  --max-replicas 10 \
  --scale-rule-name "cpu-scaling" \
  --scale-rule-type "cpu" \
  --scale-rule-cpu-percentage 70
```

#### **Option 3: Optimize for Specific Workloads**
```bash
# For file processing workloads
az containerapp update \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --cpu 4.0 \
  --memory 8.0Gi \
  --min-replicas 2 \
  --max-replicas 8

# For AI/ML workloads
az containerapp update \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --cpu 8.0 \
  --memory 16.0Gi \
  --min-replicas 1 \
  --max-replicas 3
```

### 📊 Performance Monitoring Commands

#### **Check Current Resources**
```bash
# View current resource allocation
az containerapp show \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --query "properties.template.containers[0].resources"

# Monitor scaling events
az containerapp revision list \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --query "[].{name:name,created:properties.createdTime,replicas:properties.replicas}"
```

#### **Monitor Performance**
```bash
# View real-time logs
az containerapp logs show \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --follow

# Check application metrics
az monitor metrics list \
  --resource "/subscriptions/{subscription-id}/resourceGroups/prof-svc-rg/providers/Microsoft.App/containerApps/prof-svc-app" \
  --metric "CpuPercentage,MemoryPercentage" \
  --interval PT1M
```

### 💡 Performance Tips

1. **Start with 2 CPU / 4GB Memory** for most workloads
2. **Use auto-scaling** for variable traffic patterns
3. **Monitor CPU and memory usage** regularly
4. **Scale up during peak hours** if needed
5. **Consider regional deployment** for better latency

## 🎯 Key Success Factors

### ✅ What Made This Work
1. **Admin-enabled Container Registry** - Required for authentication
2. **Proper registry authentication** - Using admin credentials
3. **Correct environment variables** - All required variables set
4. **Proper image tagging** - Using full registry path
5. **External ingress** - Making app accessible from internet

### ❌ Common Issues Avoided
1. **No `--env-file` option** - Not available in Azure Container Apps
2. **No managed identity complexity** - Used simple admin authentication
3. **No Key Vault setup** - Used direct environment variables
4. **No complex networking** - Used default external ingress

## 📋 Resource Names Used

- **Resource Group**: `prof-svc-rg`
- **Container Registry**: `profsvcregistry`
- **Container Apps Environment**: `prof-svc-env`
- **Container App**: `prof-svc-app`
- **Image**: `profsvcregistry.azurecr.io/prof-svc-project:latest`

## 🚀 Quick Deployment Script

For future deployments, you can use this script:

```bash
#!/bin/bash
# Quick deployment script

echo "🚀 Deploying to Azure Container Apps..."

# Build and push
docker build -t profsvcregistry.azurecr.io/prof-svc-project:latest .
docker push profsvcregistry.azurecr.io/prof-svc-project:latest

# Deploy
az containerapp update \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --image profsvcregistry.azurecr.io/prof-svc-project:latest

echo "✅ Deployment complete!"
echo "🌐 URL: $(az containerapp show --name prof-svc-app --resource-group prof-svc-rg --query properties.configuration.ingress.fqdn -o tsv)"
```

## 🎉 Success!

Your application is now successfully deployed to Azure Container Apps with:
- ✅ Secure container registry authentication
- ✅ Environment variables properly configured
- ✅ External access enabled
- ✅ Auto-scaling capabilities
- ✅ Monitoring and logging

Access your application at the provided URL and test all features! 