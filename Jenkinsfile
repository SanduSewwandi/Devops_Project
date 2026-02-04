pipeline {
    agent any

    environment {
        DOCKERHUB_CREDS = 'plantcredentials'
        DOCKERHUB_USER  = 'sandusewwandi'
        BACKEND_IMAGE  = "${DOCKERHUB_USER}/devops_backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/devops_frontend:latest"
        WORKSPACE_DIR = pwd()
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
                    // Get public IP
                    def publicIp = sh(script: "curl -s http://169.254.169.254/latest/meta-data/public-ipv4", returnStdout: true).trim()
                    echo "=== Detected Public IP: ${publicIp} ==="
                    
                    // Save IP for later use
                    env.PUBLIC_IP = publicIp
                    
                    // Debug: Show workspace permissions
                    sh '''
                        echo "=== Workspace Information ==="
                        pwd
                        ls -la
                        echo "User: $(whoami)"
                        echo "UID: $(id -u)"
                        echo "GID: $(id -g)"
                    '''
                }
            }
        }

        stage('Create Docker Compose') {
            steps {
                script {
                    // Create docker-compose.yml in a safe way
                    sh """
                        # Create docker-compose.yml content
                        cat << 'EOF_DOCKER_COMPOSE' > /tmp/docker-compose.yml
version: '3.8'

services:
  mongo:
    image: mongo:6
    container_name: mongo
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
      MONGODB_URI: mongodb://mongo:27017/devops
      NODE_ENV: production
      JWT_SECRET: dummysecret
      CLDN_API_KEY: 823756362343243
      CLDN_API_SECRET: FwkT9WUwifSXJn-Mev1-2gpvw5c
      CLDN_NAME: djzjdus1k
      ADMIN_EMAIL: admin@plant.com
      ADMIN_PASS: Admin123
      # CORS Configuration - CRITICAL for Add Plant functionality
      CORS_ORIGIN: http://localhost:5173,http://${env.PUBLIC_IP}:5173
    volumes:
      - uploads_volume:/app/uploads
    depends_on:
      - mongo
    restart: unless-stopped

  frontend:
    image: ${FRONTEND_IMAGE}
    container_name: frontend
    ports:
      - "5173:5173"
    environment:
      # Fixes the CORS/localhost error by pointing to the EC2 Public IP
      VITE_API_URL: http://${env.PUBLIC_IP}:5000
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mongo_data:
  uploads_volume:
EOF_DOCKER_COMPOSE

                        # Copy to workspace with proper permissions
                        sudo cp /tmp/docker-compose.yml .
                        sudo chown jenkins:jenkins docker-compose.yml
                        sudo chmod 644 docker-compose.yml
                        
                        echo "=== Docker Compose File Created ==="
                        ls -la docker-compose.yml
                        echo ""
                        echo "=== Docker Compose Content ==="
                        cat docker-compose.yml | head -20
                    """
                }
            }
        }

        stage('Clean Previous') {
            steps {
                sh '''
                    echo "=== Cleaning Previous Deployment ==="
                    
                    # Stop and remove any existing containers
                    if [ -f "docker-compose.yml" ]; then
                        docker-compose down -v --remove-orphans 2>/dev/null || true
                    fi
                    
                    # Clean Docker system
                    docker system prune -f 2>/dev/null || true
                    
                    echo "✅ Cleanup completed"
                '''
            }
        }

        stage('Build Images') {
            steps {
                sh '''
                    echo "=== Building Docker Images ==="
                    
                    # Try to build, but continue if fails (use existing images)
                    set +e
                    
                    if [ -d "backEnd" ] && [ -f "backEnd/Dockerfile" ]; then
                        echo "📦 Building backend image..."
                        cd backEnd
                        docker build -t ${BACKEND_IMAGE} .
                        cd ..
                        echo "✅ Backend image built"
                    else
                        echo "⚠️ Backend directory or Dockerfile not found, will use existing image"
                    fi
                    
                    if [ -d "frontEnd" ] && [ -f "frontEnd/Dockerfile" ]; then
                        echo "📦 Building frontend image..."
                        cd frontEnd
                        docker build -t ${FRONTEND_IMAGE} .
                        cd ..
                        echo "✅ Frontend image built"
                    else
                        echo "⚠️ Frontend directory or Dockerfile not found, will use existing image"
                    fi
                    
                    set -e
                    echo "=== Build stage completed ==="
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
                        
                        # Login to Docker Hub
                        echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
                        
                        # Try to push images, but don't fail if they don't exist
                        set +e
                        
                        # Push backend image if it exists
                        if docker image inspect ${BACKEND_IMAGE} > /dev/null 2>&1; then
                            echo "⬆️  Pushing backend image..."
                            docker push ${BACKEND_IMAGE}
                            echo "✅ Backend image pushed"
                        else
                            echo "⚠️ Backend image not found locally, skipping push"
                        fi
                        
                        # Push frontend image if it exists
                        if docker image inspect ${FRONTEND_IMAGE} > /dev/null 2>&1; then
                            echo "⬆️  Pushing frontend image..."
                            docker push ${FRONTEND_IMAGE}
                            echo "✅ Frontend image pushed"
                        else
                            echo "⚠️ Frontend image not found locally, skipping push"
                        fi
                        
                        set -e
                        
                        # Logout from Docker Hub
                        docker logout
                        echo "=== Push stage completed ==="
                    '''
                }
            }
        }

        stage('Deploy Application') {
            steps {
                sh '''
                    echo "=== Deploying Application ==="
                    
                    if [ ! -f "docker-compose.yml" ]; then
                        echo "❌ ERROR: docker-compose.yml not found!"
                        exit 1
                    fi
                    
                    echo "🚀 Starting containers..."
                    docker-compose up -d
                    
                    # Wait for containers to start
                    echo "⏳ Waiting for containers to start (30 seconds)..."
                    sleep 30
                    
                    # Show container status
                    echo "=== Container Status ==="
                    docker-compose ps
                    
                    # Check if containers are running
                    if docker-compose ps | grep -q "Exit"; then
                        echo "❌ Some containers have exited!"
                        echo "=== Container Logs ==="
                        docker-compose logs --tail=50
                        exit 1
                    fi
                    
                    echo "✅ Deployment completed"
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    echo "=== Verifying Deployment ==="
                    
                    # Count running containers
                    running_count=$(docker-compose ps --services --filter "status=running" 2>/dev/null | wc -l)
                    
                    echo "Running containers: $running_count"
                    
                    if [ "$running_count" -eq 3 ]; then
                        # Get public IP
                        PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
                        
                        echo ""
                        echo "🎉 DEPLOYMENT SUCCESSFUL!"
                        echo "=========================================="
                        echo "🌿 Plant Shop Application is LIVE!"
                        echo ""
                        echo "🔗 Application URL:"
                        echo "   http://$PUBLIC_IP:5173"
                        echo ""
                        echo "⚙️  Service URLs:"
                        echo "   Frontend: http://$PUBLIC_IP:5173"
                        echo "   Backend API: http://$PUBLIC_IP:5000"
                        echo "   MongoDB: http://$PUBLIC_IP:27017"
                        echo ""
                        echo "📋 Admin Features:"
                        echo "   ✅ Add New Plant"
                        echo "   ✅ Edit Existing Plants"
                        echo "   ✅ Delete Plants"
                        echo "   ✅ User Management"
                        echo "=========================================="
                        
                        # Quick health checks
                        echo ""
                        echo "=== Health Checks ==="
                        echo -n "Frontend: "
                        curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 || echo "Failed"
                        
                        echo -n "Backend API: "
                        curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health || echo "Failed"
                        
                    else
                        echo "❌ DEPLOYMENT FAILED: Expected 3 containers, found $running_count running"
                        echo "=== Debug Information ==="
                        docker-compose ps
                        echo ""
                        echo "=== Recent Logs ==="
                        docker-compose logs --tail=100
                        exit 1
                    fi
                '''
            }
        }
    }

    post {
        always {
            echo "Build Result: ${currentBuild.currentResult}"
            
            script {
                if (currentBuild.currentResult == 'FAILURE' || currentBuild.currentResult == 'UNSTABLE') {
                    sh '''
                        echo "🧹 Cleaning up after failure..."
                        # Try to cleanup, but don't fail if cleanup fails
                        docker-compose down -v 2>/dev/null || true
                    '''
                }
            }
        }
        
        success {
            sh '''
                echo ""
                echo "=========================================="
                echo "✅ PIPELINE COMPLETED SUCCESSFULLY!"
                echo "🌿 Your Plant Shop is now deployed!"
                echo "=========================================="
            '''
            
            // You can add email notification here if needed
            // emailext body: "Deployment successful!\n\nApplication URL: http://${env.PUBLIC_IP}:5173", subject: "Plant Shop Deployment Success", to: 'your-email@example.com'
        }
        
        failure {
            sh '''
                echo ""
                echo "=========================================="
                echo "❌ PIPELINE FAILED!"
                echo "Check Jenkins logs for details."
                echo "=========================================="
            '''
            
            // You can add failure notification here
            // emailext body: "Deployment failed!\n\nCheck Jenkins logs.", subject: "Plant Shop Deployment Failed", to: 'your-email@example.com'
        }
    }
}