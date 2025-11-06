#!/bin/bash
set -e

# Get terraform outputs
cd infrastructure/terraform
ECR_FRONTEND_URL=$(terraform output -raw ecr_frontend_repository_url)
ECR_USER_SERVICE_URL=$(terraform output -raw ecr_user_service_repository_url)
ECR_PRODUCT_SERVICE_URL=$(terraform output -raw ecr_product_service_repository_url)
ECR_ORDER_SERVICE_URL=$(terraform output -raw ecr_order_service_repository_url)
ECR_PAYMENT_SERVICE_URL=$(terraform output -raw ecr_payment_service_repository_url)
RDS_ENDPOINT=$(terraform output -raw rds_endpoint)
S3_BUCKET_NAME=$(terraform output -raw s3_bucket_name)
ALB_CONTROLLER_ROLE_ARN=$(terraform output -raw aws_load_balancer_controller_role_arn)
cd ../..

echo "Starting Kubernetes deployment..."

# Create namespace
echo "Creating namespace..."
kubectl apply -f infrastructure/k8s/namespace.yaml

# Deploy AWS Load Balancer Controller (if not already deployed)
echo "Deploying AWS Load Balancer Controller..."
if [ -f "infrastructure/k8s/aws-load-balancer-controller.yaml" ]; then
    sed -i "s|AWS_LOAD_BALANCER_CONTROLLER_ROLE_ARN|$ALB_CONTROLLER_ROLE_ARN|g" infrastructure/k8s/aws-load-balancer-controller.yaml
    kubectl apply -f infrastructure/k8s/aws-load-balancer-controller.yaml
fi

# Replace placeholders in configmaps
echo "Updating configmaps..."
cp infrastructure/k8s/configmaps.yaml infrastructure/k8s/configmaps-deploy.yaml
sed -i "s|ecommerce-database.cluster-xxxxx.us-east-2.rds.amazonaws.com|$RDS_ENDPOINT|g" infrastructure/k8s/configmaps-deploy.yaml
sed -i "s|ecommerce-product-images-xxxxx|$S3_BUCKET_NAME|g" infrastructure/k8s/configmaps-deploy.yaml

# Replace placeholders in deployments
echo "Updating deployments..."
cp infrastructure/k8s/deployments.yaml infrastructure/k8s/deployments-deploy.yaml
sed -i "s|ECR_FRONTEND_REPOSITORY_URL|$ECR_FRONTEND_URL|g" infrastructure/k8s/deployments-deploy.yaml
sed -i "s|ECR_USER_SERVICE_REPOSITORY_URL|$ECR_USER_SERVICE_URL|g" infrastructure/k8s/deployments-deploy.yaml
sed -i "s|ECR_PRODUCT_SERVICE_REPOSITORY_URL|$ECR_PRODUCT_SERVICE_URL|g" infrastructure/k8s/deployments-deploy.yaml
sed -i "s|ECR_ORDER_SERVICE_REPOSITORY_URL|$ECR_ORDER_SERVICE_URL|g" infrastructure/k8s/deployments-deploy.yaml
sed -i "s|ECR_PAYMENT_SERVICE_REPOSITORY_URL|$ECR_PAYMENT_SERVICE_URL|g" infrastructure/k8s/deployments-deploy.yaml

# Apply configurations
echo "Applying configurations..."
kubectl apply -f infrastructure/k8s/configmaps-deploy.yaml
kubectl apply -f infrastructure/k8s/secrets.yaml

# Deploy services
echo "Deploying services..."
kubectl apply -f infrastructure/k8s/deployments-deploy.yaml
kubectl apply -f infrastructure/k8s/services.yaml

# Deploy ingress
echo "Deploying ingress..."
kubectl apply -f infrastructure/k8s/ingress.yaml

# Apply Istio configurations
echo "Applying Istio configurations..."
if [ -d "devops/istio" ]; then
    kubectl apply -f devops/istio/
fi

echo "Deployment completed!"
