# E-Commerce Microservices Platform

A comprehensive three-tier e-commerce web application built with microservices architecture, featuring React frontend, Node.js backend services, and full DevOps automation with cloud-native technologies.

## 🏗️ Architecture Overview

### Frontend
- **React.js** with TypeScript for type safety
- **Material-UI** for modern, responsive design
- **Redux Toolkit** for state management
- **Axios** for API communication with interceptors
- **React Router** for client-side routing

### Backend Microservices
- **User Service** (Port 3001): Authentication, user management, JWT tokens
- **Product Service** (Port 3002): Product catalog, categories, inventory management
- **Order Service** (Port 3003): Order processing, order lifecycle management
- **Payment Service** (Port 3004): Payment processing with Stripe integration

### Infrastructure & DevOps
- **Docker** containerization with multi-stage builds
- **Kubernetes** orchestration with AWS EKS
- **Terraform** for infrastructure as code
- **Jenkins** CI/CD pipelines with quality gates
- **ArgoCD** GitOps deployment and configuration management
- **Istio** service mesh for traffic management and security
- **Nginx** reverse proxy and API gateway
- **Prometheus & Grafana** monitoring and observability
- **SonarQube** code quality analysis and security scanning
- **JFrog Artifactory** artifact management and container registry

### Databases & Caching
- **MySQL/MariaDB** for transactional data with connection pooling
- **Redis** for caching, session management, and rate limiting

### Cloud Services (AWS)
- **EKS** (Elastic Kubernetes Service) for container orchestration
- **RDS** (Relational Database Service) for managed databases
- **S3** for static assets and product images
- **VPC** for network isolation and security
- **IAM** for fine-grained access management
- **Load Balancer Controller** for traffic distribution

## 🚀 Technology Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TypeScript, Material-UI v5, Redux Toolkit, Axios |
| **Backend** | Node.js 18+, Express.js, TypeScript, Sequelize ORM |
| **Databases** | MySQL 8.0, Redis 7.0 |
| **Authentication** | JWT, bcrypt, refresh tokens |
| **Payment** | Stripe API v2023-10-16 |
| **Containerization** | Docker, Docker Compose |
| **Orchestration** | Kubernetes 1.28+, Helm charts |
| **Cloud** | AWS (EKS, RDS, S3, VPC, IAM, ALB) |
| **Infrastructure** | Terraform 1.5+ |
| **CI/CD** | Jenkins, ArgoCD, GitOps |
| **Service Mesh** | Istio 1.19+ |
| **Monitoring** | Prometheus, Grafana, Jaeger |
| **Code Quality** | SonarQube, ESLint, Prettier |
| **Security** | Trivy, OWASP ZAP, Snyk |
| **Artifact Management** | JFrog Artifactory |

## 📋 Prerequisites

### Required Software
- **Node.js** 18+ and npm 9+
- **Docker** 24+ and Docker Compose v2
- **kubectl** 1.28+ for Kubernetes management
- **Terraform** 1.5+ for infrastructure provisioning
- **AWS CLI** v2 configured with appropriate permissions
- **Git** for version control
- **Helm** 3.12+ for Kubernetes package management

### Required Accounts & Keys
- AWS account with EKS permissions
- Stripe account for payment processing
- Docker registry access (Docker Hub or private registry)
- Domain name for production deployment (optional)

## 🏃‍♂️ Quick Start

