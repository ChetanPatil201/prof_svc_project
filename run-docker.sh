#!/bin/bash

echo "🐳 Running Docker container locally..."

# Configuration
IMAGE_NAME="prof-svc-app"
CONTAINER_NAME="prof-svc-container"
PORT="3000"

# Set environment variables
export NODE_ENV=production
export AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"
export AZURE_OPENAI_KEY="your-azure-openai-key-here"
export AZURE_OPENAI_DEPLOYMENT="gpt-35-turbo"

echo "Environment variables:"
echo "NODE_ENV=$NODE_ENV"
echo "AZURE_OPENAI_ENDPOINT=$AZURE_OPENAI_ENDPOINT"
echo "AZURE_OPENAI_DEPLOYMENT=$AZURE_OPENAI_DEPLOYMENT"

# Stop and remove existing container if it exists
echo "Stopping existing container..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Run Docker container
echo "Starting container: $CONTAINER_NAME"
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:3000 \
  -e NODE_ENV="$NODE_ENV" \
  -e AZURE_OPENAI_ENDPOINT="$AZURE_OPENAI_ENDPOINT" \
  -e AZURE_OPENAI_KEY="$AZURE_OPENAI_KEY" \
  -e AZURE_OPENAI_DEPLOYMENT="$AZURE_OPENAI_DEPLOYMENT" \
  $IMAGE_NAME:latest

# Check if container started successfully
if [ $? -eq 0 ]; then
    echo "✅ Container started successfully!"
    echo "🌐 Your app is available at: http://localhost:$PORT"
    echo ""
    echo "📊 Container status:"
    docker ps --filter "name=$CONTAINER_NAME"
    echo ""
    echo "📋 To view logs:"
    echo "docker logs -f $CONTAINER_NAME"
    echo ""
    echo "🛑 To stop container:"
    echo "docker stop $CONTAINER_NAME"
else
    echo "❌ Failed to start container!"
    exit 1
fi
