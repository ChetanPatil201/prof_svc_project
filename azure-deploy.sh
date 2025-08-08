#!/bin/bash

# Azure App Service Deployment Script
# Prerequisites: Azure CLI installed and logged in

# Configuration
RESOURCE_GROUP="prof-svc-rg"
APP_NAME="prof-svc-app"
LOCATION="eastus"
PLAN_NAME="prof-svc-plan"

echo "🚀 Starting Azure deployment..."

# Create resource group
echo "Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create App Service plan
echo "Creating App Service plan..."
az appservice plan create \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux

# Create web app
echo "Creating web app..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN_NAME \
  --name $APP_NAME \
  --runtime "NODE|18-lts"

# Configure app settings for environment variables
echo "Configuring app settings..."
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
  NODE_ENV=production \
  WEBSITE_NODE_DEFAULT_VERSION=18.x

# Deploy from local directory
echo "Deploying application..."
az webapp deployment source config-local-git \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME

# Get deployment URL
DEPLOYMENT_URL=$(az webapp deployment source config-local-git \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME --query url --output tsv)

echo "✅ Deployment URL: $DEPLOYMENT_URL"
echo "🌐 Your app will be available at: https://$APP_NAME.azurewebsites.net" 