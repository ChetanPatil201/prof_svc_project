#!/bin/bash

echo "🚀 Deploying to Azure Container Apps..."

# Configuration
RESOURCE_GROUP="prof-svc-rg"
CONTAINER_APP_NAME="prof-svc-app"
ENVIRONMENT_NAME="prof-svc-env"
LOCATION="westus"
ACR_NAME="profsvcregistry"
IMAGE_NAME="prof-svc-app:latest"

# Check if resource group exists
if ! az group show --name $RESOURCE_GROUP --query "id" --output tsv > /dev/null 2>&1; then
    echo "Creating resource group..."
    az group create --name $RESOURCE_GROUP --location $LOCATION
else
    echo "Resource group already exists"
fi

# Check if ACR exists
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

# Build and push Docker image
echo "Building and pushing Docker image..."
az acr build \
  --registry $ACR_NAME \
  --image $IMAGE_NAME \
  --file Dockerfile \
  .

# Create Container Apps Environment
echo "Creating Container Apps Environment..."
az containerapp env create \
  --name $ENVIRONMENT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --yes

# Deploy Container App
echo "Deploying Container App..."
az containerapp create \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT_NAME \
  --image $ACR_LOGIN_SERVER/$IMAGE_NAME \
  --target-port 3000 \
  --ingress external \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_NAME \
  --registry-password $(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv) \
  --env-vars \
    NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
  --cpu 1 \
  --memory 2.0Gi \
  --yes

# Get application URL
APP_URL=$(az containerapp show \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "properties.configuration.ingress.fqdn" \
  --output tsv)

echo "🎉 Deployment complete!"
echo "🌐 Your app is available at: https://$APP_URL"
