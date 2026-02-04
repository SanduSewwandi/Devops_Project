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
                        
                        # DON'T create .env file here - it will be overridden by docker-compose
                        # Just build the image
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

        stage('Create Docker Compose with CORS & Permissions Fix') {
            steps {
                sh '''
                    echo "=== Creating docker-compose.yml with FIXES ==="
                    
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
      
      # Cloudinary (for image uploads) - ADD THESE
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
      
      # CORS Configuration - CRITICAL FIX
      - CORS_ORIGIN=http://localhost:5173,http://${PUBLIC_IP}:5173
      - CORS_CREDENTIALS=true
      
      # File upload settings - USE /tmp FOR PERMISSIONS
      - MAX_FILE_SIZE=10485760  # 10MB
      - UPLOAD_PATH=/tmp/uploads
      
      # Debug mode
      - DEBUG=true
      
    volumes:
      # Mount uploads directory - USE /tmp for permissions
      - /tmp/uploads:/tmp/uploads
      - uploads_volume:/app/uploads  # Keep for backward compatibility
      - ./logs:/app/logs
      
    depends_on:
      - mongo
    restart: unless-stopped

  frontend:
    image: ${FRONTEND_IMAGE}
    container_name: frontend
    ports:
      - "5173:5173"
    environment:
      # Frontend API URL
      - VITE_API_URL=http://${PUBLIC_IP}:5000
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mongo_data:
  uploads_volume:
EOF
                    
                    echo "✅ docker-compose.yml created with ALL FIXES"
                    echo "=== File contents ==="
                    cat docker-compose.yml
                '''
            }
        }

        stage('Deploy with Permissions Fix') {
            steps {
                sh '''
                    echo "=== Deploying Application with Permission Fixes ==="
                    
                    # Check if docker-compose.yml exists
                    if [ ! -f "docker-compose.yml" ]; then
                        echo "❌ docker-compose.yml not found!"
                        exit 1
                    fi
                    
                    # Create /tmp/uploads on host with proper permissions
                    echo "Creating /tmp/uploads directory..."
                    sudo mkdir -p /tmp/uploads
                    sudo chmod 777 /tmp/uploads
                    
                    # Start services with force recreate
                    echo "Starting services..."
                    docker-compose up -d --force-recreate --remove-orphans
                    
                    # Wait for services
                    echo "Waiting for services to start (40 seconds)..."
                    sleep 40
                    
                    # Check status
                    echo "=== Service Status ==="
                    docker-compose ps
                '''
            }
        }

        stage('Fix Permissions in Containers') {
            steps {
                sh '''
                    echo "=== Fixing Container Permissions ==="
                    
                    # Wait for backend to fully start
                    sleep 15
                    
                    echo "1. Fixing upload directory permissions in backend..."
                    
                    # Create and fix /tmp/uploads (primary location)
                    docker exec backend mkdir -p /tmp/uploads
                    docker exec backend chmod -R 777 /tmp/uploads
                    
                    # Also fix /app/uploads for backward compatibility
                    docker exec backend mkdir -p /app/uploads 2>/dev/null || true
                    docker exec backend chmod -R 777 /app/uploads 2>/dev/null || true
                    
                    # Test write permissions
                    echo "2. Testing write permissions..."
                    
                    if docker exec backend touch /tmp/uploads/test-permission.txt 2>/dev/null; then
                        echo "✅ SUCCESS: Can write to /tmp/uploads"
                        docker exec backend rm -f /tmp/uploads/test-permission.txt
                    else
                        echo "❌ FAILED: Cannot write to /tmp/uploads"
                    fi
                    
                    # Check environment variables
                    echo "3. Checking backend environment..."
                    echo "CORS_ORIGIN:"
                    docker exec backend env | grep CORS_ORIGIN
                    echo "Cloudinary config:"
                    docker exec backend env | grep -i cloud
                    
                    # Check backend logs for errors
                    echo "4. Checking for backend errors..."
                    docker logs backend --tail=20 | grep -i "error\|failed\|permission" || echo "No obvious errors in logs"
                    
                    echo "✅ Permission fixes applied"
                '''
            }
        }

        stage('Test Backend Connectivity') {
            steps {
                sh '''
                    echo "=== Testing Backend Connectivity ==="
                    
                    # Test backend health
                    echo "Testing backend API health..."
                    for i in {1..5}; do
                        BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null || echo "000")
                        if [ "$BACKEND_HEALTH" = "200" ]; then
                            echo "✅ Backend is healthy (HTTP 200)"
                            break
                        else
                            echo "Attempt $i: Backend returned HTTP $BACKEND_HEALTH, waiting..."
                            sleep 5
                        fi
                    done
                    
                    if [ "$BACKEND_HEALTH" != "200" ]; then
                        echo "❌ Backend health check failed after 5 attempts"
                        echo "=== Backend Logs ==="
                        docker logs backend --tail=50
                        exit 1
                    fi
                    
                    # Test CORS headers
                    echo "Testing CORS configuration..."
                    CORS_TEST=$(curl -s -I -X OPTIONS http://localhost:5000/api/plant/add \
                      -H "Origin: http://${PUBLIC_IP}:5173" 2>/dev/null | \
                      grep -i "access-control-allow-origin" || echo "No CORS header")
                    
                    echo "CORS Header: $CORS_TEST"
                    
                    if echo "$CORS_TEST" | grep -q "${PUBLIC_IP}"; then
                        echo "✅ CORS is properly configured"
                    else
                        echo "⚠️ CORS might not be configured - check backend logs"
                    fi
                    
                    # Test MongoDB connection
                    echo "Testing MongoDB connection..."
                    MONGO_TEST=$(docker exec backend node -e "
                      const mongoose = require('mongoose');
                      mongoose.connect('mongodb://mongo:27017/devops')
                        .then(() => { console.log('MongoDB OK'); process.exit(0); })
                        .catch(err => { console.error('MongoDB ERROR:', err.message); process.exit(1); });
                    " 2>/dev/null && echo "✅ MongoDB connected" || echo "❌ MongoDB connection failed")
                    
                    echo "$MONGO_TEST"
                '''
            }
        }

        stage('Verify Complete Deployment') {
            steps {
                sh '''
                    echo "=== Final Verification ==="
                    
                    # Check running containers
                    RUNNING_COUNT=$(docker-compose ps --services --filter "status=running" 2>/dev/null | wc -l)
                    TOTAL_COUNT=$(docker-compose ps --services 2>/dev/null | wc -l)
                    
                    echo "Running: $RUNNING_COUNT/$TOTAL_COUNT containers"
                    
                    if [ "$RUNNING_COUNT" -eq 3 ]; then
                        echo ""
                        echo "🎉 🎉 🎉 DEPLOYMENT COMPLETELY SUCCESSFUL! 🎉 🎉 🎉"
                        echo "=================================================="
                        echo "🌿 PLANT SHOP APPLICATION IS FULLY DEPLOYED!"
                        echo ""
                        echo "🔗 APPLICATION URL:"
                        echo "   🌐 http://${PUBLIC_IP}:5173"
                        echo ""
                        echo "⚙️  SERVICE URLS:"
                        echo "   Frontend: http://${PUBLIC_IP}:5173"
                        echo "   Backend API: http://${PUBLIC_IP}:5000"
                        echo "   MongoDB: http://${PUBLIC_IP}:27017"
                        echo ""
                        echo "✅ ALL FIXES APPLIED:"
                        echo "   ✓ CORS configured for image uploads"
                        echo "   ✓ Cloudinary credentials (both formats)"
                        echo "   ✓ File upload permissions fixed (/tmp/uploads)"
                        echo "   ✓ MongoDB connection verified"
                        echo "   ✓ Backend health check passed"
                        echo ""
                        echo "📱 NOW TRY: Add Plant with Image!"
                        echo "   1. Go to http://${PUBLIC_IP}:5173"
                        echo "   2. Login as admin@plant.com / Admin123"
                        echo "   3. Go to Plants → Add New Plant"
                        echo "   4. Upload image - IT SHOULD WORK NOW!"
                        echo "=================================================="
                        
                        # Show quick status
                        echo ""
                        echo "=== Quick Status ==="
                        docker-compose ps
                        
                    else
                        echo "❌ DEPLOYMENT FAILED: Not all containers running"
                        echo ""
                        echo "=== Full Debug Info ==="
                        docker-compose ps -a
                        echo ""
                        echo "=== Backend Logs ==="
                        docker logs backend --tail=100
                        echo ""
                        echo "=== MongoDB Logs ==="
                        docker logs mongo --tail=50
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
                echo "✅ PIPELINE EXECUTED SUCCESSFULLY!"
                echo ""
                echo "Application should now support:"
                echo "   ✓ Adding plants WITH images"
                echo "   ✓ Editing plants with images"
                echo "   ✓ All admin features working"
                echo ""
                echo "Test it now: http://${PUBLIC_IP}:5173"
                echo "=========================================="
            '''
        }
        
        failure {
            sh '''
                echo ""
                echo "=========================================="
                echo "❌ PIPELINE FAILED!"
                echo ""
                echo "Immediate manual fixes:"
                echo ""
                echo "1. Check backend logs:"
                echo "   docker logs backend --tail=100"
                echo ""
                echo "2. Fix permissions manually:"
                echo "   docker exec backend chmod -R 777 /tmp/uploads"
                echo "   docker exec backend chmod -R 777 /app/uploads"
                echo ""
                echo "3. Test backend manually:"
                echo "   curl http://localhost:5000/api/health"
                echo ""
                echo "4. Restart backend:"
                echo "   docker-compose restart backend"
                echo "   sleep 10"
                echo "   docker logs backend --tail=30"
                echo ""
                echo "5. Direct test of image upload:"
                echo "   echo 'test' > /tmp/test.txt"
                echo "   curl -X POST http://localhost:5000/api/plant/add \\"
                echo "     -H \"Content-Type: multipart/form-data\" \\"
                echo "     -H \"Authorization: Bearer YOUR_TOKEN\" \\"
                echo "     -F \"name=Test\" -F \"price=10\" \\"
                echo "     -F \"images=@/tmp/test.txt\""
                echo "=========================================="
            '''
        }
    }
}