# E-Commerce Platform Deployment Guide

## 🚀 Quick Deployment Steps

### Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] Docker and Docker Compose installed
- [ ] AWS CLI configured with appropriate permissions
- [ ] kubectl installed for Kubernetes management
- [ ] Terraform 1.5+ installed
- [ ] Git repository access

### Local Development Deployment

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd windsurf_project
   chmod +x scripts/local-dev.sh scripts/deploy.sh
   ```

2. **Environment Configuration**
   ```bash
   # Setup local environment files
   ./scripts/local-dev.sh setup
   ```

3. **Start Services**
   ```bash
   # Start all services locally
   ./scripts/local-dev.sh start
   ```

4. **Verify Deployment**
   ```bash
   # Check service status
   ./scripts/local-dev.sh status
   ```

### Production Deployment

1. **AWS Infrastructure**
   ```bash
   # Configure AWS credentials
   aws configure
   
   # Deploy infrastructure
   ./scripts/deploy.sh infra
   ```

2. **Application Deployment**
   ```bash
   # Deploy application to Kubernetes
   ./scripts/deploy.sh app
   ```

3. **Monitoring Setup**
   ```bash
   # Deploy monitoring stack
   ./scripts/deploy.sh monitoring
   ```

4. **Service Mesh**
   ```bash
   # Install Istio service mesh
   ./scripts/deploy.sh istio
   ```

## 🔧 Configuration Requirements

### Environment Variables

Create the following `.env` files:

**Frontend (.env)**
```bash
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

**User Service (.env)**
```bash
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=user_service_dev
DB_USER=root
DB_PASSWORD=password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
```

**Product Service (.env)**
```bash
NODE_ENV=development
PORT=3002
DB_HOST=localhost
DB_PORT=3306
DB_NAME=product_service_dev
DB_USER=root
DB_PASSWORD=password
REDIS_HOST=localhost
REDIS_PORT=6379
AWS_REGION=us-west-2
AWS_S3_BUCKET=ecommerce-products-dev
```

**Order Service (.env)**
```bash
NODE_ENV=development
PORT=3003
DB_HOST=localhost
DB_PORT=3306
DB_NAME=order_service_dev
DB_USER=root
DB_PASSWORD=password
REDIS_HOST=localhost
REDIS_PORT=6379
USER_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
```

**Payment Service (.env)**
```bash
NODE_ENV=development
PORT=3004
DB_HOST=localhost
DB_PORT=3306
DB_NAME=payment_service_dev
DB_USER=root
DB_PASSWORD=password
REDIS_HOST=localhost
REDIS_PORT=6379
STRIPE_SECRET_KEY=sk_test_your_stripe_secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
USER_SERVICE_URL=http://localhost:3001
ORDER_SERVICE_URL=http://localhost:3003
```

### Kubernetes Secrets

For production deployment, create Kubernetes secrets:

```bash
# Database secrets
kubectl create secret generic db-secrets \
  --from-literal=password=your-production-db-password \
  --namespace=ecommerce

# JWT secrets
kubectl create secret generic jwt-secrets \
  --from-literal=secret=your-production-jwt-secret \
  --from-literal=refresh-secret=your-production-refresh-secret \
  --namespace=ecommerce

# Stripe secrets
kubectl create secret generic stripe-secrets \
  --from-literal=secret-key=sk_live_your_stripe_secret \
  --from-literal=webhook-secret=whsec_your_webhook_secret \
  --namespace=ecommerce

# AWS secrets
kubectl create secret generic aws-secrets \
  --from-literal=access-key-id=your-aws-access-key \
  --from-literal=secret-access-key=your-aws-secret-key \
  --namespace=ecommerce
```

## 🌐 Service Access URLs

### Local Development
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **User Service API**: http://localhost:3001/api-docs
- **Product Service API**: http://localhost:3002/api-docs
- **Order Service API**: http://localhost:3003/api-docs
- **Payment Service API**: http://localhost:3004/api-docs
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)

### Production
- **Frontend**: https://your-domain.com
- **API**: https://api.your-domain.com
- **Monitoring**: https://monitoring.your-domain.com

