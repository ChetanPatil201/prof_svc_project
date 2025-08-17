#!/bin/bash

# Azure App Service Deployment Script
# Prerequisites: Azure CLI installed and logged in

# Configuration
RESOURCE_GROUP="prof-svc-rg"
APP_NAME="prof-svc-app"
LOCATION="westus"
PLAN_NAME="prof-svc-plan"

echo "🚀 Starting Azure deployment..."

# Create resource group (only if it doesn't exist)
echo "Checking resource group..."
if ! az group show --name $RESOURCE_GROUP --query "id" --output tsv > /dev/null 2>&1; then
    echo "Creating resource group..."
    az group create --name $RESOURCE_GROUP --location $LOCATION
else
    echo "Resource group already exists"
fi

# Create App Service Plan (only if it doesn't exist)
echo "Checking App Service Plan..."
if ! az appservice plan show --name $PLAN_NAME --resource-group $RESOURCE_GROUP --query "id" --output tsv > /dev/null 2>&1; then
    echo "Creating App Service Plan..."
    az appservice plan create \
      --name $PLAN_NAME \
      --resource-group $RESOURCE_GROUP \
      --location $LOCATION \
      --sku B1 \
      --is-linux
else
    echo "App Service Plan already exists"
fi

# Create Web App (only if it doesn't exist)
echo "Checking Web App..."
if ! az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query "id" --output tsv > /dev/null 2>&1; then
    echo "Creating Web App..."
    az webapp create \
      --name $APP_NAME \
      --resource-group $RESOURCE_GROUP \
      --plan $PLAN_NAME \
      --runtime "NODE|18-lts"
else
    echo "Web App already exists"
fi

# Configure environment variables
echo "Configuring environment variables..."
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Deploy from local directory
echo "Deploying application..."
az webapp deployment source config-local-git \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# Get deployment URL
DEPLOYMENT_URL=$(az webapp deployment source config-local-git \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "url" --output tsv)

echo "✅ Deployment URL: $DEPLOYMENT_URL"
echo "🌐 Your app is available at: https://$APP_NAME.azurewebsites.net"
