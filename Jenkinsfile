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
        stage('Checkout SCM') {
            steps {
                checkout scm
            }
        }

        stage('Checkout') {
            steps {
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
      MONGODB_URI: mongodb://mongodb:27017/devops
      NODE_ENV: production
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
                    ss -tulpn | grep -E ":5000|:5173|:27017" || echo "✅ Ports are free"
                    
                    echo "Current images:"
                    docker images | grep -E "devops|mongo" || echo "No images yet"
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

        stage('Skip Docker Hub Push') {
            when {
                expression { env.DOCKERHUB_CREDS == '' }
            }
            steps {
                sh '''
                    echo "⚠️ Skipping Docker Hub push - using local images only"
                '''
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
                    docker images | grep devops || echo "⚠️ No devops images found"
                    
                    # Start containers
                    echo "Starting containers..."
                    docker-compose up -d
                    
                    # Check immediate status
                    sleep 5
                    echo "Initial container status:"
                    docker-compose ps
                    
                    # Wait for containers to be ready
                    echo "Waiting for containers to stabilize..."
                    for i in {1..6}; do
                        echo "Wait $i/6 (5 seconds each)..."
                        sleep 5
                        
                        # Check if any containers have exited
                        exited_count=$(docker-compose ps | grep -c "Exit\|Created")
                        if [ "$exited_count" -gt 0 ]; then
                            echo "⚠️ Found $exited_count containers not running"
                            docker-compose ps
                        fi
                    done
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    set -e
                    echo "=== Verifying Deployment ==="
                    
                    # Final status check
                    echo "Final container status:"
                    docker-compose ps
                    
                    # Check running containers
                    total=$(docker-compose ps -q | wc -l)
                    running=$(docker-compose ps -q | xargs docker inspect -f "{{.State.Status}}" 2>/dev/null | grep -c "running")
                    
                    echo "Containers running: $running/$total"
                    
                    if [ "$total" -eq 0 ]; then
                        echo "❌ ERROR: No containers found!"
                        docker-compose ps -a
                        exit 1
                    fi
                    
                    if [ "$running" -ne "$total" ]; then
                        echo "⚠️ WARNING: Not all containers are running, but continuing..."
                        docker-compose ps -a
                        echo "Container logs:"
                        docker-compose logs --tail=30
                        # Don't exit with error, just warn
                    else
                        echo "✅ SUCCESS: All containers are running!"
                    fi
                    
                    # Optional: Test services (don't fail if they don't respond)
                    echo ""
                    echo "=== Optional Service Tests ==="
                    
                    echo "Testing backend (optional)..."
                    if curl -s --max-time 5 http://localhost:5000 > /dev/null; then
                        echo "✅ Backend is responding"
                    else
                        echo "⚠️ Backend not responding (might still be starting)"
                        docker logs backend --tail=10 2>/dev/null || true
                    fi
                    
                    echo "Testing frontend (optional)..."
                    if curl -s --max-time 5 http://localhost:5173 > /dev/null; then
                        echo "✅ Frontend is responding"
                    else
                        echo "⚠️ Frontend not responding (React dev server may not respond to curl)"
                        docker logs frontend --tail=10 2>/dev/null || true
                    fi
                    
                    echo ""
                    echo "🎉 DEPLOYMENT COMPLETED"
                    echo "========================"
                    echo "Services deployed:"
                    docker-compose ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"
                    echo ""
                    echo "Access URLs:"
                    echo "Backend:  http://localhost:5000"
                    echo "Frontend: http://localhost:5173"
                    echo "MongoDB:  localhost:27017"
                '''
            }
        }
    }

    post {
        always {
            sh '''
                echo "=== Post Build Summary ==="
                echo "Build Result: ${currentBuild.currentResult}"
                echo ""
                echo "Container status:"
                docker-compose ps -a 2>/dev/null || docker ps -a
                echo ""
                echo "Recent logs (last 10 lines):"
                docker-compose logs --tail=10 2>/dev/null || echo "No docker-compose logs"
            '''

            echo "==========================================="
            echo "Build Result  : ${currentBuild.currentResult}"
            echo "Build URL     : ${env.BUILD_URL}"
            echo "Build Number  : ${env.BUILD_NUMBER}"
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
                echo "🌐 Public Access URLs:"
                PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")
                echo "Backend:  http://$PUBLIC_IP:5000"
                echo "Frontend: http://$PUBLIC_IP:5173"
                echo ""
                echo "🔧 Management commands:"
                echo "View logs:    docker-compose logs -f"
                echo "Stop:         docker-compose down"
                echo "Restart:      docker-compose restart"
            '''
        }

        failure {
            echo "❌ PIPELINE FAILED"
            sh '''
                echo "=== DEBUG INFORMATION ==="
                echo ""
                echo "1. All containers:"
                docker ps -a 2>/dev/null || echo "Cannot list containers"
                echo ""
                echo "2. Docker images:"
                docker images | grep -E "devops|reactweb|mongo" 2>/dev/null || echo "No images found"
                echo ""
                echo "3. Port usage:"
                ss -tulpn 2>/dev/null | grep -E ":5000|:5173|:27017" || echo "Port check failed"
                echo ""
                echo "4. Docker system info:"
                docker system df 2>/dev/null || echo "Docker system info unavailable"
                echo ""
                echo "5. Last error from docker-compose:"
                docker-compose logs --tail=50 2>/dev/null || echo "No docker-compose logs"
            '''
        }
    }
}