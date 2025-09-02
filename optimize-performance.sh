#!/bin/bash

echo "⚡ Performance Optimization Script"

# Configuration
RESOURCE_GROUP="prof-svc-rg"
CONTAINER_NAME="prof-svc-container"
ACR_NAME="profsvcregistry"
IMAGE_NAME="prof-svc-app:latest"

echo "🔍 Analyzing current performance..."

# Get current container configuration
echo "📊 Current container configuration:"
az container show \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME \
  --query "{CPU:cpu,Memory:memory,State:provisioningState,IP:ipAddress.ip}" \
  --output table

# Get container metrics
echo ""
echo "📈 Container metrics (last 24 hours):"
az monitor metrics list \
  --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.ContainerInstance/containerGroups/$CONTAINER_NAME" \
  --metric "CpuUsage,MemoryUsage" \
  --interval PT1H \
  --query "value[0].timeseries[0].data[-1].average" \
  --output table

# Performance optimization recommendations
echo ""
echo "💡 Performance Optimization Recommendations:"

# Check CPU usage
CPU_USAGE=$(az monitor metrics list \
  --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.ContainerInstance/containerGroups/$CONTAINER_NAME" \
  --metric "CpuUsage" \
  --interval PT1H \
  --query "value[0].timeseries[0].data[-1].average" \
  --output tsv)

if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    echo "⚠️  High CPU usage detected: ${CPU_USAGE}%"
    echo "   Recommendation: Increase CPU allocation to 2 cores"
elif (( $(echo "$CPU_USAGE < 20" | bc -l) )); then
    echo "ℹ️  Low CPU usage detected: ${CPU_USAGE}%"
    echo "   Recommendation: Consider reducing CPU allocation to 0.5 cores to save costs"
else
    echo "✅ CPU usage is optimal: ${CPU_USAGE}%"
fi

# Check memory usage
MEMORY_USAGE=$(az monitor metrics list \
  --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.ContainerInstance/containerGroups/$CONTAINER_NAME" \
  --metric "MemoryUsage" \
  --interval PT1H \
  --query "value[0].timeseries[0].data[-1].average" \
  --output tsv)

if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "⚠️  High memory usage detected: ${MEMORY_USAGE}%"
    echo "   Recommendation: Increase memory allocation to 3GB"
elif (( $(echo "$MEMORY_USAGE < 30" | bc -l) )); then
    echo "ℹ️  Low memory usage detected: ${MEMORY_USAGE}%"
    echo "   Recommendation: Consider reducing memory allocation to 1GB to save costs"
else
    echo "✅ Memory usage is optimal: ${MEMORY_USAGE}%"
fi

# Cost optimization
echo ""
echo "💰 Cost Optimization:"
echo "   Current estimated cost: ~$15-35/month"
echo "   To reduce costs:"
echo "   - Stop container when not in use: ./aci-management.sh stop"
echo "   - Use smaller instances for development"
echo "   - Monitor usage with Azure Cost Management"

# Performance tuning options
echo ""
echo "🔧 Performance Tuning Options:"
echo "1. Scale up (more resources):"
echo "   --cpu 2 --memory 3.0Gi"
echo ""
echo "2. Scale down (cost savings):"
echo "   --cpu 0.5 --memory 1.0Gi"
echo ""
echo "3. Enable auto-scaling (Container Apps):"
echo "   Consider migrating to Azure Container Apps for auto-scaling"

echo ""
echo "✅ Performance analysis complete!"
