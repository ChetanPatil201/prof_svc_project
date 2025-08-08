#!/bin/bash

# Update Container Environment Variables Script

RESOURCE_GROUP="prof-svc-rg"
CONTAINER_NAME="prof-svc-container"
ACR_NAME="profsvcregistry"

echo "🔄 Updating container with environment variables..."

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query "username" --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" --output tsv)

# Create container with all environment variables
az container create \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME \
  --image $ACR_NAME.azurecr.io/prof-svc-app:latest \
  --registry-login-server $ACR_NAME.azurecr.io \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --dns-name-label $CONTAINER_NAME \
  --ports 3000 \
  --environment-variables \
    NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    AZURE_OPENAI_ENDPOINT="https://cp-azureopenai.openai.azure.com/" \
    AZURE_OPENAI_KEY="5FN1UBKNRynW7U9NjBtpTPXvQUFxsT3iiMb6PaHYjGzyiN3jNz0zJQQJ99BGA4C4f1cMXJ3w3AAABAC0GpYQo" \
    AZURE_OPENAI_DEPLOYMENT="gpt-4o" \
  --cpu 1 \
  --memory 1.5

# Get the new public IP
echo "Getting container details..."
sleep 10
if az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --query "ipAddress.ip" --output tsv > /dev/null 2>&1; then
    PUBLIC_IP=$(az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --query "ipAddress.ip" --output tsv)
    
    echo "✅ Container updated successfully!"
    echo "🌐 Your app is available at: http://$PUBLIC_IP:3000"
    echo "📊 Container status:"
    az container show \
      --resource-group $RESOURCE_GROUP \
      --name $CONTAINER_NAME \
      --query "{State:provisioningState,IP:ipAddress.ip,Ports:ipAddress.ports[0].port}" \
      --output table
else
    echo "❌ Container update failed. Checking logs..."
    az container logs --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME || echo "No logs available"
fi 