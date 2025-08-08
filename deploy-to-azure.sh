#!/bin/bash

echo "🚀 Deploying to Azure Container Apps..."

# Check if Azure CLI is available
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Please install it first."
    exit 1
fi

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop."
    exit 1
fi

echo "✅ Prerequisites checked"

# Build the image
echo "🔨 Building Docker image..."
docker build -t profsvcregistry.azurecr.io/prof-svc-project:latest .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

echo "✅ Image built successfully"

# Push to registry
echo "📤 Pushing to Azure Container Registry..."
docker push profsvcregistry.azurecr.io/prof-svc-project:latest

if [ $? -ne 0 ]; then
    echo "❌ Push failed! Make sure you're logged into ACR:"
    echo "   az acr login --name profsvcregistry"
    exit 1
fi

echo "✅ Image pushed successfully"

# Update Container App
echo "🚀 Updating Container App..."
az containerapp update \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --image profsvcregistry.azurecr.io/prof-svc-project:latest

if [ $? -ne 0 ]; then
    echo "❌ Container App update failed!"
    exit 1
fi

echo "✅ Container App updated successfully"

# Get the URL
echo "🌐 Getting application URL..."
URL=$(az containerapp show \
  --name "prof-svc-app" \
  --resource-group "prof-svc-rg" \
  --query properties.configuration.ingress.fqdn \
  -o tsv)

echo "🎉 Deployment complete!"
echo "📱 Your application is available at: https://$URL"
echo ""
echo "📋 Useful commands:"
echo "  View logs: az containerapp logs show --name prof-svc-app --resource-group prof-svc-rg --follow"
echo "  Check status: az containerapp show --name prof-svc-app --resource-group prof-svc-rg --query properties.runningStatus"
echo "  Scale: az containerapp revision set-mode --name prof-svc-app --resource-group prof-svc-rg --mode single" 