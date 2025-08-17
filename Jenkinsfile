pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'your-registry.com'
        DOCKER_REPO = 'ecommerce'
        KUBECONFIG = credentials('kubeconfig')
        AWS_DEFAULT_REGION = 'us-west-2'
        SONAR_TOKEN = credentials('sonar-token')
        JFROG_URL = 'https://your-company.jfrog.io'
        JFROG_CREDENTIALS = credentials('jfrog-credentials')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                    env.BUILD_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT_SHORT}"
                }
            }
        }
        
        stage('Install Dependencies') {
            parallel {
                stage('Frontend Dependencies') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('User Service Dependencies') {
                    steps {
                        dir('services/user-service') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Product Service Dependencies') {
                    steps {
                        dir('services/product-service') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Order Service Dependencies') {
                    steps {
                        dir('services/order-service') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Payment Service Dependencies') {
                    steps {
                        dir('services/payment-service') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }
        
        stage('Lint & Test') {
            parallel {
                stage('Frontend Lint & Test') {
                    steps {
                        dir('frontend') {
                            sh 'npm run lint'
                            sh 'npm test -- --coverage --watchAll=false'
                        }
                    }
                    post {
                        always {
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'frontend/coverage/lcov-report',
                                reportFiles: 'index.html',
                                reportName: 'Frontend Coverage Report'
                            ])
                        }
                    }
                }
                stage('User Service Lint & Test') {
                    steps {
                        dir('services/user-service') {
                            sh 'npm run lint'
                            sh 'npm test -- --coverage'
                        }
                    }
                }
                stage('Product Service Lint & Test') {
                    steps {
                        dir('services/product-service') {
                            sh 'npm run lint'
                            sh 'npm test -- --coverage'
                        }
                    }
                }
                stage('Order Service Lint & Test') {
                    steps {
                        dir('services/order-service') {
                            sh 'npm run lint'
                            sh 'npm test -- --coverage'
                        }
                    }
                }
                stage('Payment Service Lint & Test') {
                    steps {
                        dir('services/payment-service') {
                            sh 'npm run lint'
                            sh 'npm test -- --coverage'
                        }
                    }
                }
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarQubeScanner'
                    withSonarQubeEnv('SonarQube') {
                        sh """
                            ${scannerHome}/bin/sonar-scanner \
                            -Dsonar.projectKey=ecommerce-platform \
                            -Dsonar.projectName='E-Commerce Platform' \
                            -Dsonar.projectVersion=${env.BUILD_TAG} \
                            -Dsonar.sources=. \
                            -Dsonar.exclusions='**/node_modules/**,**/dist/**,**/build/**,**/coverage/**' \
                            -Dsonar.javascript.lcov.reportPaths=frontend/coverage/lcov.info,services/*/coverage/lcov.info
                        """
                    }
                }
            }
        }
        
        stage('Quality Gate') {
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        
        stage('Security Scan') {
            parallel {
                stage('Dependency Check') {
                    steps {
                        sh 'npm audit --audit-level moderate'
                    }
                }
                stage('Trivy Scan') {
                    steps {
                        sh '''
                            # Install Trivy if not present
                            if ! command -v trivy &> /dev/null; then
                                curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
                            fi
                            
                            # Scan for vulnerabilities
                            trivy fs --exit-code 1 --severity HIGH,CRITICAL .
                        '''
                    }
                }
            }
        }
        
        stage('Build Images') {
            parallel {
                stage('Build Frontend') {
                    steps {
                        dir('frontend') {
                            script {
                                def image = docker.build("${DOCKER_REGISTRY}/${DOCKER_REPO}/frontend:${BUILD_TAG}")
                                docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-registry-credentials') {
                                    image.push()
                                    image.push('latest')
                                }
                            }
                        }
                    }
                }
                stage('Build User Service') {
                    steps {
                        dir('services/user-service') {
                            script {
                                def image = docker.build("${DOCKER_REGISTRY}/${DOCKER_REPO}/user-service:${BUILD_TAG}")
                                docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-registry-credentials') {
                                    image.push()
                                    image.push('latest')
                                }
                            }
                        }
                    }
                }
                stage('Build Product Service') {
                    steps {
                        dir('services/product-service') {
                            script {
                                def image = docker.build("${DOCKER_REGISTRY}/${DOCKER_REPO}/product-service:${BUILD_TAG}")
                                docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-registry-credentials') {
                                    image.push()
                                    image.push('latest')
                                }
                            }
                        }
                    }
                }
                stage('Build Order Service') {
                    steps {
                        dir('services/order-service') {
                            script {
                                def image = docker.build("${DOCKER_REGISTRY}/${DOCKER_REPO}/order-service:${BUILD_TAG}")
                                docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-registry-credentials') {
                                    image.push()
                                    image.push('latest')
                                }
                            }
                        }
                    }
                }
                stage('Build Payment Service') {
                    steps {
                        dir('services/payment-service') {
                            script {
                                def image = docker.build("${DOCKER_REGISTRY}/${DOCKER_REPO}/payment-service:${BUILD_TAG}")
                                docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-registry-credentials') {
                                    image.push()
                                    image.push('latest')
                                }
                            }
                        }
                    }
                }
            }
        }
        
        stage('Push to JFrog Artifactory') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'jfrog-credentials', usernameVariable: 'JFROG_USER', passwordVariable: 'JFROG_PASS')]) {
                        sh """
                            # Configure Docker to use JFrog Artifactory
                            echo ${JFROG_PASS} | docker login ${JFROG_URL} -u ${JFROG_USER} --password-stdin
                            
                            # Tag and push images to JFrog
                            docker tag ${DOCKER_REGISTRY}/${DOCKER_REPO}/frontend:${BUILD_TAG} ${JFROG_URL}/docker/frontend:${BUILD_TAG}
                            docker tag ${DOCKER_REGISTRY}/${DOCKER_REPO}/user-service:${BUILD_TAG} ${JFROG_URL}/docker/user-service:${BUILD_TAG}
                            docker tag ${DOCKER_REGISTRY}/${DOCKER_REPO}/product-service:${BUILD_TAG} ${JFROG_URL}/docker/product-service:${BUILD_TAG}
                            docker tag ${DOCKER_REGISTRY}/${DOCKER_REPO}/order-service:${BUILD_TAG} ${JFROG_URL}/docker/order-service:${BUILD_TAG}
                            docker tag ${DOCKER_REGISTRY}/${DOCKER_REPO}/payment-service:${BUILD_TAG} ${JFROG_URL}/docker/payment-service:${BUILD_TAG}
                            
                            docker push ${JFROG_URL}/docker/frontend:${BUILD_TAG}
                            docker push ${JFROG_URL}/docker/user-service:${BUILD_TAG}
                            docker push ${JFROG_URL}/docker/product-service:${BUILD_TAG}
                            docker push ${JFROG_URL}/docker/order-service:${BUILD_TAG}
                            docker push ${JFROG_URL}/docker/payment-service:${BUILD_TAG}
                        """
                    }
                }
            }
        }
        
        stage('Update Kubernetes Manifests') {
            steps {
                script {
                    sh """
                        # Update image tags in Kubernetes manifests
                        sed -i 's|image: ecommerce/frontend:.*|image: ${DOCKER_REGISTRY}/${DOCKER_REPO}/frontend:${BUILD_TAG}|g' infrastructure/k8s/deployments.yaml
                        sed -i 's|image: ecommerce/user-service:.*|image: ${DOCKER_REGISTRY}/${DOCKER_REPO}/user-service:${BUILD_TAG}|g' infrastructure/k8s/deployments.yaml
                        sed -i 's|image: ecommerce/product-service:.*|image: ${DOCKER_REGISTRY}/${DOCKER_REPO}/product-service:${BUILD_TAG}|g' infrastructure/k8s/deployments.yaml
                        sed -i 's|image: ecommerce/order-service:.*|image: ${DOCKER_REGISTRY}/${DOCKER_REPO}/order-service:${BUILD_TAG}|g' infrastructure/k8s/deployments.yaml
                        sed -i 's|image: ecommerce/payment-service:.*|image: ${DOCKER_REGISTRY}/${DOCKER_REPO}/payment-service:${BUILD_TAG}|g' infrastructure/k8s/deployments.yaml
                    """
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    sh """
                        # Apply Kubernetes manifests to staging namespace
                        kubectl apply -f infrastructure/k8s/namespace.yaml
                        kubectl apply -f infrastructure/k8s/configmaps.yaml
                        kubectl apply -f infrastructure/k8s/secrets.yaml
                        kubectl apply -f infrastructure/k8s/deployments.yaml
                        kubectl apply -f infrastructure/k8s/services.yaml
                        kubectl apply -f infrastructure/k8s/ingress.yaml
                        
                        # Wait for rollout to complete
                        kubectl rollout status deployment/frontend -n ecommerce --timeout=300s
                        kubectl rollout status deployment/user-service -n ecommerce --timeout=300s
                        kubectl rollout status deployment/product-service -n ecommerce --timeout=300s
                        kubectl rollout status deployment/order-service -n ecommerce --timeout=300s
                        kubectl rollout status deployment/payment-service -n ecommerce --timeout=300s
                    """
                }
            }
        }
        
        stage('Integration Tests') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    sh """
                        # Run integration tests against staging environment
                        npm run test:integration
                    """
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // This would typically trigger ArgoCD sync
                    sh """
                        # Commit updated manifests to trigger ArgoCD
                        git config --global user.email "jenkins@company.com"
                        git config --global user.name "Jenkins CI"
                        git add infrastructure/k8s/deployments.yaml
                        git commit -m "Update image tags to ${BUILD_TAG}"
                        git push origin main
                    """
                }
            }
        }
    }
    
    post {
        always {
            // Clean up Docker images
            sh 'docker system prune -f'
            
            // Archive artifacts
            archiveArtifacts artifacts: 'infrastructure/k8s/*.yaml', allowEmptyArchive: true
            
            // Publish test results
            publishTestResults testResultsPattern: '**/test-results.xml'
        }
        success {
            slackSend(
                channel: '#deployments',
                color: 'good',
                message: "✅ Pipeline succeeded for ${env.JOB_NAME} - ${env.BUILD_NUMBER} (${env.GIT_COMMIT_SHORT})"
            )
        }
        failure {
            slackSend(
                channel: '#deployments',
                color: 'danger',
                message: "❌ Pipeline failed for ${env.JOB_NAME} - ${env.BUILD_NUMBER} (${env.GIT_COMMIT_SHORT})"
            )
        }
    }
}
