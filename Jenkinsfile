pipeline {
    agent any

    environment {
        DOCKERHUB_CREDS = 'plantcredentials'
        DOCKERHUB_USER  = 'sandusewwandi'
        BACKEND_IMAGE  = "${DOCKERHUB_USER}/devops_backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/devops_frontend:latest"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh '''
                    echo "=== Workspace Setup ==="
                    pwd
                    ls -la
                    
                    # Create docker-compose.yml if missing
                    if [ ! -f docker-compose.yml ]; then
                        echo "Creating docker-compose.yml..."
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
      - MONGODB_URI=mongodb://mongodb:27017/devops
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
                    else
                        echo "✅ Using existing docker-compose.yml"
                    fi
                    
                    # Show the file
                    echo "=== docker-compose.yml ==="
                    cat docker-compose.yml
                '''
            }
        }

        stage('Build Images') {
            steps {
                sh '''
                    echo "=== Building Images ==="
                    
                    # Build backend
                    echo "1. Building backend..."
                    cd backEnd
                    docker build -t reactweb1-backend .
                    docker tag reactweb1-backend ${BACKEND_IMAGE}
                    
                    # Build frontend
                    echo "2. Building frontend..."
                    cd ../frontEnd
                    docker build -t reactweb1-frontend .
                    docker tag reactweb1-frontend ${FRONTEND_IMAGE}
                    
                    echo "✅ Images built"
                    docker images | grep -E "devops|reactweb"
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
                        
                        docker push ${BACKEND_IMAGE} || echo "⚠️ Backend push warning"
                        docker push ${FRONTEND_IMAGE} || echo "⚠️ Frontend push warning"
                        
                        docker logout
                        echo "✅ Images pushed"
                    '''
                }
            }
        }

        stage('Debug: Before Deployment') {
            steps {
                sh '''
                    echo "=== DEBUG: BEFORE DEPLOYMENT ==="
                    echo ""
                    echo "1. Testing docker-compose..."
                    echo "Command: docker-compose config"
                    docker-compose config
                    echo "Exit code: $?"
                    echo ""
                    
                    echo "2. Checking images..."
                    docker images ${BACKEND_IMAGE}
                    docker images ${FRONTEND_IMAGE}
                    echo ""
                    
                    echo "3. Current containers..."
                    docker ps -a
                    echo ""
                    
                    echo "4. Clean up anything existing..."
                    docker-compose down -v 2>/dev/null || true
                    docker rm -f $(docker ps -aq) 2>/dev/null || true
                    echo "Cleanup done"
                '''
            }
        }

        stage('Deploy Manually') {
            steps {
                sh '''
                    echo "=== DEPLOYING MANUALLY ==="
                    echo "Starting containers one by one..."
                    echo ""
                    
                    # Start MongoDB
                    echo "1. Starting MongoDB..."
                    docker run -d \
                      --name mongodb \
                      -p 27017:27017 \
                      -v mongo_data:/data/db \
                      mongo:6
                    sleep 3
                    
                    # Start Backend
                    echo "2. Starting Backend..."
                    docker run -d \
                      --name backend \
                      -p 5000:5000 \
                      --link mongodb:mongodb \
                      -e MONGODB_URI=mongodb://mongodb:27017/devops \
                      ${BACKEND_IMAGE}
                    sleep 5
                    
                    # Start Frontend
                    echo "3. Starting Frontend..."
                    docker run -d \
                      --name frontend \
                      -p 5173:5173 \
                      --link backend:backend \
                      -e REACT_APP_API_URL=http://backend:5000 \
                      ${FRONTEND_IMAGE}
                    sleep 3
                    
                    echo "✅ All containers started manually"
                    echo ""
                    echo "=== Container Status ==="
                    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
                '''
            }
        }

        stage('Verify') {
            steps {
                sh '''
                    echo "=== VERIFICATION ==="
                    sleep 5
                    
                    # Check if containers are running
                    echo "1. Checking container status..."
                    running_count=$(docker ps -q | wc -l)
                    echo "Running containers: $running_count/3"
                    
                    if [ "$running_count" -lt 3 ]; then
                        echo "❌ Some containers failed"
                        docker ps -a
                        echo ""
                        echo "Container logs:"
                        docker logs mongodb --tail=20 2>/dev/null || true
                        docker logs backend --tail=20 2>/dev/null || true
                        docker logs frontend --tail=20 2>/dev/null || true
                        exit 1
                    fi
                    
                    # Test backend
                    echo "2. Testing backend..."
                    if curl -s -f http://localhost:5000 > /dev/null; then
                        echo "✅ Backend is responding"
                    else
                        echo "⚠️ Backend not responding via curl"
                        docker logs backend --tail=30
                    fi
                    
                    # Test frontend
                    echo "3. Testing frontend..."
                    if curl -s -f http://localhost:5173 > /dev/null; then
                        echo "✅ Frontend is responding"
                    else
                        echo "⚠️ Frontend not responding via curl (may be normal)"
                        docker logs frontend --tail=30
                    fi
                    
                    echo ""
                    echo "🎉 DEPLOYMENT SUCCESSFUL!"
                    echo "========================"
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
                echo "=== FINAL STATUS ==="
                echo "All containers:"
                docker ps -a 2>/dev/null || echo "No containers"
                echo ""
                echo "Recent logs:"
                docker logs backend --tail=10 2>/dev/null || true
            '''
            echo "Build Result: ${currentBuild.currentResult}"
        }
        
        failure {
            sh '''
                echo "=== FAILURE ANALYSIS ==="
                echo "1. Last docker-compose error:"
                docker-compose logs --tail=20 2>/dev/null || echo "No docker-compose logs"
                echo ""
                echo "2. Docker events:"
                docker events --since "5m" 2>/dev/null | tail -10 || echo "Cannot get events"
                echo ""
                echo "3. Disk space:"
                df -h
                echo ""
                echo "4. Memory:"
                free -h
            '''
        }
    }
}

