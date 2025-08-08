#!/bin/bash

# Azure Container Instances Management Script

RESOURCE_GROUP="prof-svc-rg"
CONTAINER_NAME="prof-svc-container"
ACR_NAME="profsvcregistry"

case "$1" in
  "start")
    echo "Starting container instance..."
    az container start \
      --resource-group $RESOURCE_GROUP \
      --name $CONTAINER_NAME
    ;;
  
  "stop")
    echo "Stopping container instance..."
    az container stop \
      --resource-group $RESOURCE_GROUP \
      --name $CONTAINER_NAME
    ;;
  
  "restart")
    echo "Restarting container instance..."
    az container restart \
      --resource-group $RESOURCE_GROUP \
      --name $CONTAINER_NAME
    ;;
  
  "logs")
    echo "Fetching container logs..."
    az container logs \
      --resource-group $RESOURCE_GROUP \
      --name $CONTAINER_NAME
    ;;
  
  "status")
    echo "Container status:"
    az container show \
      --resource-group $RESOURCE_GROUP \
      --name $CONTAINER_NAME \
      --query "{State:provisioningState,IP:ipAddress.ip,Ports:ipAddress.ports[0].port,RestartCount:containers[0].instanceView.restartCount}" \
      --output table
    ;;
  
  "delete")
    echo "Deleting container instance..."
    az container delete \
      --resource-group $RESOURCE_GROUP \
      --name $CONTAINER_NAME \
      --yes
    ;;
  
  "update")
    echo "Updating container with latest image..."
    ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query "loginServer" --output tsv)
    ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query "username" --output tsv)
    ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" --output tsv)
    
    # Build and push new image
    az acr build \
      --registry $ACR_NAME \
      --image prof-svc-app:latest \
      --file Dockerfile \
      .
    
    # Delete and recreate container
    az container delete \
      --resource-group $RESOURCE_GROUP \
      --name $CONTAINER_NAME \
      --yes
    
    az container create \
      --resource-group $RESOURCE_GROUP \
      --name $CONTAINER_NAME \
      --image $ACR_LOGIN_SERVER/prof-svc-app:latest \
      --registry-login-server $ACR_LOGIN_SERVER \
      --registry-username $ACR_USERNAME \
      --registry-password $ACR_PASSWORD \
      --dns-name-label $CONTAINER_NAME \
      --ports 3000 \
      --environment-variables \
        NODE_ENV=production \
        PORT=3000 \
        HOSTNAME=0.0.0.0 \
      --cpu 1 \
      --memory 1.5
    ;;
  
  *)
    echo "Usage: $0 {start|stop|restart|logs|status|delete|update}"
    echo ""
    echo "Commands:"
    echo "  start   - Start the container instance"
    echo "  stop    - Stop the container instance"
    echo "  restart - Restart the container instance"
    echo "  logs    - Show container logs"
    echo "  status  - Show container status"
    echo "  delete  - Delete the container instance"
    echo "  update  - Update with latest image"
    exit 1
    ;;
esac 