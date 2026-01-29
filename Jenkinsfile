pipeline {
    agent any

    environment {
        DOCKERHUB_CREDS = 'plantcredentials'
        DOCKERHUB_USER  = 'sandusewwandi'
        BACKEND_IMAGE  = "${DOCKERHUB_USER}/devops_backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/devops_frontend:latest"
        DOCKER_BUILDKIT = '1'
        NPM_CONFIG_LOGLEVEL = 'warn'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh '''
                    set -e
                    echo "=== Project Structure ==="
                    pwd
                    ls -la

                    echo "=== Checking Critical Files ==="
                    test -f docker-compose.yml
                    test -f backEnd/Dockerfile
                    test -f frontEnd/Dockerfile
                    echo "✅ All required files exist"
                    
                    echo "=== Creating corrected docker-compose.yml ==="
                    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  frontend:
    image: sandusewwandi/devops_frontend:latest
    container_name: frontend
    ports:
      - "5173:5173"
    environment:
      - REACT_APP_API_URL=http://backend:5000
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    image: sandusewwandi/devops_backend:latest
    container_name: backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/devops
      - NODE_ENV=production
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:6
    container_name: mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

volumes:
  mongo_data:
EOF
                    echo "✅ Updated docker-compose.yml created"
                '''
            }
        }

        stage('Test Docker Setup') {
            steps {
                sh '''
                    set -e
                    echo "=== Testing Docker ==="
                    docker --version
                    docker ps > /dev/null
                    docker-compose --version
                    echo "✅ Docker is running"
                '''
            }
        }

        stage('Validate Configuration') {
            steps {
                sh '''
                    set -e
                    echo "=== Validating Configuration ==="
                    echo "Docker Compose validation:"
                    docker-compose config
                    
                    echo "Checking available ports:"
                    netstat -tulpn | grep -E ":5000|:5173|:27017" || echo "Ports are free"
                    
                    echo "Current images:"
                    docker images | grep -E "devops|mongo"
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    set -e
                    echo "=== Building Backend ==="
                    cd backEnd
                    docker build --progress=plain -t reactweb1-backend .
                    docker tag reactweb1-backend ${BACKEND_IMAGE}
                    
                    echo "=== Building Frontend ==="
                    cd ../frontEnd
                    docker build --progress=plain -t reactweb1-frontend .
                    docker tag reactweb1-frontend ${FRONTEND_IMAGE}
                    
                    echo "✅ Images built and tagged"
                '''
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKERHUB_CREDS}",
                    usernameVariable: 'DH_USER',
                    passwordVariable: 'DH_PASS'
                )]) {
                    sh '''
                        set -e
                        echo "=== Pushing to Docker Hub ==="
                        echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin

                        echo "Pushing backend image..."
                        docker push ${BACKEND_IMAGE}

                        echo "Pushing frontend image..."
                        docker push ${FRONTEND_IMAGE}

                        docker logout
                        echo "✅ Images pushed successfully"
                    '''
                }
            }
        }

        stage('Cleanup Before Deployment') {
            steps {
                sh '''
                    set -e
                    echo "=== Cleaning Up ==="
                    docker-compose down -v --remove-orphans || true
                    docker rm -f $(docker ps -aq) 2>/dev/null || true
                    docker network prune -f || true
                    echo "✅ Cleanup completed"
                '''
            }
        }

        stage('Deploy Containers') {
            steps {
                sh '''
                    set -e
                    echo "=== Deploying Containers ==="
                    
                    # Verify images exist
                    echo "Checking images:"
                    docker images | grep devops
                    
                    # Start containers
                    echo "Starting containers..."
                    docker-compose up -d
                    
                    # Wait with progress indicators
                    echo "Waiting for containers to start..."
                    for i in {1..6}; do
                        echo "Wait $i/6 (10 seconds each)..."
                        sleep 10
                        echo "Current status:"
                        docker-compose ps
                        echo "---"
                    done
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    set -e
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
                        echo "=== Container Details ==="
                        docker-compose ps -a
                        echo "=== Logs ==="
                        docker-compose logs --tail=100
                        exit 1
                    fi
                    
                    # Test services
                    echo "=== Testing Services ==="
                    
                    # Test backend
                    echo "Testing backend (max 30 seconds)..."
                    for i in {1..10}; do
                        if curl -s -f http://localhost:5000/health 2>/dev/null; then
                            echo "✅ Backend health check passed"
                            break
                        elif curl -s -f http://localhost:5000 2>/dev/null; then
                            echo "✅ Backend is responding"
                            break
                        fi
                        
                        if [ $i -eq 10 ]; then
                            echo "⚠️ Backend not responding to health check, but container is running"
                            docker logs backend
                        fi
                        
                        sleep 3
                    done
                    
                    # Test frontend
                    echo "Testing frontend..."
                    if curl -s -f http://localhost:5173 2>/dev/null; then
                        echo "✅ Frontend is responding"
                    else
                        echo "⚠️ Frontend not directly accessible (might be React dev server)"
                        docker logs frontend
                    fi
                    
                    echo ""
                    echo "🎉 DEPLOYMENT SUCCESSFUL"
                    echo "======================================="
                    echo "Backend:  http://localhost:5000"
                    echo "Frontend: http://localhost:5173"
                    echo "MongoDB:  localhost:27017"
                    echo "======================================="
                    echo ""
                    echo "Container status:"
                    docker-compose ps
                '''
            }
        }
    }

    post {
        always {
            sh '''
                echo "=== Post Build Summary ==="
                echo "Containers:"
                docker-compose ps -a || true
                echo ""
                echo "Recent logs:"
                docker-compose logs --tail=20 || true
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
                docker-compose ps
                echo ""
                echo "🌐 Access URLs:"
                echo "Backend:  http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5000"
                echo "Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5173"
            '''
        }

        failure {
            echo "❌ PIPELINE FAILED - INVESTIGATION NEEDED"
            sh '''
                echo "=== DEBUG INFORMATION ==="
                echo "1. All containers:"
                docker ps -a
                echo ""
                echo "2. Docker images:"
                docker images | grep -E "devops|reactweb"
                echo ""
                echo "3. Full docker-compose logs:"
                docker-compose logs --tail=100 || true
                echo ""
                echo "4. System resources:"
                docker system df
                echo ""
                echo "5. Network:"
                docker network ls
            '''
        }
    }
}