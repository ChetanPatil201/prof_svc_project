#!/bin/bash

echo "🔄 Updating container environment variables..."

# Configuration
RESOURCE_GROUP="prof-svc-rg"
CONTAINER_NAME="prof-svc-container"
ACR_NAME="profsvcregistry"
IMAGE_NAME="prof-svc-app:latest"

# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query "loginServer" --output tsv)

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query "username" --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" --output tsv)

# Delete existing container
echo "Deleting existing container..."
az container delete \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME \
  --yes

# Create new container instance with updated environment variables
echo "Creating new container with updated environment variables..."
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
    AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/" \
    AZURE_OPENAI_KEY="your-azure-openai-key-here" \
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

echo "✅ Container environment variables updated!"
echo "🌐 Your app is available at: http://$PUBLIC_IP:3000"
echo ""
echo "⚠️  Remember to update the Azure OpenAI credentials in the script before running!"
