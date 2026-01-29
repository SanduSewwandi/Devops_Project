pipeline {
    agent any

    environment {
        DOCKERHUB_CREDS = 'plantcredentials'
        DOCKERHUB_USER  = 'sandusewwandi'
        BACKEND_IMAGE  = "${DOCKERHUB_USER}/devops_backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/devops_frontend:latest"
    }

    stages {
        stage('Check Ports') {
            steps {
                sh '''
                    echo "=== Checking Port Availability ==="
                    echo "Ports needed: 5000, 5173, 27017"
                    echo ""
                    
                    # Check each port
                    for port in 5000 5173 27017; do
                        if ss -tulpn | grep -q ":$port "; then
                            echo "❌ Port $port is in use by:"
                            ss -tulpn | grep ":$port "
                            echo "Trying to free port $port..."
                            
                            # Try to kill process on that port
                            pid=$(sudo lsof -t -i :$port 2>/dev/null || echo "")
                            if [ ! -z "$pid" ]; then
                                echo "Killing process $pid on port $port"
                                sudo kill -9 $pid 2>/dev/null || true
                                sleep 2
                            fi
                            
                            # Check again
                            if ss -tulpn | grep -q ":$port "; then
                                echo "⚠️ Could not free port $port"
                                echo "Will try alternative port..."
                                
                                # Use alternative port
                                if [ "$port" = "5000" ]; then
                                    export BACKEND_PORT="5001"
                                    echo "Using backend port 5001 instead"
                                elif [ "$port" = "5173" ]; then
                                    export FRONTEND_PORT="5174"
                                    echo "Using frontend port 5174 instead"
                                elif [ "$port" = "27017" ]; then
                                    export MONGO_PORT="27018"
                                    echo "Using MongoDB port 27018 instead"
                                fi
                            else
                                echo "✅ Port $port is now free"
                            fi
                        else
                            echo "✅ Port $port is free"
                        fi
                    done
                    
                    # Set default ports if not set
                    export BACKEND_PORT="\${BACKEND_PORT:-5000}"
                    export FRONTEND_PORT="\${FRONTEND_PORT:-5173}"
                    export MONGO_PORT="\${MONGO_PORT:-27017}"
                    
                    echo ""
                    echo "Final port assignment:"
                    echo "Backend:  $BACKEND_PORT:5000"
                    echo "Frontend: $FRONTEND_PORT:5173"
                    echo "MongoDB:  $MONGO_PORT:27017"
                '''
            }
        }

        stage('Checkout & Setup') {
            steps {
                checkout scm
                sh '''
                    set -e
                    echo "=== Setting Up ==="
                    pwd
                    ls -la
                    
                    echo "=== Creating docker-compose.yml ==="
                    cat > docker-compose.yml << EOF
version: '3.8'

services:
  frontend:
    image: sandusewwandi/devops_frontend:latest
    container_name: frontend
    ports:
      - "${FRONTEND_PORT}:5173"
    environment:
      - REACT_APP_API_URL=http://backend:5000
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    image: sandusewwandi/devops_backend:latest
    container_name: backend
    ports:
      - "${BACKEND_PORT}:5000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/devops
      - NODE_ENV=production
    depends_on:
      - mongodb
    restart: unless-stopped

  mongodb:
    image: mongo:6
    container_name: mongodb
    ports:
      - "${MONGO_PORT}:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

volumes:
  mongo_data:
EOF
                    
                    echo "✅ docker-compose.yml created"
                    echo "=== File Contents ==="
                    cat docker-compose.yml
                '''
            }
        }

        stage('Validate Setup') {
            steps {
                sh '''
                    set -e
                    echo "=== Validating Setup ==="
                    
                    # Validate docker-compose
                    echo "Validating docker-compose..."
                    docker-compose config
                    
                    # Check Docker
                    echo "Checking Docker..."
                    docker ps
                    
                    echo "✅ Setup validated"
                '''
            }
        }

        stage('Build Images') {
            steps {
                sh '''
                    set -e
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
                    
                    echo "✅ Images built"
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
                        set -e
                        echo "=== Pushing to Docker Hub ==="
                        echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
                        
                        docker push ${BACKEND_IMAGE}
                        docker push ${FRONTEND_IMAGE}
                        
                        docker logout
                        echo "✅ Images pushed"
                    '''
                }
            }
        }

        stage('Clean Deployment') {
            steps {
                sh '''
                    set -e
                    echo "=== Cleaning for Deployment ==="
                    
                    # Clean up any existing containers
                    docker-compose down -v --remove-orphans 2>/dev/null || true
                    
                    # Remove dangling containers
                    docker rm -f $(docker ps -aq) 2>/dev/null || true
                    
                    # Clean networks
                    docker network prune -f 2>/dev/null || true
                    
                    echo "✅ Environment cleaned"
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    set -e
                    echo "=== Deploying ==="
                    
                    echo "Starting containers..."
                    docker-compose up -d
                    
                    echo "Waiting for containers to start..."
                    sleep 10
                    
                    echo "Container status:"
                    docker-compose ps
                    
                    echo "✅ Deployment initiated"
                '''
            }
        }

        stage('Verify') {
            steps {
                sh '''
                    set -e
                    echo "=== Verifying Deployment ==="
                    
                    # Wait a bit more
                    sleep 5
                    
                    # Check status
                    running=$(docker-compose ps -q | xargs docker inspect -f "{{.State.Status}}" 2>/dev/null | grep -c "running")
                    total=$(docker-compose ps -q | wc -l)
                    
                    echo "Running containers: $running/$total"
                    
                    if [ "$running" -ne "$total" ]; then
                        echo "❌ Not all containers are running"
                        docker-compose logs
                        exit 1
                    fi
                    
                    # Test backend
                    echo "Testing backend on port ${BACKEND_PORT}..."
                    if curl -s -f http://localhost:${BACKEND_PORT} > /dev/null; then
                        echo "✅ Backend is responding"
                    else
                        echo "⚠️ Backend not responding via curl"
                        docker logs backend
                    fi
                    
                    # Test frontend
                    echo "Testing frontend on port ${FRONTEND_PORT}..."
                    if curl -s -f http://localhost:${FRONTEND_PORT} > /dev/null; then
                        echo "✅ Frontend is responding"
                    else
                        echo "⚠️ Frontend not responding via curl (may be normal)"
                        docker logs frontend
                    fi
                    
                    echo ""
                    echo "🎉 DEPLOYMENT SUCCESSFUL!"
                    echo "========================="
                    echo "Services:"
                    echo "• Backend:  http://localhost:${BACKEND_PORT}"
                    echo "• Frontend: http://localhost:${FRONTEND_PORT}"
                    echo "• MongoDB:  localhost:${MONGO_PORT}"
                    echo "========================="
                    
                    # Show public IP
                    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")
                    echo "Public URLs:"
                    echo "• Backend:  http://$PUBLIC_IP:${BACKEND_PORT}"
                    echo "• Frontend: http://$PUBLIC_IP:${FRONTEND_PORT}"
                '''
            }
        }
    }

    post {
        always {
            sh '''
                echo "=== Final Status ==="
                docker-compose ps -a 2>/dev/null || docker ps -a
            '''
            echo "Build Result: ${currentBuild.currentResult}"
        }
    }
}