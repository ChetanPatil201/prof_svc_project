#!/bin/bash

echo "🔄 Rebuilding and redeploying application..."

# Build the Docker image
echo "Building Docker image..."
docker build -t prof-svc-app:latest -f Dockerfile.simple .

# Tag the image
echo "Tagging image..."
docker tag prof-svc-app:latest profsvcregistry.azurecr.io/prof-svc-app:latest

# Login to ACR
echo "Logging into Azure Container Registry..."
az acr login --name profsvcregistry

# Push the image
echo "Pushing image to ACR..."
docker push profsvcregistry.azurecr.io/prof-svc-app:latest

# Delete existing container
echo "Deleting existing container..."
az container delete --resource-group prof-svc-rg --name prof-svc-container --yes

# Create new container
echo "Creating new container..."
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
    AZURE_OPENAI_DEPLOYMENT="gpt-4o" \
  --cpu 1 \
  --memory 1.5

# Wait for container to start
echo "Waiting for container to start..."
sleep 30

# Get the new IP
NEW_IP=$(az container show --resource-group prof-svc-rg --name prof-svc-container --query "ipAddress.ip" --output tsv)

echo "✅ Redeployment complete!"
echo "🌐 New application URL: http://$NEW_IP:3000"
echo "🧪 Test page URL: http://$NEW_IP:3000/test-openai.html" 