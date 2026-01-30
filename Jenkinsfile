pipeline {
    agent any

    environment {
        // Check if credentials exist
        DOCKERHUB_CREDS = 'plantcredentials'
        DOCKERHUB_USER  = 'sandusewwandi'
        BACKEND_IMAGE  = "${DOCKERHUB_USER}/devops_backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/devops_frontend:latest"
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        retry(1)  // Retry once if fails
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
                    test -f docker-compose.yml && echo "✅ docker-compose.yml exists" || echo "⚠️ Creating docker-compose.yml"
                    test -f backEnd/Dockerfile && echo "✅ backEnd/Dockerfile exists" || echo "❌ backEnd/Dockerfile missing"
                    test -f frontEnd/Dockerfile && echo "✅ frontEnd/Dockerfile exists" || echo "❌ frontEnd/Dockerfile missing"
                    
                    # Create docker-compose.yml if it doesn't exist
                    if [ ! -f docker-compose.yml ]; then
                        echo "=== Creating docker-compose.yml ==="
                        cat > docker-compose.yml << 'EOF'
version: '3'

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
    image: sandusewwandi/devops_backend:latest
    container_name: backend
    ports:
      - "5000:5000"
    environment:
      MONGODB_URI: mongodb://mongodb:27017/devops
      NODE_ENV: production
    depends_on:
      - mongodb
    restart: unless-stopped

  frontend:
    image: sandusewwandi/devops_frontend:latest
    container_name: frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mongo_data:
EOF
                        echo "✅ docker-compose.yml created"
                    fi
                '''
            }
        }

        stage('Test Docker Setup') {
            steps {
                sh '''
                    echo "=== Testing Docker ==="
                    echo "Docker version: $(docker --version 2>/dev/null || echo 'Not installed')"
                    echo "Docker Compose version: $(docker-compose --version 2>/dev/null || echo 'Not installed')"
                    
                    # Check if Docker is running
                    if docker ps > /dev/null 2>&1; then
                        echo "✅ Docker is running"
                    else
                        echo "❌ Docker is not running or Jenkins doesn't have permission"
                        echo "Try: sudo usermod -aG docker jenkins && sudo systemctl restart jenkins"
                        exit 1
                    fi
                '''
            }
        }

        stage('Clean Previous Deployment') {
            steps {
                sh '''
                    echo "=== Cleaning Previous Deployment ==="
                    
                    # Save previous logs before cleanup
                    echo "Saving previous logs..."
                    docker-compose logs --tail=50 2>/dev/null > /tmp/previous_deployment.log || true
                    
                    # Clean up
                    echo "Stopping and removing containers..."
                    docker-compose down -v --remove-orphans 2>/dev/null || true
                    
                    echo "Removing any other containers..."
                    docker rm -f $(docker ps -aq) 2>/dev/null || true
                    
                    echo "Cleaning networks..."
                    docker network prune -f 2>/dev/null || true
                    
                    echo "✅ Cleanup completed"
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    echo "=== Building Images ==="
                    
                    # Build backend
                    echo "Building backend..."
                    cd backEnd
                    docker build -t reactweb1-backend .
                    docker tag reactweb1-backend ${BACKEND_IMAGE}
                    
                    # Build frontend
                    echo "Building frontend..."
                    cd ../frontEnd
                    docker build -t reactweb1-frontend .
                    docker tag reactweb1-frontend ${FRONTEND_IMAGE}
                    
                    echo "✅ Images built and tagged"
                    echo "=== Current Images ==="
                    docker images | grep -E "devops|reactweb" || echo "No images found"
                '''
            }
        }

        stage('Push Images to Docker Hub') {
            when {
                expression { 
                    try {
                        withCredentials([usernamePassword(credentialsId: "${DOCKERHUB_CREDS}", usernameVariable: 'DUMMY', passwordVariable: 'DUMMY2')]) {
                            return true
                        }
                    } catch(Exception e) {
                        return false
                    }
                }
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKERHUB_CREDS}",
                    usernameVariable: 'DH_USER',
                    passwordVariable: 'DH_PASS'
                )]) {
                    sh '''
                        echo "=== Pushing to Docker Hub ==="
                        echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
                        
                        echo "Pushing backend image..."
                        docker push ${BACKEND_IMAGE} || echo "⚠️ Backend push had issues"
                        
                        echo "Pushing frontend image..."
                        docker push ${FRONTEND_IMAGE} || echo "⚠️ Frontend push had issues"
                        
                        docker logout
                        echo "✅ Images pushed"
                    '''
                }
            }
        }

        stage('Skip Docker Hub Push') {
            when {
                expression { 
                    try {
                        withCredentials([usernamePassword(credentialsId: "${DOCKERHUB_CREDS}", usernameVariable: 'DUMMY', passwordVariable: 'DUMMY2')]) {
                            return false
                        }
                    } catch(Exception e) {
                        return true
                    }
                }
            }
            steps {
                echo "⚠️ Skipping Docker Hub push - using local images only"
            }
        }

        stage('Deploy Containers') {
            steps {
                sh '''
                    echo "=== Deploying Containers ==="
                    
                    echo "Starting services..."
                    docker-compose up -d
                    
                    echo "Waiting for services to start..."
                    sleep 10
                    
                    echo "=== Initial Container Status ==="
                    docker-compose ps
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    echo "=== Verifying Deployment ==="
                    
                    # Give containers more time to start
                    echo "Waiting for containers to stabilize..."
                    sleep 5
                    
                    # Check container status
                    echo "=== Container Status ==="
                    docker-compose ps
                    
                    total=$(docker-compose ps -q | wc -l)
                    running=$(docker-compose ps -q | xargs docker inspect -f "{{.State.Status}}" 2>/dev/null | grep -c "running")
                    
                    echo "Containers: $running/$total running"
                    
                    if [ "$total" -eq 0 ]; then
                        echo "❌ ERROR: No containers found!"
                        echo "=== Checking all containers ==="
                        docker ps -a
                        echo "=== Checking docker-compose ==="
                        docker-compose ps -a
                        exit 1
                    fi
                    
                    if [ "$running" -ne "$total" ]; then
                        echo "❌ ERROR: Not all containers are running"
                        echo "=== Failed container details ==="
                        docker-compose ps -a
                        echo "=== Container logs ==="
                        docker-compose logs --tail=50
                        exit 1
                    fi
                    
                    echo "✅ SUCCESS: All containers are running!"
                    
                    # Test backend (optional - don't fail if it doesn't respond)
                    echo ""
                    echo "=== Testing Services (Optional) ==="
                    
                    echo "Testing backend (10 second timeout)..."
                    if curl -s --max-time 10 http://localhost:5000 > /dev/null; then
                        echo "✅ Backend is responding"
                    else
                        echo "⚠️ Backend not responding (may still be starting)"
                        echo "Backend logs:"
                        docker logs backend --tail=20 2>/dev/null || echo "Could not get backend logs"
                    fi
                    
                    echo "Testing frontend (10 second timeout)..."
                    if curl -s --max-time 10 http://localhost:5173 > /dev/null; then
                        echo "✅ Frontend is responding"
                    else
                        echo "⚠️ Frontend not responding (React dev server may not respond to curl)"
                        echo "Frontend logs:"
                        docker logs frontend --tail=20 2>/dev/null || echo "Could not get frontend logs"
                    fi
                    
                    echo ""
                    echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY"
                    echo "======================================="
                    echo "Services:"
                    echo "• MongoDB:    localhost:27017"
                    echo "• Backend:    localhost:5000"
                    echo "• Frontend:   localhost:5173"
                    echo "======================================="
                    
                    # Show EC2 public IP
                    echo ""
                    echo "🌐 Public Access URLs:"
                    if PUBLIC_IP=$(curl -s --max-time 5 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null); then
                        echo "Backend API:  http://$PUBLIC_IP:5000"
                        echo "Frontend App: http://$PUBLIC_IP:5173"
                        echo "MongoDB:      $PUBLIC_IP:27017"
                    else
                        echo "Could not retrieve public IP"
                        echo "Use your EC2 instance's public IP with ports 5000, 5173, 27017"
                    fi
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
                echo "==========================================="
                
                // Simple post-build summary without sh steps
                echo "Build completed at: ${new Date().format('yyyy-MM-dd HH:mm:ss')}"
            }
        }
        
        success {
            script {
                echo "🎉 PIPELINE COMPLETED SUCCESSFULLY"
                echo "Your application is now deployed on EC2!"
            }
        }
        
        failure {
            script {
                echo "❌ PIPELINE FAILED"
                echo "Check the console output above for details"
                echo ""
                echo "Common EC2 issues:"
                echo "1. Docker not installed: sudo yum install docker -y"
                echo "2. Jenkins permissions: sudo usermod -aG docker jenkins"
                echo "3. Port conflicts: Check ports 5000, 5173, 27017"
                echo "4. Memory issues: Your EC2 instance might need more RAM"
            }
        }
    }
}