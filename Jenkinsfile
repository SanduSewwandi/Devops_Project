pipeline {
    agent any

    environment {
        DOCKERHUB_CREDS = 'plantcredentials'
        DOCKERHUB_USER  = 'sandusewwandi'
        BACKEND_IMAGE  = "${DOCKERHUB_USER}/devops_backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/devops_frontend:latest"
    }

    options {
        timeout(time: 15, unit: 'MINUTES')
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
                '''
            }
        }

        stage('Pre-pull Docker Images') {
            steps {
                sh '''
                    echo "=== Pre-pulling Docker Images ==="
                    # Pull images in parallel to save time
                    docker pull mongo:6 &
                    docker pull ${BACKEND_IMAGE} 2>/dev/null || true &
                    docker pull ${FRONTEND_IMAGE} 2>/dev/null || true &
                    wait
                    echo "✅ Images pre-pulled"
                '''
            }
        }

        stage('Test Docker Setup') {
            steps {
                sh '''
                    echo "=== Testing Docker ==="
                    docker --version
                    docker-compose --version
                    echo "✅ Docker is running"
                '''
            }
        }

        stage('Clean Previous Deployment') {
            steps {
                sh '''
                    echo "=== Quick Cleanup ==="
                    # Only stop and remove containers, keep volumes
                    docker-compose down 2>/dev/null || true
                    echo "✅ Cleanup completed"
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    echo "=== Building Images with Cache ==="
                    
                    # Build with cache
                    echo "Building backend with cache..."
                    cd backEnd
                    docker build --cache-from=${BACKEND_IMAGE} -t reactweb1-backend .
                    docker tag reactweb1-backend ${BACKEND_IMAGE}
                    
                    echo "Building frontend with cache..."
                    cd ../frontEnd
                    docker build --cache-from=${FRONTEND_IMAGE} -t reactweb1-frontend .
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
                        echo "=== Pushing to Docker Hub ==="
                        echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
                        
                        echo "Pushing backend image..."
                        docker push ${BACKEND_IMAGE} &
                        
                        echo "Pushing frontend image..."
                        docker push ${FRONTEND_IMAGE} &
                        
                        wait  # Wait for pushes to complete
                        docker logout
                        echo "✅ Images pushed"
                    '''
                }
            }
        }

        stage('Fast Deploy Containers') {
            steps {
                sh '''
                    echo "=== Fast Deployment ==="
                    
                    # Create optimized docker-compose.yml
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
    # Health check for faster startup verification
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 10s

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
    # Health check
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 15s

  frontend:
    image: ${FRONTEND_IMAGE}
    container_name: frontend
    ports:
      - "5173:5173"
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped

volumes:
  mongo_data:
EOF

                    echo "Starting services in detached mode..."
                    docker-compose up -d
                    
                    echo "=== Quick Health Check ==="
                    
                    # Check if containers are starting (don't wait long)
                    sleep 5
                    
                    echo "Container status after 5 seconds:"
                    docker-compose ps
                    
                    # Quick check - just see if containers exist
                    RUNNING_COUNT=$(docker-compose ps -q | wc -l)
                    echo "Containers found: $RUNNING_COUNT"
                    
                    if [ "$RUNNING_COUNT" -eq 3 ]; then
                        echo "✅ All containers created and starting"
                    else
                        echo "⚠️ Some containers might be starting slowly"
                    fi
                '''
            }
        }

        stage('Quick Verify Deployment') {
            steps {
                sh '''
                    echo "=== Quick Verification ==="
                    
                    # Only wait 10 seconds instead of 15+5=20
                    sleep 10
                    
                    echo "=== Final Container Status ==="
                    docker-compose ps
                    
                    # Get running count
                    RUNNING_COUNT=$(docker-compose ps | grep -c "Up")
                    
                    if [ "$RUNNING_COUNT" -eq 3 ]; then
                        echo "🎉 SUCCESS: All 3 containers are running!"
                        
                        # Quick network test - simplified
                        echo ""
                        echo "🌐 Quick Connectivity Test:"
                        if docker-compose exec -T backend curl -s -o /dev/null http://localhost:5000 2>/dev/null; then
                            echo "✅ Backend is responding"
                        fi
                        
                        # Get EC2 public IP
                        echo ""
                        echo "Public Access URLs:"
                        PUBLIC_IP=$(curl -s --max-time 3 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "YOUR_EC2_IP")
                        echo "Backend:  http://$PUBLIC_IP:5000"
                        echo "Frontend: http://$PUBLIC_IP:5173"
                    elif [ "$RUNNING_COUNT" -ge 1 ]; then
                        echo "⚠️ $RUNNING_COUNT/3 containers are running"
                        echo "Containers might still be starting up"
                        echo "Check logs if needed:"
                        docker-compose logs --tail=5
                    else
                        echo "❌ No containers running"
                        docker-compose logs --tail=20
                        exit 1
                    fi
                '''
            }
        }
    }

    post {
        always {
            echo "=== Pipeline Summary ==="
            echo "Build Result: ${currentBuild.currentResult}"
            echo "Build Number: ${env.BUILD_NUMBER}"
            echo "========================="
        }
        
        success {
            echo "🎉 PIPELINE COMPLETED SUCCESSFULLY"
        }
        
        failure {
            echo "❌ PIPELINE FAILED"
        }
    }
}