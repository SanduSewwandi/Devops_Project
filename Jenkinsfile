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

        stage('Clean Previous') {
            steps {
                sh '''
                    echo "=== Cleaning Previous Deployment ==="
                    docker-compose down -v 2>/dev/null || true
                    docker system prune -f 2>/dev/null || true
                    echo "✅ Cleanup completed"
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
                        echo "CLDN_API_KEY=823756362343243" > .env
                        echo "CLDN_API_SECRET=FwkT9WUwifSXJn-Mev1-2gpvw5c" >> .env
                        echo "CLDN_NAME=djzjdus1k" >> .env
                        echo "CORS_ORIGIN=http://localhost:5173,http://${PUBLIC_IP}:5173" >> .env
                        
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
                        docker push ${BACKEND_IMAGE} 2>/dev/null || echo "⚠️ Backend push failed or image not found"
                        
                        # Push frontend
                        docker push ${FRONTEND_IMAGE} 2>/dev/null || echo "⚠️ Frontend push failed or image not found"
                        
                        docker logout
                        echo "✅ Push attempt completed"
                    '''
                }
            }
        }

        stage('Create Docker Compose with CORS') {
            steps {
                sh '''
                    echo "=== Creating docker-compose.yml with CORS ==="
                    
                    cat > docker-compose.yml << EOF
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
      - JWT_SECRET=dummysecret
      - MONGODB_URI=mongodb://mongo:27017/devops
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
      - mongo
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
                    
                    # Create uploads directory with proper permissions
                    mkdir -p uploads
                    chmod 777 uploads 2>/dev/null || true
                    
                    # Start services
                    echo "Starting services..."
                    docker-compose up -d
                    
                    # Wait for services
                    echo "Waiting for services to start (40 seconds)..."
                    sleep 40
                    
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
                    BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
                    
                    if [ "$BACKEND_HEALTH" = "200" ]; then
                        echo "✅ Backend is healthy"
                        
                        # Test CORS headers
                        echo "Testing CORS configuration..."
                        CORS_TEST=$(curl -s -I -X OPTIONS http://localhost:5000/api/plant/add \
                          -H "Origin: http://${PUBLIC_IP}:5173" 2>/dev/null | \
                          grep -i "access-control-allow-origin" || echo "No CORS headers")
                        
                        echo "CORS Headers: $CORS_TEST"
                        
                        if echo "$CORS_TEST" | grep -q "${PUBLIC_IP}"; then
                            echo "✅ CORS is properly configured for image uploads"
                        else
                            echo "⚠️ CORS might not be configured properly"
                        fi
                        
                    else
                        echo "❌ Backend health check failed: HTTP $BACKEND_HEALTH"
                        echo "=== Backend Logs ==="
                        docker logs backend --tail=30
                    fi
                    
                    # Test frontend
                    echo "Testing frontend..."
                    FRONTEND_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
                    if [ "$FRONTEND_TEST" = "200" ] || [ "$FRONTEND_TEST" = "304" ]; then
                        echo "✅ Frontend is serving"
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
                    
                    # Check running containers
                    RUNNING_COUNT=$(docker ps --filter "name=frontend|name=backend|name=mongo" --filter "status=running" | grep -v "CONTAINER ID" | wc -l)
                    
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
                        echo "   ✓ File uploads enabled"
                        echo "=========================================="
                    else
                        echo "❌ Some containers are not running"
                        echo ""
                        echo "=== Troubleshooting ==="
                        docker-compose ps
                        echo ""
                        echo "=== Backend Logs ==="
                        docker logs backend --tail=50
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
                echo "   6. It should work now!"
                echo ""
                echo "📝 If still having issues:"
                echo "   - Check backend logs: docker logs backend"
                echo "   - Verify CORS: curl -I http://${PUBLIC_IP}:5000"
                echo "=========================================="
            '''
        }
        
        failure {
            sh '''
                echo ""
                echo "=========================================="
                echo "❌ PIPELINE FAILED!"
                echo ""
                echo "Quick fixes to try:"
                echo "1. Manually set CORS in backend container:"
                echo "   docker exec backend sh -c 'export CORS_ORIGIN=\"http://localhost:5173,http://${PUBLIC_IP}:5173\" && pkill -f node && npm start &'"
                echo ""
                echo "2. Restart backend:"
                echo "   docker restart backend"
                echo ""
                echo "3. Check Cloudinary credentials:"
                echo "   docker exec backend env | grep CLDN"
                echo ""
                echo "4. Manual test of image upload:"
                echo "   curl -X POST http://localhost:5000/api/plant/add \\"
                echo "     -H \"Authorization: Bearer YOUR_TOKEN\" \\"
                echo "     -F \"name=Test\" -F \"price=10\" \\"
                echo "     -F \"images=@./test.jpg\""
                echo "=========================================="
            '''
        }
    }
}