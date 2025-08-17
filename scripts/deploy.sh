#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-us-west-2}
CLUSTER_NAME=${CLUSTER_NAME:-ecommerce-cluster}
NAMESPACE=${NAMESPACE:-ecommerce}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-051826731262.dkr.ecr.us-east-2.amazonaws.com/ecommerce-app}

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if required tools are installed
    command -v aws >/dev/null 2>&1 || { log_error "AWS CLI is required but not installed. Aborting."; exit 1; }
    command -v kubectl >/dev/null 2>&1 || { log_error "kubectl is required but not installed. Aborting."; exit 1; }
    command -v terraform >/dev/null 2>&1 || { log_error "Terraform is required but not installed. Aborting."; exit 1; }
    command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed. Aborting."; exit 1; }
    
    # Check AWS credentials
    aws sts get-caller-identity >/dev/null 2>&1 || { log_error "AWS credentials not configured. Run 'aws configure' first."; exit 1; }
    
    log_info "Prerequisites check passed!"
}

deploy_infrastructure() {
    log_info "Deploying AWS infrastructure with Terraform..."
    
    cd infrastructure/terraform
    
    # Initialize Terraform
    terraform init
    
    # Plan deployment
    terraform plan -out=tfplan
    
    # Apply infrastructure
    terraform apply tfplan
    
    # Get outputs
    CLUSTER_ENDPOINT=$(terraform output -raw eks_cluster_endpoint)
    
    cd ../..
    
    log_info "Infrastructure deployed successfully!"
}

configure_kubectl() {
    log_info "Configuring kubectl for EKS cluster..."
    
    aws eks update-kubeconfig --region $AWS_REGION --name $CLUSTER_NAME
    
    # Verify connection
    kubectl cluster-info
    
    log_info "kubectl configured successfully!"
}

install_istio() {
    log_info "Installing Istio service mesh..."
    
    # Download and install Istio
    curl -L https://istio.io/downloadIstio | sh -
    export PATH=$PWD/istio-*/bin:$PATH
    
    # Install Istio
    istioctl install --set values.defaultRevision=default -y
    
    # Enable sidecar injection
    kubectl label namespace default istio-injection=enabled
    
    log_info "Istio installed successfully!"
}

deploy_monitoring() {
    log_info "Deploying monitoring stack..."
    
    # Create monitoring namespace
    kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy Prometheus
    kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/bundle.yaml
    
    # Deploy Grafana
    kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:latest
        ports:
        - containerPort: 3000
        env:
        - name: GF_SECURITY_ADMIN_PASSWORD
          value: "admin123"
---
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: monitoring
spec:
  selector:
    app: grafana
  ports:
  - port: 3000
    targetPort: 3000
  type: LoadBalancer
EOF
    
    log_info "Monitoring stack deployed successfully!"
}

build_and_push_images() {
    log_info "Building and pushing Docker images..."
    
    # Get build tag
    BUILD_TAG=$(git rev-parse --short HEAD)
    
    # Build frontend
    log_info "Building frontend image..."
    docker build -t $DOCKER_REGISTRY/ecommerce-app/frontend:$BUILD_TAG frontend/
    docker push $DOCKER_REGISTRY/ecommerce-app/frontend:$BUILD_TAG
    
    # Build services
    for service in user-service product-service order-service payment-service; do
        log_info "Building $service image..."
        docker build -t $DOCKER_REGISTRY/ecommerce-app/$service:$BUILD_TAG services/$service/
        docker push $DOCKER_REGISTRY/ecommerce-app/$service:$BUILD_TAG
    done
    
    log_info "All images built and pushed successfully!"
}

deploy_application() {
    log_info "Deploying application to Kubernetes..."
    
    # Create namespace
    kubectl apply -f infrastructure/k8s/namespace.yaml
    
    # Apply configurations
    kubectl apply -f infrastructure/k8s/configmaps.yaml
    kubectl apply -f infrastructure/k8s/secrets.yaml
    
    # Deploy services
    kubectl apply -f infrastructure/k8s/deployments.yaml
    kubectl apply -f infrastructure/k8s/services.yaml
    
    # Deploy ingress
    kubectl apply -f infrastructure/k8s/ingress.yaml
    
    # Apply Istio configurations
    kubectl apply -f devops/istio/
    
    log_info "Application deployed successfully!"
}

wait_for_deployment() {
    log_info "Waiting for deployments to be ready..."
    
    kubectl wait --for=condition=available --timeout=300s deployment/frontend -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/user-service -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/product-service -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/order-service -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/payment-service -n $NAMESPACE
    
    log_info "All deployments are ready!"
}

get_service_urls() {
    log_info "Getting service URLs..."
    
    # Get ingress IP
    INGRESS_IP=$(kubectl get ingress ecommerce-ingress -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [ -z "$INGRESS_IP" ]; then
        INGRESS_IP=$(kubectl get ingress ecommerce-ingress -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    fi
    
    echo ""
    echo "========================================="
    echo "Deployment Complete!"
    echo "========================================="
    echo "Frontend URL: https://$INGRESS_IP"
    echo "API URL: https://$INGRESS_IP/api"
    echo ""
    echo "Grafana URL: http://$(kubectl get svc grafana -n monitoring -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):3000"
    echo "Grafana Login: admin/admin123"
    echo ""
    echo "To access services:"
    echo "kubectl get pods -n $NAMESPACE"
    echo "kubectl logs -f deployment/frontend -n $NAMESPACE"
    echo "========================================="
}

# Main deployment flow
main() {
    log_info "Starting E-Commerce Platform deployment..."
    
    case "${1:-all}" in
        "infra")
            check_prerequisites
            deploy_infrastructure
            configure_kubectl
            ;;
        "app")
            build_and_push_images
            deploy_application
            wait_for_deployment
            get_service_urls
            ;;
        "monitoring")
            deploy_monitoring
            ;;
        "istio")
            install_istio
            ;;
        "all")
            check_prerequisites
            deploy_infrastructure
            configure_kubectl
            install_istio
            deploy_monitoring
            build_and_push_images
            deploy_application
            wait_for_deployment
            get_service_urls
            ;;
        *)
            echo "Usage: $0 {all|infra|app|monitoring|istio}"
            echo "  all        - Deploy everything"
            echo "  infra      - Deploy infrastructure only"
            echo "  app        - Deploy application only"
            echo "  monitoring - Deploy monitoring stack only"
            echo "  istio      - Install Istio only"
            exit 1
            ;;
    esac
    
    log_info "Deployment completed successfully!"
}

# Run main function
main "$@"
