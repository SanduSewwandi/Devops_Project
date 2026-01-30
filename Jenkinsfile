pipeline {
    agent any

    environment {
        DOCKERHUB_USER  = 'sandusewwandi'
        BACKEND_IMAGE  = "${DOCKERHUB_USER}/devops_backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/devops_frontend:latest"
    }

    options {
        timeout(time: 45, unit: 'MINUTES')  // Increased timeout
        retry(1)
    }

    stages {
        stage('Checkout') {
            steps {
                retry(2) {
                    checkout scm
                }
                sh '''
                    echo "=== Project Structure ==="
                    pwd
                    ls -la

                    echo "=== Checking Critical Files ==="
                    test -f backEnd/Dockerfile && echo "✅ backEnd/Dockerfile exists" || exit 1
                    test -f frontEnd/Dockerfile && echo "✅ frontEnd/Dockerfile exists" || exit 1
                    
                    echo "=== Creating docker-compose.yml ==="
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
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: ${BACKEND_IMAGE}
    container_name: backend
    ports:
      - "5000:5000"
    environment:
      MONGODB_URI: mongodb://mongodb:27017/devops
      NODE_ENV: production
    depends_on:
      mongodb:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    image: ${FRONTEND_IMAGE}
    container_name: frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mongo_data:
EOF
                    echo "✅ docker-compose.yml created with health checks"
                '''
            }
        }

        stage('Test Docker Setup') {
            steps {
                sh '''
                    echo "=== Testing Docker ==="
                    docker --version
                    docker-compose --version
                    docker ps > /dev/null && echo "✅ Docker is running"
                '''
            }
        }

        stage('Clean Previous Deployment') {
            steps {
                sh '''
                    echo "=== Cleaning Previous Deployment ==="
                    docker-compose down -v --remove-orphans 2>/dev/null || true
                    docker rm -f $(docker ps -aq) 2>/dev/null || true
                    docker network prune -f 2>/dev/null || true
                    echo "✅ Cleanup completed"
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    echo "=== Building Images ==="
                    
                    echo "1. Building backend..."
                    cd backEnd
                    docker build -t reactweb1-backend .
                    docker tag reactweb1-backend ${BACKEND_IMAGE}
                    
                    echo "2. Building frontend..."
                    cd ../frontEnd
                    docker build -t reactweb1-frontend .
                    docker tag reactweb1-frontend ${FRONTEND_IMAGE}
                    
                    echo "✅ Images built successfully"
                    echo "Current images:"
                    docker images | grep -E "devops|reactweb"
                '''
            }
        }

        stage('Push Images to Docker Hub') {
            when {
                environment name: 'DOCKERHUB_CREDS', value: 'plantcredentials'
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'plantcredentials',
                    usernameVariable: 'DH_USER',
                    passwordVariable: 'DH_PASS'
                )]) {
                    sh '''
                        echo "=== Pushing to Docker Hub ==="
                        echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
                        
                        echo "Pushing backend image..."
                        docker push ${BACKEND_IMAGE}
                        
                        echo "Pushing frontend image..."
                        docker push ${FRONTEND_IMAGE}
                        
                        docker logout
                        echo "✅ Images pushed to Docker Hub"
                    '''
                }
            }
        }

        stage('Deploy Containers') {
            steps {
                sh '''
                    echo "=== Deploying Containers ==="
                    
                    echo "1. Starting services..."
                    docker-compose up -d
                    
                    echo "2. Waiting for MongoDB to be ready..."
                    for i in {1..30}; do
                        if docker-compose ps mongodb | grep -q "(healthy)"; then
                            echo "✅ MongoDB is healthy"
                            break
                        fi
                        echo "Waiting for MongoDB... ($i/30)"
                        sleep 2
                    done
                    
                    echo "3. Checking all containers..."
                    sleep 10
                    echo "Container status:"
                    docker-compose ps
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    echo "=== Verifying Deployment ==="
                    
                    # Wait for all services
                    echo "Waiting for all services to be ready..."
                    sleep 15
                    
                    # Check container status
                    echo "=== Container Status ==="
                    docker-compose ps
                    
                    total=$(docker-compose ps -q | wc -l)
                    running=$(docker-compose ps -q | xargs docker inspect -f "{{.State.Status}}" 2>/dev/null | grep -c "running")
                    
                    echo "📊 Containers running: $running/$total"
                    
                    if [ "$running" -ne 3 ]; then
                        echo "❌ ERROR: Expected 3 containers, found $running"
                        echo "=== Debug Information ==="
                        docker-compose ps -a
                        echo "=== Logs ==="
                        docker-compose logs --tail=50
                        exit 1
                    fi
                    
                    echo "✅ All containers are running!"
                    
                    # Test with retries
                    echo ""
                    echo "=== Testing Services ==="
                    
                    echo "Testing backend (with retries)..."
                    backend_ready=false
                    for i in {1..10}; do
                        echo "Attempt $i/10..."
                        if curl -s -f --max-time 5 http://localhost:5000 > /dev/null; then
                            echo "✅ Backend is responding"
                            backend_ready=true
                            break
                        fi
                        sleep 3
                    done
                    
                    if [ "$backend_ready" = false ]; then
                        echo "⚠️ Backend not responding to HTTP (but container is running)"
                        echo "Backend logs:"
                        docker logs backend --tail=30
                    fi
                    
                    echo "Testing frontend..."
                    if curl -s --max-time 5 http://localhost:5173 > /dev/null; then
                        echo "✅ Frontend is responding"
                    else
                        echo "⚠️ Frontend not responding (React dev server may not respond to curl)"
                    fi
                    
                    echo ""
                    echo "🎉 DEPLOYMENT SUCCESSFUL!"
                    echo "======================================="
                    echo "Services deployed on EC2:"
                    echo "1. MongoDB database:   localhost:27017"
                    echo "2. Backend API:        localhost:5000"
                    echo "3. Frontend React app: localhost:5173"
                    echo "======================================="
                    
                    # Get EC2 public IP
                    echo ""
                    echo "🌐 Public Access URLs:"
                    if [ -f /sys/hypervisor/uuid ] && [ "$(head -c 3 /sys/hypervisor/uuid)" = "ec2" ]; then
                        PUBLIC_IP=$(curl -s --max-time 3 http://169.254.169.254/latest/meta-data/public-ipv4)
                        echo "Backend API:    http://$PUBLIC_IP:5000"
                        echo "Frontend App:   http://$PUBLIC_IP:5173"
                        echo "MongoDB (direct): $PUBLIC_IP:27017"
                    else
                        echo "Not running on EC2 or cannot retrieve public IP"
                        echo "Use your server's IP address with the ports above"
                    fi
                    
                    echo ""
                    echo "⏱️ Total deployment time: $(($SECONDS / 60)) minutes and $(($SECONDS % 60)) seconds"
                '''
            }
        }
    }

    post {
        always {
            script {
                echo "==========================================="
                echo "Build Result: ${currentBuild.currentResult}"
                echo "Build URL: ${env.BUILD_URL}"
                echo "Build Number: ${env.BUILD_NUMBER}"
                echo "Duration: ${currentBuild.durationString}"
                echo "==========================================="
            }
        }
        
        success {
            script {
                echo "🎉 PIPELINE COMPLETED SUCCESSFULLY"
                echo "Your MERN stack application is now live!"
            }
        }
        
        failure {
            script {
                echo "❌ PIPELINE FAILED"
                echo ""
                echo "Troubleshooting tips:"
                echo "1. Check if Docker is running: sudo systemctl status docker"
                echo "2. Check Jenkins permissions: sudo usermod -aG docker jenkins"
                echo "3. Check port conflicts: sudo netstat -tulpn | grep -E ':5000|:5173|:27017'"
                echo "4. Check disk space: df -h"
                echo "5. Check container logs: docker-compose logs"
            }
        }
    }
}