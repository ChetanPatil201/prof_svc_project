#!/bin/bash

echo "🚀 Quick Start - Docker Compose Deployment"
echo "=========================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "Please create a .env.local file with your Azure OpenAI credentials:"
    echo "AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/"
    echo "AZURE_OPENAI_KEY=your-azure-openai-key-here"
    echo "AZURE_OPENAI_DEPLOYMENT=gpt-35-turbo"
    exit 1
fi

echo "✅ Environment file found"
echo ""

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
/Applications/Docker.app/Contents/Resources/bin/docker compose -f docker-compose.prod.yml down 2>/dev/null

# Start the application
echo "🐳 Starting application with Docker Compose..."
/Applications/Docker.app/Contents/Resources/bin/docker compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Waiting for application to start..."
sleep 10

# Test the application
echo "🧪 Testing application..."
MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/test-endpoint)

echo "📱 Main page: HTTP $MAIN_STATUS"
echo "🔌 API endpoint: HTTP $API_STATUS"

if [ "$MAIN_STATUS" = "200" ] && [ "$API_STATUS" = "200" ]; then
    echo ""
    echo "🎉 SUCCESS! Application is running correctly!"
    echo "📱 Access your application at: http://localhost:3000"
    echo ""
    echo "📋 Management Commands:"
    echo "  View logs:   docker compose -f docker-compose.prod.yml logs -f"
    echo "  Stop app:    docker compose -f docker-compose.prod.yml down"
    echo "  Restart:     docker compose -f docker-compose.prod.yml restart"
    echo "  Status:      docker compose -f docker-compose.prod.yml ps"
    echo "  Rebuild:     docker compose -f docker-compose.prod.yml up --build -d"
else
    echo ""
    echo "⚠️  Application started but some endpoints may have issues."
    echo "Check logs: docker compose -f docker-compose.prod.yml logs"
fi 