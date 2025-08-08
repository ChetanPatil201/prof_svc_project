#!/bin/bash

# Simple Azure Container Instances Deployment Script
# Prerequisites: Azure CLI installed and logged in, Docker installed locally

# Configuration
RESOURCE_GROUP="prof-svc-rg"
CONTAINER_NAME="prof-svc-container"
LOCATION="westus"
ACR_NAME="profsvcregistry"
IMAGE_NAME="prof-svc-app:latest"

echo "🚀 Starting Azure Container Instances deployment..."

# Check if resource group exists
echo "Checking resource group..."
if ! az group show --name $RESOURCE_GROUP --query "id" --output tsv > /dev/null 2>&1; then
    echo "Creating resource group..."
    az group create --name $RESOURCE_GROUP --location $LOCATION
else
    echo "Resource group already exists"
fi

# Check if ACR exists
echo "Checking Azure Container Registry..."
if ! az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query "id" --output tsv > /dev/null 2>&1; then
    echo "Creating Azure Container Registry..."
    az acr create \
      --resource-group $RESOURCE_GROUP \
      --name $ACR_NAME \
      --sku Basic \
      --admin-enabled true
else
    echo "Azure Container Registry already exists"
fi

# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query "loginServer" --output tsv)
echo "ACR Login Server: $ACR_LOGIN_SERVER"

# Build Docker image locally
echo "Building Docker image locally..."
if docker build -t $IMAGE_NAME -f Dockerfile.simple .; then
    echo "✅ Local build successful"
else
    echo "❌ Local build failed. Please check your Dockerfile and dependencies."
    exit 1
fi

# Tag and push to ACR
echo "Tagging and pushing to ACR..."
docker tag $IMAGE_NAME $ACR_LOGIN_SERVER/$IMAGE_NAME

# Login to ACR
echo "Logging into ACR..."
az acr login --name $ACR_NAME

# Push to ACR
echo "Pushing image to ACR..."
if docker push $ACR_LOGIN_SERVER/$IMAGE_NAME; then
    echo "✅ Image pushed successfully"
else
    echo "❌ Failed to push image to ACR"
    exit 1
fi

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query "username" --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" --output tsv)

# Delete existing container if it exists
echo "Checking for existing container..."
if az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --query "id" --output tsv > /dev/null 2>&1; then
    echo "Deleting existing container..."
    az container delete --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --yes
fi

# Create container instance
echo "Creating container instance..."
az container create \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME \
  --image $ACR_LOGIN_SERVER/$IMAGE_NAME \
  --registry-login-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --dns-name-label $CONTAINER_NAME \
  --ports 3000 \
  --environment-variables \
    NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
  --cpu 1 \
  --memory 1.5

# Get the public IP
echo "Getting container details..."
sleep 10  # Wait for container to start
if az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --query "ipAddress.ip" --output tsv > /dev/null 2>&1; then
    PUBLIC_IP=$(az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --query "ipAddress.ip" --output tsv)
    
    echo "✅ Deployment complete!"
    echo "🌐 Your app is available at: http://$PUBLIC_IP:3000"
    echo "📊 Container status:"
    az container show \
      --resource-group $RESOURCE_GROUP \
      --name $CONTAINER_NAME \
      --query "{State:provisioningState,IP:ipAddress.ip,Ports:ipAddress.ports[0].port}" \
      --output table
else
    echo "❌ Container not found or failed to start. Checking logs..."
    az container logs --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME || echo "No logs available"
fi 