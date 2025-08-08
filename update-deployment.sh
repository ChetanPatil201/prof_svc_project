#!/bin/bash

echo "🔄 Updating Azure OpenAI deployment name..."

# Delete existing container
echo "Deleting existing container..."
az container delete --resource-group prof-svc-rg --name prof-svc-container --yes

# Create new container with gpt-35-turbo deployment
echo "Creating new container with gpt-35-turbo deployment..."
az container create \
  --resource-group prof-svc-rg \
  --name prof-svc-container \
  --image profsvcregistry.azurecr.io/prof-svc-app:latest \
  --registry-login-server profsvcregistry.azurecr.io \
  --registry-username profsvcregistry \
  --registry-password $(az acr credential show --name profsvcregistry --query "passwords[0].value" --output tsv) \
  --dns-name-label prof-svc-container \
  --ports 3000 \
  --environment-variables \
    NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    AZURE_OPENAI_ENDPOINT="https://cp-azureopenai.openai.azure.com/" \
    AZURE_OPENAI_KEY="5FN1UBKNRynW7U9NjBtpTPXvQUFxsT3iiMb6PaHYjGzyiN3jNz0zJQQJ99BGA4C4f1cMXJ3w3AAABAC0GpYQo" \
    AZURE_OPENAI_DEPLOYMENT="gpt-35-turbo" \
  --cpu 1 \
  --memory 1.5

# Wait for container to start
echo "Waiting for container to start..."
sleep 30

# Get the new IP
NEW_IP=$(az container show --resource-group prof-svc-rg --name prof-svc-container --query "ipAddress.ip" --output tsv)

echo "✅ Container updated with gpt-35-turbo deployment!"
echo "🌐 New application URL: http://$NEW_IP:3000"
echo "🧪 Test the application now" 