#!/bin/bash

# Docker build and run script for Next.js application

# Set Docker path for macOS
DOCKER_PATH="/Applications/Docker.app/Contents/Resources/bin/docker"

echo "🐳 Building Docker image..."
$DOCKER_PATH build -t prof-svc-project .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo ""
    echo "🚀 Starting container..."
    echo "📱 Application will be available at: http://localhost:3000"
    echo "⏹️  Press Ctrl+C to stop the container"
    echo ""
    
    # Run the container with environment variables
    $DOCKER_PATH run -p 3000:3000 \
      -e AZURE_OPENAI_ENDPOINT="$AZURE_OPENAI_ENDPOINT" \
      -e AZURE_OPENAI_KEY="$AZURE_OPENAI_KEY" \
      -e AZURE_OPENAI_DEPLOYMENT="$AZURE_OPENAI_DEPLOYMENT" \
      --env-file .env.local \
      prof-svc-project
else
    echo "❌ Docker build failed!"
    exit 1
fi 