### Local Development Environment

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd windsurf_project
   ```

2. **Setup local environment**
   ```bash
   chmod +x scripts/local-dev.sh
   ./scripts/local-dev.sh setup
   ```

3. **Start all services**
   ```bash
   ./scripts/local-dev.sh start
   ```

4. **Access the application**
   - **Frontend**: http://localhost:3000
   - **API Gateway**: http://localhost:8080
   - **User Service**: http://localhost:3001/api-docs
   - **Product Service**: http://localhost:3002/api-docs
   - **Order Service**: http://localhost:3003/api-docs
   - **Payment Service**: http://localhost:3004/api-docs
   - **Prometheus**: http://localhost:9090
   - **Grafana**: http://localhost:3001 (admin/admin)

### Production Deployment

1. **Configure AWS credentials**
   ```bash
   aws configure
   # Set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
   ```

2. **Deploy infrastructure**
   ```bash
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh infra
   ```

3. **Deploy application**
   ```bash
   ./scripts/deploy.sh app
   ```

4. **Deploy monitoring stack**
   ```bash
   ./scripts/deploy.sh monitoring
   ```

5. **Install Istio service mesh**
   ```bash
   ./scripts/deploy.sh istio
   ```

## 🛠️ Development

### Project Structure
```
windsurf_project/
├── frontend/                    # React frontend application
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service layer
│   │   └── store/             # Redux store and slices
│   ├── Dockerfile             # Multi-stage Docker build
│   └── nginx.conf             # Production Nginx config
├── services/                   # Backend microservices
│   ├── user-service/          # Authentication & user management
│   ├── product-service/       # Product catalog & inventory
│   ├── order-service/         # Order processing & management
│   └── payment-service/       # Payment processing with Stripe
├── infrastructure/            # Infrastructure as code
│   ├── terraform/             # AWS infrastructure definitions
│   └── k8s/                  # Kubernetes manifests
├── devops/                   # DevOps configurations
│   ├── argocd/               # GitOps deployment configs
│   ├── istio/                # Service mesh configurations
│   ├── monitoring/           # Prometheus configurations
│   ├── grafana/              # Monitoring dashboards
│   ├── nginx/                # API gateway configuration
│   └── sonarqube/            # Code quality profiles
└── scripts/                  # Deployment and utility scripts
    ├── deploy.sh             # Production deployment script
    └── local-dev.sh          # Local development script
```

### Development Workflow

1. **Start local environment**
   ```bash
   ./scripts/local-dev.sh start
   ```

2. **Make changes to code**

3. **Run tests**
   ```bash
   ./scripts/local-dev.sh test
   ```

4. **Check logs**
   ```bash
   ./scripts/local-dev.sh logs [service-name]
   ```

5. **Stop services**
   ```bash
   ./scripts/local-dev.sh stop
   ```

### Running Tests
```bash
# Run all tests
./scripts/local-dev.sh test

# Frontend tests with coverage
cd frontend && npm test -- --coverage

# Backend service tests
cd services/user-service && npm test
cd services/product-service && npm test
cd services/order-service && npm test
cd services/payment-service && npm test
```

### Code Quality & Linting
```bash
# Lint all services
npm run lint:all

# Format code
npm run format:all

