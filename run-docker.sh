#!/bin/bash

# Set Docker path for macOS
DOCKER_PATH="/Applications/Docker.app/Contents/Resources/bin/docker"

echo "🐳 Running Docker container with environment variables..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "Please create a .env.local file with your Azure OpenAI credentials:"
    echo "AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/"
    echo "AZURE_OPENAI_KEY=your-azure-openai-key-here"
    echo "AZURE_OPENAI_DEPLOYMENT=gpt-35-turbo"
    exit 1
fi

# Load environment variables from .env.local
export $(cat .env.local | xargs)

# Run the container
$DOCKER_PATH run -p 3000:3000 \
  -e AZURE_OPENAI_ENDPOINT="$AZURE_OPENAI_ENDPOINT" \
  -e AZURE_OPENAI_KEY="$AZURE_OPENAI_KEY" \
  -e AZURE_OPENAI_DEPLOYMENT="$AZURE_OPENAI_DEPLOYMENT" \
  --env-file .env.local \
  prof-svc-project 