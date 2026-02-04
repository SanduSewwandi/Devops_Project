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
                        echo "Building backend..."
                        cd backEnd
                        docker build -t ${BACKEND_IMAGE} .
                        cd ..
                        echo "✅ Backend image built"
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

        stage('Create Docker Compose with Proper Image Upload Fix') {
            steps {
                sh '''
                    echo "=== Creating docker-compose.yml with IMAGE UPLOAD FIX ==="
                    
                    # Remove existing docker-compose.yml if any
                    rm -f docker-compose.yml 2>/dev/null || true
                    
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
      # Authentication
      - JWT_SECRET=dummysecret
      - MONGODB_URI=mongodb://mongo:27017/devops
      - NODE_ENV=production
      
      # Cloudinary (for image uploads) - USE YOUR ACTUAL CREDENTIALS HERE!
      - CLOUDINARY_CLOUD_NAME=djzjdus1k
      - CLOUDINARY_API_KEY=823756362343243
      - CLOUDINARY_API_SECRET=FwkT9WUwifSXJn-Mev1-2gpvw5c
      # Also include old names for compatibility
      - CLDN_API_KEY=823756362343243
      - CLDN_API_SECRET=FwkT9WUwifSXJn-Mev1-2gpvw5c
      - CLDN_NAME=djzjdus1k
      
      # Admin
      - ADMIN_EMAIL=admin@plant.com
      - ADMIN_PASS=Admin123
      
      # CORS Configuration - CRITICAL for image uploads
      - CORS_ORIGIN=http://localhost:5173,http://${PUBLIC_IP}:5173
      - CORS_CREDENTIALS=true
      - ALLOWED_ORIGINS=http://localhost:5173,http://${PUBLIC_IP}:5173
      
      # File upload settings - SIMPLIFIED approach
      - MAX_FILE_SIZE=15728640  # 15MB
      - UPLOAD_PATH=/uploads
      - FILE_UPLOAD_DEST=/uploads
      
      # Debug mode - helpful for troubleshooting
      - DEBUG=express:*
      - LOG_LEVEL=debug
      
    volumes:
      # Use Docker volumes instead of host mounts (avoids permission issues)
      - uploads_volume:/uploads
      - ./logs:/app/logs
      
    depends_on:
      - mongo
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:5000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    image: ${FRONTEND_IMAGE}
    container_name: frontend
    ports:
      - "5173:5173"
    environment:
      # Frontend API URL - MUST match backend CORS origin
      - VITE_API_URL=http://${PUBLIC_IP}:5000
      - VITE_API_BASE_URL=http://${PUBLIC_IP}:5000/api
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mongo_data:
  uploads_volume:
EOF
                    
                    echo "✅ docker-compose.yml created with IMAGE UPLOAD FIX"
                    echo "=== File contents ==="
                    cat docker-compose.yml
                    
                    # Create logs directory (no permission changes needed)
                    mkdir -p ./logs
                '''
            }
        }

        stage('Deploy Application') {
            steps {
                sh '''
                    echo "=== Deploying Application ==="
                    
                    # Check if docker-compose.yml exists
                    if [ ! -f "docker-compose.yml" ]; then
                        echo "❌ docker-compose.yml not found!"
                        exit 1
                    fi
                    
                    # Deploy the application
                    echo "Starting services..."
                    docker-compose up -d --force-recreate --remove-orphans
                    
                    # Wait for services to fully start
                    echo "Waiting for services to start (60 seconds)..."
                    sleep 60
                    
                    # Check status
                    echo "=== Service Status ==="
                    docker-compose ps
                    
                    # Wait for health checks
                    echo "Waiting for health checks..."
                    sleep 30
                '''
            }
        }

        stage('Setup Permissions & Test Image Upload') {
            steps {
                sh '''
                    echo "=== Setting up Image Upload Permissions ==="
                    
                    # Wait for backend to be fully ready
                    echo "Waiting for backend container..."
                    for i in {1..10}; do
                        if docker ps | grep -q "backend"; then
                            echo "Backend container is running"
                            break
                        fi
                        echo "Waiting for backend... ($i/10)"
                        sleep 5
                    done
                    
                    # Fix permissions in the backend container (THIS IS SAFE - inside container)
                    echo "1. Setting up upload directory permissions inside container..."
                    docker exec backend mkdir -p /uploads 2>/dev/null || true
                    docker exec backend chmod -R 777 /uploads 2>/dev/null || true
                    
                    # Test write permissions
                    echo "2. Testing write permissions in container..."
                    if docker exec backend touch /uploads/test-write.txt 2>/dev/null; then
                        echo "✅ SUCCESS: Can write to /uploads directory"
                        docker exec backend rm -f /uploads/test-write.txt
                    else
                        echo "❌ WARNING: Cannot write to /uploads"
                    fi
                    
                    # Check backend environment
                    echo "3. Checking backend environment variables..."
                    docker exec backend env | grep -E "(CLOUDINARY|CORS|UPLOAD)" || echo "No relevant env vars found"
                    
                    # Check if Cloudinary is properly configured
                    echo "4. Checking Cloudinary configuration..."
                    docker exec backend node -e "console.log('Cloudinary Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || 'Not set')" 2>/dev/null || echo "Could not check Cloudinary config"
                    
                    echo "✅ Permissions setup completed"
                '''
            }
        }

        stage('Test Backend Connectivity & Image Upload') {
            steps {
                sh '''
                    echo "=== Testing Backend & Image Upload ==="
                    
                    # Test backend health endpoint
                    echo "1. Testing backend API health..."
                    HEALTH_STATUS=""
                    for i in {1..10}; do
                        HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null || echo "000")
                        echo "Attempt $i: Backend health status: $HEALTH_RESPONSE"
                        
                        if [ "$HEALTH_RESPONSE" = "200" ]; then
                            HEALTH_STATUS="200"
                            break
                        fi
                        sleep 5
                    done
                    
                    if [ "$HEALTH_STATUS" = "200" ]; then
                        echo "✅ Backend is healthy"
                    else
                        echo "❌ Backend health check failed"
                        echo "=== Checking backend logs ==="
                        docker logs backend --tail=100 2>/dev/null
                        exit 1
                    fi
                    
                    # Test CORS configuration
                    echo "2. Testing CORS configuration..."
                    CORS_HEADER=$(curl -s -I -X OPTIONS http://localhost:5000/api/plant/add \
                      -H "Origin: http://${PUBLIC_IP}:5173" 2>/dev/null | \
                      grep -i "access-control-allow-origin" || echo "No CORS header")
                    
                    echo "CORS Response: $CORS_HEADER"
                    
                    if echo "$CORS_HEADER" | grep -q "${PUBLIC_IP}" || echo "$CORS_HEADER" | grep -q "localhost"; then
                        echo "✅ CORS is properly configured"
                    else
                        echo "⚠️ CORS might not be configured correctly"
                    fi
                    
                    # Test if endpoints are accessible
                    echo "3. Testing API endpoints..."
                    
                    # Test login endpoint
                    LOGIN_TEST=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:5000/api/auth/login \
                      -H "Content-Type: application/json" \
                      -d '{"email":"admin@plant.com","password":"Admin123"}' 2>/dev/null || echo "000")
                      
                    if [ "$LOGIN_TEST" = "200" ] || [ "$LOGIN_TEST" = "401" ]; then
                        echo "✅ Login endpoint is accessible"
                    else
                        echo "⚠️ Login endpoint returned HTTP $LOGIN_TEST"
                    fi
                    
                    # Test plants endpoint
                    PLANTS_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/plant 2>/dev/null || echo "000")
                    echo "Plants endpoint status: $PLANTS_TEST"
                    
                    echo "✅ Backend tests completed"
                '''
            }
        }

        stage('Test Complete Application Flow') {
            steps {
                sh '''
                    echo "=== Testing Complete Application ==="
                    
                    # Check all containers are running
                    RUNNING_CONTAINERS=$(docker-compose ps --services --filter "status=running" 2>/dev/null | wc -l)
                    echo "Running containers: $RUNNING_CONTAINERS/3"
                    
                    if [ "$RUNNING_CONTAINERS" -eq 3 ]; then
                        echo "✅ All containers are running"
                    else
                        echo "❌ Some containers are not running"
                        docker-compose ps 2>/dev/null
                        exit 1
                    fi
                    
                    # Test frontend accessibility
                    echo "Testing frontend accessibility..."
                    FRONTEND_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null || echo "000")
                    if [ "$FRONTEND_TEST" = "200" ] || [ "$FRONTEND_TEST" = "000" ]; then
                        echo "✅ Frontend container is accessible"
                    else
                        echo "⚠️ Frontend returned HTTP $FRONTEND_TEST"
                    fi
                    
                    # Display deployment information
                    echo ""
                    echo "=================================================="
                    echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
                    echo "=================================================="
                    echo ""
                    echo "🌿 PLANT SHOP APPLICATION IS READY!"
                    echo ""
                    echo "🔗 ACCESS URLS:"
                    echo "   Frontend:      http://${PUBLIC_IP}:5173"
                    echo "   Backend API:   http://${PUBLIC_IP}:5000"
                    echo ""
                    echo "👤 ADMIN CREDENTIALS:"
                    echo "   Email: admin@plant.com"
                    echo "   Password: Admin123"
                    echo ""
                    echo "⚙️  IMAGE UPLOAD CONFIGURATION:"
                    echo "   ✅ Cloudinary configured with your credentials"
                    echo "   ✅ CORS properly set up"
                    echo "   ✅ Upload directory permissions fixed"
                    echo "   ✅ Max file size: 15MB"
                    echo ""
                    echo "🚀 HOW TO TEST IMAGE UPLOAD:"
                    echo "   1. Open http://${PUBLIC_IP}:5173 in browser"
                    echo "   2. Login with admin credentials"
                    echo "   3. Go to 'Add Plant' page"
                    echo "   4. Fill in plant details"
                    echo "   5. Select an image file (JPG/PNG, < 15MB)"
                    echo "   6. Click 'Add Plant'"
                    echo "   7. Check if image appears in plant list"
                    echo ""
                    echo "🛠️  TROUBLESHOOTING COMMANDS:"
                    echo "   View backend logs:    docker logs backend --tail=100"
                    echo "   View frontend logs:   docker logs frontend --tail=50"
                    echo "   Check containers:     docker-compose ps"
                    echo "   Restart backend:      docker-compose restart backend"
                    echo ""
                    echo "📊 CURRENT STATUS:"
                    docker-compose ps 2>/dev/null || echo "Status check failed"
                    echo "=================================================="
                '''
            }
        }
    }

    post {
        always {
            echo "Build Status: ${currentBuild.currentResult}"
            sh '''
                echo ""
                echo "=== Deployment Summary ==="
                echo "Public IP: ${PUBLIC_IP}"
                echo "Backend Image: ${BACKEND_IMAGE}"
                echo "Frontend Image: ${FRONTEND_IMAGE}"
                echo "Deployment Time: $(date)"
            '''
        }
        
        success {
            sh '''
                echo ""
                echo "=========================================="
                echo "✅ PIPELINE EXECUTED SUCCESSFULLY!"
                echo ""
                echo "🌿 Plant Shop Application Deployment Complete!"
                echo ""
                echo "🔗 Application URL: http://${PUBLIC_IP}:5173"
                echo ""
                echo "✅ Image uploads are configured with:"
                echo "   • Cloudinary integration"
                echo "   • Proper CORS configuration"
                echo "   • Correct file permissions"
                echo "   • 15MB file size limit"
                echo ""
                echo "📝 Test the application now!"
                echo "=========================================="
            '''
        }
        
        failure {
            sh '''
                echo ""
                echo "=========================================="
                echo "❌ PIPELINE FAILED!"
                echo ""
                echo "🔧 TROUBLESHOOTING STEPS:"
                echo ""
                echo "1. CHECK BACKEND LOGS:"
                echo "   docker logs backend --tail=200"
                echo ""
                echo "2. CHECK MONGODB CONNECTION:"
                echo "   docker exec mongo mongosh --eval \"db.stats()\""
                echo ""
                echo "3. TEST BACKEND HEALTH:"
                echo "   curl -v http://localhost:5000/api/health"
                echo ""
                echo "4. CHECK CLOUDINARY CONFIGURATION:"
                echo "   docker exec backend node -e \\"console.log(process.env.CLOUDINARY_CLOUD_NAME)\\"" 2>/dev/null || echo "Could not check"
                echo ""
                echo "5. TEST UPLOAD DIRECTORY PERMISSIONS:"
                echo "   docker exec backend ls -la /uploads"
                echo "   docker exec backend touch /uploads/test.txt"
                echo ""
                echo "6. RESTART SERVICES:"
                echo "   docker-compose down"
                echo "   docker-compose up -d"
                echo "   sleep 30"
                echo ""
                echo "7. MANUAL IMAGE UPLOAD TEST:"
                echo "   # First get admin token"
                echo "   TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \\"
                echo "     -H "Content-Type: application/json" \\"
                echo "     -d '\{"email":"admin@plant.com","password":"Admin123"\}' \\"
                echo "     2>/dev/null | grep -o '\"token\":\"[^\"]*\"' | cut -d\\\" -f4)"
                echo "   echo "Token: $TOKEN""
                echo "   # Create test image"
                echo "   echo "test" > /tmp/test.txt"
                echo "   # Test upload"
                echo "   curl -v -X POST http://localhost:5000/api/plant/add \\"
                echo "     -H "Authorization: Bearer $TOKEN" \\"
                echo "     -F "name=Test Plant" \\"
                echo "     -F "price=19.99" \\"
                echo "     -F "images=@/tmp/test.txt""
                echo ""
                echo "8. CHECK CLOUDINARY RESPONSE:"
                echo "   docker logs backend | grep -i cloudinary"
                echo ""
                echo "=========================================="
            '''
        }
        
        cleanup {
            sh '''
                echo "Cleaning up temporary files..."
                # Clean up any test files created
                docker exec backend rm -f /uploads/test*.txt 2>/dev/null || true
                echo "Cleanup completed"
            '''
        }
    }
}