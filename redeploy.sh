#!/bin/bash

echo "🔄 Rebuilding and redeploying application..."

# Configuration
RESOURCE_GROUP="prof-svc-rg"
CONTAINER_NAME="prof-svc-container"
ACR_NAME="profsvcregistry"
IMAGE_NAME="prof-svc-app:latest"

# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query "loginServer" --output tsv)
echo "ACR Login Server: $ACR_LOGIN_SERVER"

# Build and push new Docker image
echo "Building and pushing new Docker image..."
az acr build \
  --registry $ACR_NAME \
  --image $IMAGE_NAME \
  --file Dockerfile \
  .

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query "username" --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" --output tsv)

# Delete existing container
echo "Deleting existing container..."
az container delete \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME \
  --yes

# Create new container instance
echo "Creating new container instance..."
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
    AZURE_OPENAI_DEPLOYMENT="gpt-4o" \
  --cpu 1 \
  --memory 1.5

# Get the public IP
echo "Getting container details..."
sleep 10  # Wait for container to start
PUBLIC_IP=$(az container show \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME \
  --query "ipAddress.ip" --output tsv)

echo "✅ Redeployment complete!"
echo "🌐 Your app is available at: http://$PUBLIC_IP:3000"
