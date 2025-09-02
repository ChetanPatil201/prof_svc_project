#!/bin/bash

echo "🚀 Quick Start - Docker Compose Deployment"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

# Set environment variables
export NODE_ENV=development
export AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"
export AZURE_OPENAI_KEY="your-azure-openai-key-here"
export AZURE_OPENAI_DEPLOYMENT="gpt-35-turbo"

echo "Environment variables:"
echo "NODE_ENV=$NODE_ENV"
echo "AZURE_OPENAI_ENDPOINT=$AZURE_OPENAI_ENDPOINT"
echo "AZURE_OPENAI_DEPLOYMENT=$AZURE_OPENAI_DEPLOYMENT"

# Stop any existing containers
echo "Stopping existing containers..."
docker compose down

# Build and start containers
echo "Building and starting containers..."
docker compose up --build -d

# Check if containers started successfully
if [ $? -eq 0 ]; then
    echo "✅ Application started successfully!"
    echo "🌐 Your app is available at: http://localhost:3000"
    echo ""
    echo "📊 Container status:"
    docker compose ps
    echo ""
    echo "📋 To view logs:"
    echo "docker compose logs -f"
    echo ""
    echo "🛑 To stop application:"
    echo "docker compose down"
    echo ""
    echo "🔄 To restart application:"
    echo "docker compose restart"
else
    echo "❌ Failed to start application!"
    echo "📋 Checking logs..."
    docker compose logs
    exit 1
fi
