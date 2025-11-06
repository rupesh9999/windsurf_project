# E-Commerce Platform - AWS Deployment Guide

This guide explains how to deploy the e-commerce platform to AWS using Infrastructure as Code.

## Architecture Overview

The platform consists of:
- **Frontend**: React application served by Nginx
- **Microservices**: User, Product, Order, and Payment services (Node.js/TypeScript)
- **Database**: Amazon RDS MySQL
- **Storage**: Amazon S3 for product images
- **Container Registry**: Amazon ECR
- **Orchestration**: Amazon EKS with Kubernetes
- **Load Balancing**: AWS Load Balancer Controller + NGINX Ingress
- **Service Mesh**: Istio (optional)

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with your credentials
3. **Terraform** (>= 1.0)
4. **kubectl** for Kubernetes management
5. **Docker** for building images
6. **Git** for version control

## Deployment Steps

### 1. Clone and Setup

```bash
git clone <repository-url>
cd windsurf_project
```

### 2. Configure AWS Region (Optional)

Update the AWS region in `infrastructure/terraform/terraform.tfvars` if needed:
```hcl
aws_region = "us-east-2"  # or your preferred region
```

### 3. Deploy Infrastructure

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the infrastructure
terraform apply
```

This will create:
- VPC with public/private subnets
- EKS cluster with node group
- RDS MySQL database
- S3 bucket for images
- ECR repositories
- Required IAM roles

### 4. Configure kubectl

```bash
# Update kubeconfig for the new cluster
aws eks update-kubeconfig --region us-east-2 --name ecommerce-cluster
```

### 5. Deploy Application

From the project root:

```bash
# Deploy everything (infrastructure + application)
./scripts/deploy.sh all

# Or deploy in stages:
./scripts/deploy.sh infra    # Infrastructure only
./scripts/deploy.sh app      # Application only
```

The deployment script will:
1. Build Docker images
2. Push images to ECR
3. Deploy Kubernetes manifests
4. Configure ingress and load balancers

### 6. Access the Application

After deployment, the script will output the service URLs:

```
=========================================
Deployment Complete!
=========================================
Frontend URL: http://<load-balancer-hostname>
API Base URL: http://<load-balancer-hostname>/api

Service Health Checks:
Frontend: http://<load-balancer-hostname>/health.html
...
=========================================
```

## Configuration

### Environment Variables

The application uses ConfigMaps and Secrets for configuration:

- **Database**: RDS endpoint and credentials
- **S3**: Bucket name for product images
- **AWS Region**: us-east-2 (configurable)
- **JWT Secrets**: For authentication
- **Stripe Keys**: For payment processing (configure in secrets)

### Scaling

To scale services:

```bash
# Scale a deployment
kubectl scale deployment user-service --replicas=5 -n ecommerce

# Update node group size in Terraform
# Edit infrastructure/terraform/variables.tf
# Then: terraform apply
```

## Monitoring and Troubleshooting

### Check Pod Status
```bash
kubectl get pods -n ecommerce
kubectl describe pod <pod-name> -n ecommerce
kubectl logs <pod-name> -n ecommerce
```

### Check Services
```bash
kubectl get services -n ecommerce
kubectl get ingress -n ecommerce
```

### Database Connection
The services connect to RDS using the endpoint from Terraform outputs.

### Common Issues

1. **ECR Login Issues**: Ensure AWS credentials have ECR permissions
2. **Load Balancer Not Ready**: Wait a few minutes for AWS to provision the load balancer
3. **Database Connection**: Verify security groups allow traffic from EKS nodes to RDS
4. **Image Pull Errors**: Check ECR repository permissions

## Security Considerations

1. **Secrets Management**: Use AWS Secrets Manager or Kubernetes secrets properly
2. **Network Security**: RDS is in private subnets, accessible only from EKS
3. **IAM Roles**: Services use IAM roles for AWS service access
4. **SSL/TLS**: Configure SSL certificates for production

## Cost Optimization

1. **EKS Node Types**: Use appropriate instance types for your workload
2. **RDS Instance Class**: Start with smaller instances and scale up as needed
3. **Auto Scaling**: Configure HPA for services based on CPU/memory usage

## Cleanup

To destroy all resources:

```bash
cd infrastructure/terraform
terraform destroy
```

**Warning**: This will delete all data including the database!