## 🔍 Health Checks

### Service Health Endpoints
```bash
# Check all services
curl http://localhost:3001/health  # User Service
curl http://localhost:3002/health  # Product Service
curl http://localhost:3003/health  # Order Service
curl http://localhost:3004/health  # Payment Service
```

### Database Connectivity
```bash
# Check database connections
docker-compose exec user-service npm run db:check
docker-compose exec product-service npm run db:check
docker-compose exec order-service npm run db:check
docker-compose exec payment-service npm run db:check
```

## 🐛 Troubleshooting

### Common Issues

**Services not starting:**
```bash
./scripts/local-dev.sh clean
./scripts/local-dev.sh setup
./scripts/local-dev.sh start
```

**Database connection errors:**
```bash
docker-compose down -v
docker-compose up -d mysql redis
# Wait 30 seconds for databases to initialize
./scripts/local-dev.sh start
```

**Port conflicts:**
```bash
./scripts/local-dev.sh stop
# Check for processes using ports 3000-3004, 8080, 9090
lsof -i :3000
# Kill conflicting processes if needed
```

**Kubernetes deployment issues:**
```bash
# Check pod status
kubectl get pods -n ecommerce

# Check pod logs
kubectl logs -f deployment/user-service -n ecommerce

# Describe problematic pods
kubectl describe pod <pod-name> -n ecommerce
```

### Log Locations

**Local Development:**
- Service logs: `docker-compose logs -f <service-name>`
- Application logs: `services/<service-name>/logs/`

**Production:**
- Kubernetes logs: `kubectl logs -f deployment/<service> -n ecommerce`
- Grafana dashboards: Monitor application metrics
- Prometheus alerts: Check alert manager

## 📊 Monitoring Setup

### Grafana Dashboards
1. Access Grafana at http://localhost:3001
2. Login with admin/admin
3. Import dashboard from `devops/grafana/dashboards/ecommerce-overview.json`
4. Configure data sources (Prometheus: http://prometheus:9090)

### Prometheus Metrics
- Service health and uptime
- Request rates and response times
- Error rates and success rates
- Database connection pools
- Cache hit rates

### Alerting Rules
- High error rates (>5%)
- Slow response times (>2s p95)
- High resource utilization (>80%)
- Database connection issues
- Payment processing failures

## 🔐 Security Configuration

### SSL/TLS Setup
```bash
# Generate self-signed certificates for local development
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### Production Security
- Use Let's Encrypt for SSL certificates
- Configure WAF rules
- Enable VPC security groups
- Set up IAM roles with least privilege
- Enable CloudTrail logging
- Configure backup and disaster recovery

## 📈 Performance Optimization

### Database Optimization
- Configure connection pooling
- Set up read replicas for scaling
- Implement database indexing
- Monitor slow queries

### Caching Strategy
- Redis for session management
- Application-level caching
- CDN for static assets
- Database query result caching

### Scaling Configuration
- Horizontal Pod Autoscaler (HPA)
- Vertical Pod Autoscaler (VPA)
- Cluster autoscaling
- Load balancer configuration

## 🚀 CI/CD Pipeline

### Jenkins Setup
1. Install Jenkins with required plugins
2. Configure pipeline from Jenkinsfile
3. Set up credentials for Docker registry, AWS, SonarQube
4. Configure webhooks for automated builds

### ArgoCD Setup
1. Install ArgoCD in Kubernetes cluster
2. Apply ArgoCD application from `devops/argocd/application.yaml`
3. Configure Git repository access
4. Set up automated sync policies

## 📋 Maintenance Tasks

### Regular Maintenance
- Update dependencies monthly
- Review security vulnerabilities
- Monitor resource usage
- Backup databases
- Update SSL certificates
- Review and rotate secrets

### Performance Monitoring
- Monitor application metrics
- Review error logs
- Check database performance
- Analyze user behavior
- Optimize slow endpoints

---

## 🆘 Support

For issues and support:
1. Check the troubleshooting section above
2. Review application logs
3. Check monitoring dashboards
4. Create GitHub issues for bugs
5. Review documentation in `/docs` folder

**Platform Status: Production Ready ✅**
