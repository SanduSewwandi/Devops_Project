pipeline {
    agent any

    environment {
        DOCKERHUB_CREDS = 'plantcredentials'
        DOCKERHUB_USER  = 'sandusewwandi'
        BACKEND_IMAGE  = "${DOCKERHUB_USER}/devops_backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/devops_frontend:latest"
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        retry(1)
    }

    stages {
        stage('Checkout & Setup') {
            steps {
                retry(2) {
                    checkout scm
                }
                script {
                    // Automatically fetch the EC2 Public IP for the CORS fix
                    def publicIp = sh(script: "curl -s http://169.254.169.254/latest/meta-data/public-ipv4", returnStdout: true).trim()
                    echo "=== Detected Public IP: ${publicIp} ==="

                    // Fix: Use correct path and create docker-compose.yml with proper CORS
                    sh """
                        # Create docker-compose.yml with proper permissions
                        cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  mongodb:
    image: mongo:6
    container_name: mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  backend:
    image: ${BACKEND_IMAGE}
    container_name: backend
    ports:
      - "5000:5000"
    environment:
      MONGODB_URI: mongodb://mongodb:27017/devops
      NODE_ENV: production
      JWT_SECRET: dummysecret
      CLDN_API_KEY: 823756362343243
      CLDN_API_SECRET: FwkT9WUwifSXJn-Mev1-2gpvw5c
      CLDN_NAME: djzjdus1k
      ADMIN_EMAIL: admin@plant.com
      ADMIN_PASS: Admin123
      # CORS Configuration - CRITICAL for Add Plant functionality
      CORS_ORIGIN: http://localhost:5173,http://${publicIp}:5173
    volumes:
      - uploads_volume:/app/uploads
    depends_on:
      - mongodb
    restart: unless-stopped

  frontend:
    image: ${FRONTEND_IMAGE}
    container_name: frontend
    ports:
      - "5173:5173"
    environment:
      # Fixes the CORS/localhost error by pointing to the EC2 Public IP
      VITE_API_URL: http://${publicIp}:5000
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mongo_data:
  uploads_volume:
EOF
                        
                        # Fix permission issues
                        chmod 644 docker-compose.yml
                        ls -la docker-compose.yml
                    """
                }
            }
        }

        stage('Clean Previous') {
            steps {
                sh '''
                    # Clean up previous containers
                    docker-compose down -v --remove-orphans 2>/dev/null || true
                    docker system prune -f 2>/dev/null || true
                    echo "Cleanup completed"
                '''
            }
        }

        stage('Build Images') {
            steps {
                sh '''
                    echo "=== Building Docker Images ==="
                    
                    # Check if directories exist
                    if [ -d "backEnd" ]; then
                        echo "Building backend..."
                        cd backEnd && docker build -t ${BACKEND_IMAGE} . || echo "Backend build failed"
                        cd ..
                    else
                        echo "WARNING: backEnd directory not found"
                    fi
                    
                    if [ -d "frontEnd" ]; then
                        echo "Building frontend..."
                        cd frontEnd && docker build -t ${FRONTEND_IMAGE} . || echo "Frontend build failed"
                        cd ..
                    else
                        echo "WARNING: frontEnd directory not found"
                    fi
                    
                    echo "=== Build completed ==="
                '''
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKERHUB_CREDS}",
                    usernameVariable: 'DH_USER',
                    passwordVariable: 'DH_PASS'
                )]) {
                    sh '''
                        echo "=== Pushing to Docker Hub ==="
                        echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
                        
                        # Push backend if built
                        if docker image inspect ${BACKEND_IMAGE} > /dev/null 2>&1; then
                            echo "Pushing backend image..."
                            docker push ${BACKEND_IMAGE} || echo "Backend push failed"
                        fi
                        
                        # Push frontend if built
                        if docker image inspect ${FRONTEND_IMAGE} > /dev/null 2>&1; then
                            echo "Pushing frontend image..."
                            docker push ${FRONTEND_IMAGE} || echo "Frontend push failed"
                        fi
                        
                        docker logout
                        echo "=== Push completed ==="
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    echo "=== Deploying Application ==="
                    
                    # Check if docker-compose.yml exists
                    if [ -f "docker-compose.yml" ]; then
                        echo "Starting containers..."
                        docker-compose up -d
                        
                        # Wait for containers to start
                        echo "Waiting for containers to stabilize..."
                        sleep 20
                        
                        # Check container status
                        docker-compose ps
                    else
                        echo "ERROR: docker-compose.yml not found!"
                        exit 1
                    fi
                '''
            }
        }

        stage('Verify') {
            steps {
                sh '''
                    echo "=== Verifying Deployment ==="
                    
                    # Check running containers
                    running_containers=$(docker-compose ps --services --filter "status=running" 2>/dev/null | wc -l)
                    total_containers=$(docker-compose ps --services 2>/dev/null | wc -l)
                    
                    echo "Running containers: $running_containers"
                    echo "Total containers: $total_containers"
                    
                    if [ "$running_containers" -ge 2 ]; then
                        PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
                        echo ""
                        echo "✅ DEPLOYMENT SUCCESSFUL!"
                        echo "====================================="
                        echo "Frontend URL: http://$PUBLIC_IP:5173"
                        echo "Backend API: http://$PUBLIC_IP:5000"
                        echo "MongoDB: http://$PUBLIC_IP:27017"
                        echo "====================================="
                        
                        # Test backend API
                        echo "Testing backend API..."
                        curl -f http://localhost:5000/api/health 2>/dev/null && echo "✅ Backend is healthy" || echo "⚠️  Backend health check failed"
                        
                    else
                        echo "❌ DEPLOYMENT FAILED: Not all containers are running"
                        echo "Checking logs..."
                        docker-compose logs --tail=50
                        exit 1
                    fi
                '''
            }
        }
    }

    post {
        always {
            echo "Build Result: ${currentBuild.currentResult}"
            
            // Cleanup on failure
            unsuccessful {
                sh '''
                    echo "Cleaning up after failure..."
                    docker-compose down -v 2>/dev/null || true
                '''
            }
        }
    }
}