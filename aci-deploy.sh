#!/bin/bash

# Azure Container Instances Deployment Script
# Prerequisites: Azure CLI installed and logged in

# Configuration
RESOURCE_GROUP="prof-svc-rg"
CONTAINER_NAME="prof-svc-container"
LOCATION="westus"  # Changed to match existing resource group
ACR_NAME="profsvcregistry"
IMAGE_NAME="prof-svc-app:latest"

echo "🚀 Starting Azure Container Instances deployment..."

# Create resource group (only if it doesn't exist)
echo "Checking resource group..."
if ! az group show --name $RESOURCE_GROUP --query "id" --output tsv > /dev/null 2>&1; then
    echo "Creating resource group..."
    az group create --name $RESOURCE_GROUP --location $LOCATION
else
    echo "Resource group already exists in $(az group show --name $RESOURCE_GROUP --query "location" --output tsv)"
fi

# Create Azure Container Registry (only if it doesn't exist)
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

# Build and push the Docker image
echo "Building and pushing Docker image..."
if ! az acr build \
  --registry $ACR_NAME \
  --image $IMAGE_NAME \
  --file Dockerfile \
  .; then
    echo "❌ Docker build failed. Let's try building locally first..."
    
    # Build locally to check for issues
    echo "Building Docker image locally..."
    if docker build -t $IMAGE_NAME .; then
        echo "✅ Local build successful. Pushing to ACR..."
        docker tag $IMAGE_NAME $ACR_LOGIN_SERVER/$IMAGE_NAME
        az acr login --name $ACR_NAME
        docker push $ACR_LOGIN_SERVER/$IMAGE_NAME
    else
        echo "❌ Local build also failed. Please check your Dockerfile and dependencies."
        exit 1
    fi
fi

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query "username" --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" --output tsv)

# Create container instance
echo "Creating container instance..."
if ! az container create \
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
  --memory 1.5; then
    echo "❌ Container creation failed. Let's check if the image exists..."
    
    # Check if image exists in ACR
    if az acr repository show --name $ACR_NAME --image $IMAGE_NAME > /dev/null 2>&1; then
        echo "✅ Image exists in ACR. Trying container creation again..."
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
    else
        echo "❌ Image not found in ACR. Please check the build process."
        exit 1
    fi
fi

# Get the public IP
echo "Getting container details..."
if az container show \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME \
  --query "ipAddress.ip" --output tsv > /dev/null 2>&1; then
    PUBLIC_IP=$(az container show \
      --resource-group $RESOURCE_GROUP \
      --name $CONTAINER_NAME \
      --query "ipAddress.ip" --output tsv)
    
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
    az container logs \
      --resource-group $RESOURCE_GROUP \
      --name $CONTAINER_NAME || echo "No logs available"
fi 