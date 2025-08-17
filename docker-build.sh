#!/bin/bash

echo "🐳 Building Docker image locally..."

# Configuration
IMAGE_NAME="prof-svc-app"
TAG="latest"

# Set environment variables for build
export NODE_ENV=production
export AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"
export AZURE_OPENAI_KEY="your-azure-openai-key-here"
export AZURE_OPENAI_DEPLOYMENT="gpt-35-turbo"

# Build Docker image
echo "Building image: $IMAGE_NAME:$TAG"
if docker build -t $IMAGE_NAME:$TAG .; then
    echo "✅ Docker image built successfully!"
    echo "Image: $IMAGE_NAME:$TAG"
    
    # Show image details
    echo ""
    echo "📊 Image details:"
    docker images $IMAGE_NAME:$TAG
    
    # Show image size
    echo ""
    echo "💾 Image size:"
    docker images $IMAGE_NAME:$TAG --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    
    echo ""
    echo "🚀 To run the container:"
    echo "docker run -p 3000:3000 $IMAGE_NAME:$TAG"
    
else
    echo "❌ Docker build failed!"
    exit 1
fi