# Run SonarQube analysis
sonar-scanner -Dproject.settings=devops/sonarqube/sonar-project.properties
```

## 📊 Monitoring & Observability

### Metrics & Monitoring
- **Prometheus**: Metrics collection, alerting rules
- **Grafana**: Custom dashboards for business and technical metrics
- **Istio**: Service mesh observability and distributed tracing
- **Application logs**: Structured logging with Winston

### Key Metrics Monitored
- **Business Metrics**: Orders, revenue, conversion rates
- **Technical Metrics**: Request rate, response times, error rates
- **Infrastructure Metrics**: CPU, memory, disk, network usage
- **Database Metrics**: Connection pools, query performance
- **Cache Metrics**: Hit rates, memory usage

### Alerting
- High error rates (>5%)
- Slow response times (>2s p95)
- High resource utilization (>80%)
- Database connection issues
- Payment processing failures

## 🔒 Security

### Authentication & Authorization
- **JWT-based authentication** with access and refresh tokens
- **Role-based access control** (RBAC) for admin functions
- **Token blacklisting** for secure logout
- **Password hashing** with bcrypt and salt rounds
- **Rate limiting** to prevent abuse

### Infrastructure Security
- **TLS/SSL encryption** for all communications
- **Network policies** with Istio for micro-segmentation
- **Secrets management** with Kubernetes Secrets
- **Container security scanning** with Trivy
- **Image vulnerability assessment** in CI/CD pipeline

### API Security
- **Input validation** and sanitization
- **SQL injection prevention** with parameterized queries
- **CORS configuration** for cross-origin requests
- **Security headers** (HSTS, CSP, X-Frame-Options)
- **API rate limiting** per user and endpoint

### DevSecOps Practices
- **Static code analysis** with SonarQube
- **Dependency vulnerability scanning** with Snyk
- **Container image scanning** in CI/CD
- **Security testing** in deployment pipeline
- **Compliance monitoring** and reporting

## 🚀 CI/CD Pipeline

### Jenkins Pipeline Stages
1. **Code Checkout**: Pull latest code from Git repository
2. **Dependency Installation**: Install npm dependencies for all services
3. **Linting & Testing**: Run ESLint, Prettier, and unit tests
4. **Security Scanning**: SAST with SonarQube, dependency check
5. **Docker Build**: Build multi-stage container images
6. **Image Scanning**: Container vulnerability scan with Trivy
7. **Artifact Storage**: Push images to JFrog Artifactory
8. **Staging Deployment**: Deploy to staging environment
9. **Integration Testing**: Run end-to-end test suite
10. **Production Deployment**: Deploy to production (manual approval)
11. **Smoke Testing**: Verify deployment health
12. **Monitoring Setup**: Configure alerts and dashboards

### GitOps with ArgoCD
- **Automated deployment** from Git repository changes
- **Configuration drift detection** and remediation
- **Rollback capabilities** for failed deployments
- **Multi-environment management** (dev, staging, prod)
- **Application health monitoring** and sync status

### Quality Gates
- **Code coverage** minimum 80%
- **Security vulnerabilities** zero high/critical
- **Performance tests** pass acceptance criteria
- **Integration tests** 100% pass rate

## 🌐 API Documentation

### Service Endpoints

#### User Service (Port 3001)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

#### Product Service (Port 3002)
- `GET /api/products` - List products with filters
- `GET /api/products/:id` - Get product details
- `GET /api/categories` - List product categories
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)

#### Order Service (Port 3003)
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/:id/cancel` - Cancel order
- `PUT /api/orders/:id` - Update order status (admin)

#### Payment Service (Port 3004)
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments` - Get user payments
- `POST /api/payments/:id/refund` - Process refund

### API Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt-token>
```

## 📁 Directory Structure Details

```
windsurf_project/
├── .gitignore                  # Git ignore patterns
├── README.md                   # Project documentation
├── docker-compose.yml          # Local development orchestration
├── Jenkinsfile                 # CI/CD pipeline definition
├── frontend/                   # React frontend
│   ├── public/
│   │   ├── index.html         # HTML template
│   │   └── manifest.json      # PWA manifest
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   ├── Layout/        # Header, Footer components
│   │   │   └── Auth/          # Authentication components
│   │   ├── pages/             # Page components
│   │   │   ├── Home.tsx       # Landing page
│   │   │   ├── Products.tsx   # Product listing
│   │   │   ├── Cart.tsx       # Shopping cart
│   │   │   └── Checkout.tsx   # Checkout process
│   │   ├── services/          # API service layer
│   │   │   └── api.ts         # Axios configuration
│   │   ├── store/             # Redux store
│   │   │   ├── store.ts       # Store configuration
│   │   │   └── slices/        # Redux slices
│   │   ├── App.tsx            # Main app component
│   │   └── index.tsx          # App entry point
│   ├── Dockerfile             # Production Docker image
│   ├── nginx.conf             # Nginx configuration
│   └── package.json           # Dependencies and scripts
├── services/                   # Backend microservices
│   ├── user-service/          # User management service
│   │   ├── src/
│   │   │   ├── config/        # Configuration files
│   │   │   ├── models/        # Sequelize models
│   │   │   ├── routes/        # Express routes
│   │   │   ├── middleware/    # Custom middleware
│   │   │   ├── utils/         # Utility functions
│   │   │   └── index.ts       # Service entry point
│   │   ├── Dockerfile         # Service Docker image
│   │   ├── package.json       # Service dependencies
│   │   └── tsconfig.json      # TypeScript configuration
│   ├── product-service/       # Product catalog service
│   ├── order-service/         # Order management service
│   └── payment-service/       # Payment processing service
├── infrastructure/            # Infrastructure as code
│   ├── terraform/             # AWS infrastructure
│   │   ├── main.tf           # Main infrastructure
│   │   ├── variables.tf      # Input variables
│   │   ├── outputs.tf        # Output values
│   │   └── iam.tf            # IAM roles and policies
│   └── k8s/                  # Kubernetes manifests
│       ├── namespace.yaml    # Namespace definition
│       ├── configmaps.yaml   # Configuration maps
│       ├── secrets.yaml      # Secret definitions
│       ├── deployments.yaml  # Application deployments
│       ├── services.yaml     # Service definitions
│       └── ingress.yaml      # Ingress configuration
├── devops/                   # DevOps configurations
│   ├── argocd/               # GitOps deployment
│   │   └── application.yaml  # ArgoCD application
│   ├── istio/                # Service mesh
│   │   ├── gateway.yaml      # Istio gateway
│   │   ├── destination-rules.yaml # Traffic policies
│   │   └── security-policies.yaml # Security policies
│   ├── monitoring/           # Monitoring configuration
│   │   └── prometheus.yml    # Prometheus config
│   ├── grafana/              # Monitoring dashboards
│   │   └── dashboards/       # Custom dashboards
│   ├── nginx/                # API gateway
│   │   └── nginx.conf        # Nginx configuration
│   └── sonarqube/            # Code quality
│       └── sonar-project.properties # SonarQube config
└── scripts/                  # Utility scripts
    ├── deploy.sh             # Production deployment
    └── local-dev.sh          # Local development
```

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### Backend Services (.env)
```bash
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=service_db
DB_USER=root
DB_PASSWORD=password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=sk_test_...
```

