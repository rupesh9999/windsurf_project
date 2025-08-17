#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

check_docker() {
    log_info "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    
    log_info "Docker check passed!"
}

install_dependencies() {
    log_info "Installing dependencies..."
    
    # Install frontend dependencies
    log_info "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
    
    # Install service dependencies
    for service in user-service product-service order-service payment-service; do
        log_info "Installing $service dependencies..."
        cd services/$service && npm install && cd ../..
    done
    
    log_info "All dependencies installed successfully!"
}

setup_environment() {
    log_info "Setting up environment files..."
    
    # Create .env files if they don't exist
    services=("user-service" "product-service" "order-service" "payment-service")
    
    for service in "${services[@]}"; do
        env_file="services/$service/.env"
        if [ ! -f "$env_file" ]; then
            log_info "Creating $env_file..."
            cat > "$env_file" << EOF
NODE_ENV=development
PORT=300${service: -1}
DB_HOST=localhost
DB_PORT=3306
DB_NAME=${service//-/_}_dev
DB_USER=root
DB_PASSWORD=password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key
AWS_REGION=us-west-2
AWS_S3_BUCKET=ecommerce-products-dev
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
EOF
        fi
    done
    
    # Create frontend .env file
    frontend_env="frontend/.env"
    if [ ! -f "$frontend_env" ]; then
        log_info "Creating $frontend_env..."
        cat > "$frontend_env" << EOF
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
EOF
    fi
    
    log_info "Environment files created successfully!"
}

start_services() {
    log_info "Starting services with Docker Compose..."
    
    # Build and start services
    docker-compose up --build -d
    
    log_info "Services started successfully!"
    
    # Wait for services to be healthy
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    check_service_health
}

check_service_health() {
    log_info "Checking service health..."
    
    services=("frontend:80" "user-service:3001" "product-service:3002" "order-service:3003" "payment-service:3004")
    
    for service in "${services[@]}"; do
        service_name=$(echo $service | cut -d':' -f1)
        port=$(echo $service | cut -d':' -f2)
        
        if curl -f -s "http://localhost:$port/health" > /dev/null 2>&1; then
            log_info "$service_name is healthy ✓"
        else
            log_warn "$service_name health check failed"
        fi
    done
}

show_urls() {
    echo ""
    echo "========================================="
    echo "Local Development Environment Ready!"
    echo "========================================="
    echo "Frontend:           http://localhost:3000"
    echo "API Gateway:        http://localhost:8080"
    echo "User Service:       http://localhost:3001"
    echo "Product Service:    http://localhost:3002"
    echo "Order Service:      http://localhost:3003"
    echo "Payment Service:    http://localhost:3004"
    echo "Prometheus:         http://localhost:9090"
    echo "Grafana:           http://localhost:3001 (admin/admin)"
    echo ""
    echo "Database Access:"
    echo "MySQL:             localhost:3306 (root/password)"
    echo "Redis:             localhost:6379"
    echo ""
    echo "Useful Commands:"
    echo "View logs:         docker-compose logs -f [service-name]"
    echo "Stop services:     docker-compose down"
    echo "Restart service:   docker-compose restart [service-name]"
    echo "========================================="
}

stop_services() {
    log_info "Stopping all services..."
    docker-compose down
    log_info "Services stopped successfully!"
}

clean_environment() {
    log_info "Cleaning up development environment..."
    docker-compose down -v --remove-orphans
    docker system prune -f
    log_info "Environment cleaned successfully!"
}

run_tests() {
    log_info "Running tests..."
    
    # Run frontend tests
    log_info "Running frontend tests..."
    cd frontend && npm test -- --coverage --watchAll=false && cd ..
    
    # Run service tests
    for service in user-service product-service order-service payment-service; do
        log_info "Running $service tests..."
        cd services/$service && npm test -- --coverage && cd ../..
    done
    
    log_info "All tests completed!"
}

# Main function
main() {
    case "${1:-start}" in
        "setup")
            check_docker
            install_dependencies
            setup_environment
            log_info "Setup completed! Run './scripts/local-dev.sh start' to start services."
            ;;
        "start")
            check_docker
            start_services
            show_urls
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            start_services
            show_urls
            ;;
        "clean")
            clean_environment
            ;;
        "test")
            run_tests
            ;;
        "logs")
            if [ -n "$2" ]; then
                docker-compose logs -f "$2"
            else
                docker-compose logs -f
            fi
            ;;
        "status")
            docker-compose ps
            check_service_health
            ;;
        *)
            echo "Usage: $0 {setup|start|stop|restart|clean|test|logs|status}"
            echo ""
            echo "Commands:"
            echo "  setup    - Install dependencies and setup environment"
            echo "  start    - Start all services"
            echo "  stop     - Stop all services"
            echo "  restart  - Restart all services"
            echo "  clean    - Clean up containers and volumes"
            echo "  test     - Run all tests"
            echo "  logs     - Show logs (optionally for specific service)"
            echo "  status   - Show service status"
            echo ""
            echo "Examples:"
            echo "  $0 setup"
            echo "  $0 start"
            echo "  $0 logs user-service"
            echo "  $0 stop"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
