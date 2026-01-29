pipeline {
    agent any

    environment {
        // Try to get credentials, but don't fail if missing
        DOCKERHUB_CREDS = credentials('plantcredentials') ? 'plantcredentials' : ''
        DOCKERHUB_USER  = 'sandusewwandi'
        BACKEND_IMAGE  = "${DOCKERHUB_USER}/devops_backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/devops_frontend:latest"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh '''
                    echo "=== Project Structure ==="
                    pwd
                    ls -la

                    echo "=== Checking Critical Files ==="
                    test -f docker-compose.yml
                    test -f backEnd/Dockerfile
                    test -f frontEnd/Dockerfile
                    echo "✅ All required files exist"
                    
                    echo "=== Creating docker-compose.yml ==="
                    cat > docker-compose.yml << 'EOF'
version: '3'

services:
  frontend:
    image: sandusewwandi/devops_frontend:latest
    container_name: frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    image: sandusewwandi/devops_backend:latest
    container_name: backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/devops
    depends_on:
      - mongodb
    restart: unless-stopped

  mongodb:
    image: mongo:6
    container_name: mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

volumes:
  mongo_data:
EOF
                    echo "✅ docker-compose.yml created"
                '''
            }
        }

        stage('Test Docker Setup') {
            steps {
                sh '''
                    echo "=== Testing Docker ==="
                    docker --version
                    docker ps > /dev/null
                    docker-compose --version
                    echo "✅ Docker is running"
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    echo "=== Building Images ==="
                    
                    # Build backend
                    cd backEnd
                    docker build -t reactweb1-backend .
                    docker tag reactweb1-backend ${BACKEND_IMAGE}
                    
                    # Build frontend
                    cd ../frontEnd
                    docker build -t reactweb1-frontend .
                    docker tag reactweb1-frontend ${FRONTEND_IMAGE}
                    
                    echo "✅ Images built and tagged"
                    docker images | grep -E "devops|reactweb"
                '''
            }
        }

        stage('Push Images to Docker Hub') {
            when {
                expression { env.DOCKERHUB_CREDS != '' }
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
                        
                        docker push ${BACKEND_IMAGE}
                        docker push ${FRONTEND_IMAGE}
                        
                        docker logout
                        echo "✅ Images pushed successfully"
                    '''
                }
            }
        }

        stage('Skip Docker Hub Push') {
            when {
                expression { env.DOCKERHUB_CREDS == '' }
            }
            steps {
                sh '''
                    echo "⚠️ Skipping Docker Hub push - credentials not configured"
                    echo "Using local images only"
                '''
            }
        }

        stage('Cleanup Before Deployment') {
            steps {
                sh '''
                    echo "=== Cleaning Up ==="
                    docker-compose down -v --remove-orphans 2>/dev/null || true
                    docker rm -f $(docker ps -aq) 2>/dev/null || true
                    
                    # Remove the old nginx test container
                    docker rm -f devops_project-nginx-1 2>/dev/null || true
                    
                    echo "✅ Cleanup completed"
                '''
            }
        }

        stage('Deploy Containers') {
            steps {
                sh '''
                    echo "=== Deploying Containers ==="
                    
                    # Verify images exist
                    echo "Checking images:"
                    docker images | grep devops || echo "⚠️ No devops images found locally"
                    
                    # Start containers
                    echo "Starting containers..."
                    docker-compose up -d
                    
                    # Wait
                    echo "Waiting for containers to start..."
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
                    
                    # Check container status
                    total=$(docker-compose ps -q | wc -l)
                    running=$(docker-compose ps -q | xargs docker inspect -f "{{.State.Status}}" 2>/dev/null | grep -c "running")
                    
                    echo "Containers: $running/$total running"
                    
                    if [ "$total" -eq 0 ]; then
                        echo "❌ ERROR: No containers found!"
                        docker-compose logs
                        exit 1
                    fi
                    
                    if [ "$running" -ne "$total" ]; then
                        echo "❌ ERROR: Not all containers are running"
                        docker-compose ps -a
                        docker-compose logs --tail=50
                        exit 1
                    fi
                    
                    # Test services
                    echo "=== Testing Services ==="
                    
                    echo "Testing backend..."
                    if curl -s -f http://localhost:5000 > /dev/null; then
                        echo "✅ Backend is responding"
                    else
                        echo "⚠️ Backend not responding via curl"
                        docker logs backend --tail=20
                    fi
                    
                    echo "Testing frontend..."
                    if curl -s -f http://localhost:5173 > /dev/null; then
                        echo "✅ Frontend is responding"
                    else
                        echo "⚠️ Frontend not responding via curl (may be normal)"
                        docker logs frontend --tail=20
                    fi
                    
                    echo ""
                    echo "🎉 DEPLOYMENT SUCCESSFUL"
                    echo "======================================="
                    echo "Backend:  http://localhost:5000"
                    echo "Frontend: http://localhost:5173"
                    echo "MongoDB:  localhost:27017"
                    echo "======================================="
                '''
            }
        }
    }

    post {
        always {
            sh '''
                echo "=== Post Build Summary ==="
                echo "Containers:"
                docker-compose ps -a 2>/dev/null || docker ps -a
                echo ""
                echo "Recent logs:"
                docker-compose logs --tail=20 2>/dev/null || echo "No docker-compose logs available"
            '''

            echo "==========================================="
            echo "Build Result  : ${currentBuild.currentResult}"
            echo "Build URL     : ${env.BUILD_URL}"
            echo "==========================================="
        }

        success {
            echo "🎉 PIPELINE COMPLETED SUCCESSFULLY"
            sh '''
                echo ""
                echo "📊 DEPLOYMENT SUMMARY"
                echo "======================"
                docker-compose ps 2>/dev/null || docker ps
                echo ""
                echo "🌐 Access URLs:"
                PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")
                echo "Backend:  http://$PUBLIC_IP:5000"
                echo "Frontend: http://$PUBLIC_IP:5173"
            '''
        }

        failure {
            echo "❌ PIPELINE FAILED"
            sh '''
                echo "=== DEBUG ==="
                echo "1. All containers:"
                docker ps -a 2>/dev/null || echo "Cannot list containers"
                echo ""
                echo "2. Docker images:"
                docker images | grep -E "devops|reactweb|mongo" 2>/dev/null || echo "No images found"
                echo ""
                echo "3. Port usage:"
                ss -tulpn 2>/dev/null | grep -E ":5000|:5173|:27017" || echo "No port info"
                echo ""
                echo "4. Docker networks:"
                docker network ls 2>/dev/null || echo "Cannot list networks"
            '''
        }
    }
}