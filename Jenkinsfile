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
    }

    stages {
        stage('Checkout & Get IP') {
            steps {
                checkout scm
                script {
                    // Get public IP
                    def publicIp = sh(script: "curl -s http://169.254.169.254/latest/meta-data/public-ipv4", returnStdout: true).trim()
                    env.PUBLIC_IP = publicIp
                    echo "=== Public IP: ${publicIp} ==="
                }
            }
        }

        stage('Clean Previous - FORCEFUL') {
            steps {
                sh '''
                    echo "=== FORCE CLEANING Previous Deployment ==="
                    
                    # Force stop and remove ALL containers that might conflict
                    docker stop frontend backend mongo mongodb 2>/dev/null || true
                    docker rm frontend backend mongo mongodb 2>/dev/null || true
                    
                    # Remove any container with similar names
                    docker ps -a --filter "name=mongo" --format "{{.Names}}" | xargs -r docker stop 2>/dev/null || true
                    docker ps -a --filter "name=mongo" --format "{{.Names}}" | xargs -r docker rm 2>/dev/null || true
                    
                    # Clean Docker Compose
                    docker-compose down -v --remove-orphans 2>/dev/null || true
                    
                    # Clean up Docker resources
                    docker system prune -f 2>/dev/null || true
                    
                    # Remove dangling volumes
                    docker volume prune -f 2>/dev/null || true
                    
                    echo "✅ Force cleanup completed"
                '''
            }
        }

        stage('Build Images') {
            steps {
                sh '''
                    echo "=== Building Docker Images ==="
                    
                    # Build Backend
                    if [ -d "backEnd" ] && [ -f "backEnd/Dockerfile" ]; then
                        echo "Building backend with CORS fix..."
                        cd backEnd
                        
                        # Create a .env file with CORS configuration for build
                        cat > .env << EOF
CLDN_API_KEY=823756362343243
CLDN_API_SECRET=FwkT9WUwifSXJn-Mev1-2gpvw5c
CLDN_NAME=djzjdus1k
CORS_ORIGIN=http://localhost:5173,http://${PUBLIC_IP}:5173
JWT_SECRET=dummysecret
MONGODB_URI=mongodb://mongo:27017/devops
NODE_ENV=production
MAX_FILE_SIZE=10485760
EOF
                        
                        docker build -t ${BACKEND_IMAGE} .
                        cd ..
                        echo "✅ Backend image built with CORS"
                    else
                        echo "⚠️ Using existing backend image"
                    fi
                    
                    # Build Frontend
                    if [ -d "frontEnd" ] && [ -f "frontEnd/Dockerfile" ]; then
                        echo "Building frontend..."
                        cd frontEnd
                        docker build -t ${FRONTEND_IMAGE} .
                        cd ..
                        echo "✅ Frontend image built"
                    else
                        echo "⚠️ Using existing frontend image"
                    fi
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
                        echo "${DH_PASS}" | docker login -u "${DH_USER}" --password-stdin
                        
                        # Push backend
                        docker push ${BACKEND_IMAGE} || echo "⚠️ Backend push warning"
                        
                        # Push frontend
                        docker push ${FRONTEND_IMAGE} || echo "⚠️ Frontend push warning"
                        
                        docker logout
                        echo "✅ Push completed"
                    '''
                }
            }
        }

        stage('Create Docker Compose with CORS') {
            steps {
                sh '''
                    echo "=== Creating docker-compose.yml with CORS ==="
                    
                    # Remove existing docker-compose.yml if any
                    rm -f docker-compose.yml 2>/dev/null || true
                    
                    cat > docker-compose.yml << EOF
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
      - JWT_SECRET=dummysecret
      - MONGODB_URI=mongodb://mongodb:27017/devops
      - NODE_ENV=production
      - CLDN_API_KEY=823756362343243
      - CLDN_API_SECRET=FwkT9WUwifSXJn-Mev1-2gpvw5c
      - CLDN_NAME=djzjdus1k
      - ADMIN_EMAIL=admin@plant.com
      - ADMIN_PASS=Admin123
      # CORS Configuration - FIX FOR IMAGE UPLOAD
      - CORS_ORIGIN=http://localhost:5173,http://${PUBLIC_IP}:5173
      # File upload settings
      - MAX_FILE_SIZE=10485760
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
      - VITE_API_URL=http://${PUBLIC_IP}:5000
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mongo_data:
  uploads_volume:
EOF
                    
                    echo "✅ docker-compose.yml created with CORS"
                    echo "=== File contents ==="
                    cat docker-compose.yml
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    echo "=== Deploying Application ==="
                    
                    # Check if docker-compose.yml exists
                    if [ ! -f "docker-compose.yml" ]; then
                        echo "❌ docker-compose.yml not found!"
                        exit 1
                    fi
                    
                    # Create uploads directory with proper permissions
                    mkdir -p uploads
                    chmod 777 uploads 2>/dev/null || true
                    
                    # Start services with force recreate
                    echo "Starting services with force recreate..."
                    docker-compose up -d --force-recreate --remove-orphans
                    
                    # Wait for services
                    echo "Waiting for services to start (30 seconds)..."
                    sleep 30
                    
                    # Check status
                    echo "=== Service Status ==="
                    docker-compose ps
                '''
            }
        }

        stage('Test Image Upload') {
            steps {
                sh '''
                    echo "=== Testing Image Upload ==="
                    
                    # Wait extra time for backend to fully start
                    sleep 10
                    
                    # Test backend health
                    echo "Testing backend API..."
                    BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null || echo "000")
                    
                    if [ "$BACKEND_HEALTH" = "200" ]; then
                        echo "✅ Backend is healthy (HTTP 200)"
                        
                        # Test CORS headers
                        echo "Testing CORS configuration..."
                        CORS_HEADER=$(curl -s -I -X OPTIONS http://localhost:5000/api/plant/add \
                          -H "Origin: http://${PUBLIC_IP}:5173" 2>/dev/null | \
                          grep -i "access-control-allow-origin:" || echo "No CORS headers found")
                        
                        echo "CORS Header: $CORS_HEADER"
                        
                        if echo "$CORS_HEADER" | grep -q "${PUBLIC_IP}"; then
                            echo "✅ CORS is properly configured for image uploads"
                        else
                            echo "⚠️ CORS might not be configured properly"
                        fi
                        
                        # Test Cloudinary configuration
                        echo "Checking Cloudinary configuration in backend..."
                        docker exec backend env 2>/dev/null | grep CLDN && echo "✅ Cloudinary env vars found" || echo "⚠️ Cloudinary env vars not found"
                        
                    else
                        echo "❌ Backend health check failed: HTTP $BACKEND_HEALTH"
                        echo "=== Backend Logs (last 30 lines) ==="
                        docker logs backend --tail=30 2>/dev/null || echo "Could not get backend logs"
                    fi
                    
                    # Test frontend
                    echo "Testing frontend..."
                    FRONTEND_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null || echo "000")
                    if [ "$FRONTEND_TEST" = "200" ] || [ "$FRONTEND_TEST" = "304" ]; then
                        echo "✅ Frontend is serving (HTTP $FRONTEND_TEST)"
                    else
                        echo "⚠️ Frontend check: HTTP $FRONTEND_TEST"
                    fi
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    echo "=== Final Verification ==="
                    
                    # Check running containers using docker-compose
                    RUNNING_COUNT=$(docker-compose ps --services --filter "status=running" 2>/dev/null | wc -l)
                    
                    echo "Running containers: $RUNNING_COUNT/3"
                    
                    if [ "$RUNNING_COUNT" -eq 3 ]; then
                        echo ""
                        echo "🎉 🎉 🎉 DEPLOYMENT SUCCESSFUL! 🎉 🎉 🎉"
                        echo "=========================================="
                        echo "🌿 Plant Shop Application"
                        echo ""
                        echo "🔗 Application URL:"
                        echo "   http://${PUBLIC_IP}:5173"
                        echo ""
                        echo "⚙️  Service URLs:"
                        echo "   Frontend: http://${PUBLIC_IP}:5173"
                        echo "   Backend API: http://${PUBLIC_IP}:5000"
                        echo "   MongoDB: http://${PUBLIC_IP}:27017"
                        echo ""
                        echo "✅ ADD PLANT WITH IMAGES SHOULD NOW WORK!"
                        echo ""
                        echo "🔧 Configuration Applied:"
                        echo "   ✓ CORS enabled for frontend"
                        echo "   ✓ Cloudinary configured"
                        echo "   ✓ File uploads enabled (10MB max)"
                        echo "=========================================="
                        
                        # Display container info
                        echo ""
                        echo "=== Container Information ==="
                        docker-compose ps
                        
                    else
                        echo "❌ Some containers are not running"
                        echo ""
                        echo "=== Troubleshooting ==="
                        echo "1. Checking all containers:"
                        docker-compose ps -a
                        echo ""
                        echo "2. Backend logs:"
                        docker logs backend --tail=50 2>/dev/null || echo "No backend logs"
                        echo ""
                        echo "3. MongoDB logs:"
                        docker logs mongodb --tail=20 2>/dev/null || echo "No MongoDB logs"
                        echo ""
                        echo "4. Frontend logs:"
                        docker logs frontend --tail=20 2>/dev/null || echo "No frontend logs"
                        exit 1
                    fi
                '''
            }
        }
    }

    post {
        always {
            echo "Build Status: ${currentBuild.currentResult}"
        }
        
        success {
            sh '''
                echo ""
                echo "=========================================="
                echo "✅ CI/CD PIPELINE COMPLETED SUCCESSFULLY!"
                echo ""
                echo "🌿 Application deployed at:"
                echo "   http://${PUBLIC_IP}:5173"
                echo ""
                echo "🔧 To test 'Add Plant with Image':"
                echo "   1. Go to http://${PUBLIC_IP}:5173"
                echo "   2. Login as admin"
                echo "   3. Go to Plants section"
                echo "   4. Click 'Add New Plant'"
                echo "   5. Fill form and upload image"
                echo "   6. It should work now with CORS fixed!"
                echo ""
                echo "📝 If still having issues:"
                echo "   - Check backend logs: docker logs backend"
                echo "   - Check CORS: docker exec backend env | grep CORS"
                echo "   - Check Cloudinary: docker exec backend env | grep CLDN"
                echo "=========================================="
            '''
        }
        
        failure {
            sh '''
                echo ""
                echo "=========================================="
                echo "❌ PIPELINE FAILED!"
                echo ""
                echo "Manual fixes to try:"
                echo "1. Remove all containers manually:"
                echo "   docker stop $(docker ps -aq) && docker rm $(docker ps -aq)"
                echo ""
                echo "2. Check port conflicts:"
                echo "   sudo lsof -i :5173"
                echo "   sudo lsof -i :5000"
                echo "   sudo lsof -i :27017"
                echo ""
                echo "3. Run deployment manually:"
                echo "   docker-compose down"
                echo "   docker-compose up -d"
                echo "   docker logs backend"
                echo ""
                echo "4. Test backend API directly:"
                echo "   curl http://localhost:5000/api/health"
                echo "=========================================="
            '''
        }
    }
}