### Kubernetes Secrets
```bash
# Create secrets for production
kubectl create secret generic app-secrets \
  --from-literal=jwt-secret=your-jwt-secret \
  --from-literal=db-password=your-db-password \
  --from-literal=stripe-secret=your-stripe-secret
```

## 🤝 Contributing

### Development Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following coding standards
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Run linting (`npm run lint`)
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

### Coding Standards
- **TypeScript** for type safety
- **ESLint** and **Prettier** for code formatting
- **Conventional Commits** for commit messages
- **Test coverage** minimum 80%
- **Documentation** for all public APIs

## 🐛 Troubleshooting

### Common Issues

#### Local Development
```bash
# Services not starting
./scripts/local-dev.sh clean
./scripts/local-dev.sh setup
./scripts/local-dev.sh start

# Database connection issues
docker-compose down -v
docker-compose up -d mysql redis

# Port conflicts
./scripts/local-dev.sh stop
# Check for processes using ports 3000-3004, 8080, 9090
```

#### Production Deployment
```bash
# EKS cluster issues
kubectl cluster-info
kubectl get nodes

# Pod startup issues
kubectl get pods -n ecommerce
kubectl describe pod <pod-name> -n ecommerce
kubectl logs <pod-name> -n ecommerce

# Ingress issues
kubectl get ingress -n ecommerce
kubectl describe ingress ecommerce-ingress -n ecommerce
```

### Monitoring & Debugging
- **Application logs**: Check service logs in Grafana or kubectl logs
- **Metrics**: Monitor dashboards in Grafana for anomalies
- **Distributed tracing**: Use Jaeger for request tracing
- **Health checks**: Verify /health endpoints for all services

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Documentation

### Getting Help
- **Issues**: Create an issue in the GitHub repository
- **Documentation**: Check the `/docs` folder for detailed guides
- **API Docs**: Access Swagger UI at `http://localhost:300X/api-docs`
- **Monitoring**: Use Grafana dashboards for system health

### Additional Resources
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Istio Documentation](https://istio.io/docs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Stripe API Documentation](https://stripe.com/docs/api)

---

**🚀 Built with modern DevOps practices, cloud-native technologies, and enterprise-grade security**

*This platform demonstrates production-ready microservices architecture with comprehensive DevOps automation, monitoring, and security practices suitable for enterprise e-commerce applications.*
