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
        retry(1)
    }

    stages {
        stage('Checkout & Setup') {
            steps {
                retry(2) {
                    checkout scm
                }
                script {
                    // Get public IP
                    def publicIp = sh(script: "curl -s http://169.254.169.254/latest/meta-data/public-ipv4", returnStdout: true).trim()
                    echo "=== Detected Public IP: ${publicIp} ==="
                    env.PUBLIC_IP = publicIp
                    
                    // Remove the existing docker-compose.yml if owned by root
                    sh '''
                        echo "Cleaning up old docker-compose.yml..."
                        sudo rm -f docker-compose.yml 2>/dev/null || true
                    '''
                }
            }
        }

        stage('Create Docker Compose') {
            steps {
                sh """
                    # Create docker-compose.yml directly
                    cat > docker-compose.yml << 'EOF'
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
      MONGODB_URI: mongodb://mongo:27017/devops
      NODE_ENV: production
      JWT_SECRET: dummysecret
      CLDN_API_KEY: 823756362343243
      CLDN_API_SECRET: FwkT9WUwifSXJn-Mev1-2gpvw5c
      CLDN_NAME: djzjdus1k
      ADMIN_EMAIL: admin@plant.com
      ADMIN_PASS: Admin123
      # CORS Configuration - CRITICAL for Add Plant functionality
      CORS_ORIGIN: http://localhost:5173,http://${env.PUBLIC_IP}:5173
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
      # Fixes the CORS/localhost error by pointing to the EC2 Public IP
      VITE_API_URL: http://${env.PUBLIC_IP}:5000
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mongo_data:
  uploads_volume:
EOF
                    
                    echo "=== Docker Compose File Created ==="
                    ls -la docker-compose.yml
                """
            }
        }

        stage('Clean Previous') {
            steps {
                sh '''
                    echo "=== Cleaning Previous Deployment ==="
                    
                    # Clean up using docker commands directly (no docker-compose needed)
                    docker stop frontend backend mongo 2>/dev/null || true
                    docker rm frontend backend mongo 2>/dev/null || true
                    docker volume prune -f 2>/dev/null || true
                    
                    echo "✅ Cleanup completed"
                '''
            }
        }

        stage('Deploy Application') {
            steps {
                sh '''
                    echo "=== Deploying Application ==="
                    
                    if [ ! -f "docker-compose.yml" ]; then
                        echo "❌ ERROR: docker-compose.yml not found!"
                        exit 1
                    fi
                    
                    echo "🚀 Starting containers with docker-compose..."
                    docker-compose up -d
                    
                    # Wait for containers to start
                    echo "⏳ Waiting for containers to start (30 seconds)..."
                    sleep 30
                    
                    # Show container status
                    echo "=== Container Status ==="
                    docker-compose ps || docker ps --filter "name=frontend\|name=backend\|name=mongo"
                    
                    # Check if containers are running
                    echo "=== Checking container health ==="
                    
                    # Check MongoDB
                    if docker ps | grep -q mongo; then
                        echo "✅ MongoDB is running"
                    else
                        echo "❌ MongoDB failed to start"
                        docker logs mongo --tail=20 2>/dev/null || true
                    fi
                    
                    # Check Backend
                    if docker ps | grep -q backend; then
                        echo "✅ Backend is running"
                        # Test backend health
                        echo "Testing backend API..."
                        sleep 5
                        curl -f http://localhost:5000/api/health 2>/dev/null && echo "✅ Backend health check passed" || echo "⚠️ Backend health check failed"
                    else
                        echo "❌ Backend failed to start"
                        docker logs backend --tail=20 2>/dev/null || true
                    fi
                    
                    # Check Frontend
                    if docker ps | grep -q frontend; then
                        echo "✅ Frontend is running"
                    else
                        echo "❌ Frontend failed to start"
                        docker logs frontend --tail=20 2>/dev/null || true
                    fi
                '''
            }
        }

        stage('Verify & Test') {
            steps {
                sh '''
                    echo "=== Final Verification ==="
                    
                    # Count running containers
                    running_count=$(docker ps --filter "name=frontend\|name=backend\|name=mongo" --filter "status=running" | grep -v "CONTAINER ID" | wc -l)
                    
                    echo "Running application containers: $running_count/3"
                    
                    if [ "$running_count" -eq 3 ]; then
                        echo ""
                        echo "🎉 DEPLOYMENT SUCCESSFUL!"
                        echo "=========================================="
                        echo "🌿 Plant Shop Application is LIVE!"
                        echo ""
                        echo "🔗 Application URL:"
                        echo "   http://${PUBLIC_IP}:5173"
                        echo ""
                        echo "⚙️  Service URLs:"
                        echo "   Frontend: http://${PUBLIC_IP}:5173"
                        echo "   Backend API: http://${PUBLIC_IP}:5000"
                        echo "   MongoDB: http://${PUBLIC_IP}:27017"
                        echo ""
                        echo "📋 IMPORTANT: Add Plant should now work!"
                        echo "   CORS is configured for: http://${PUBLIC_IP}:5173"
                        echo "=========================================="
                        
                        # Create a simple test script
                        cat > test_deployment.sh << 'TEST_EOF'
#!/bin/bash
echo "Testing deployment..."
echo "1. Testing MongoDB..."
docker exec mongo mongosh --eval "db.version()" 2>/dev/null && echo "✅ MongoDB OK" || echo "❌ MongoDB test failed"

echo "2. Testing Backend API..."
curl -s http://localhost:5000/api/health && echo "✅ Backend OK" || echo "❌ Backend test failed"

echo "3. Testing Frontend..."
curl -s -I http://localhost:5173 | head -1 && echo "✅ Frontend OK" || echo "❌ Frontend test failed"
TEST_EOF
                        
                        chmod +x test_deployment.sh
                        ./test_deployment.sh
                        
                    else
                        echo "❌ DEPLOYMENT FAILED: Expected 3 containers, found $running_count running"
                        echo "=== Debug Information ==="
                        docker-compose ps || docker ps -a --filter "name=frontend\|name=backend\|name=mongo"
                        echo ""
                        echo "=== Recent Logs ==="
                        docker-compose logs --tail=50 || {
                            docker logs frontend --tail=20 2>/dev/null || true
                            docker logs backend --tail=20 2>/dev/null || true
                            docker logs mongo --tail=20 2>/dev/null || true
                        }
                        exit 1
                    fi
                '''
            }
        }
    }

    post {
        always {
            echo "Build Result: ${currentBuild.currentResult}"
        }
        
        success {
            sh '''
                echo ""
                echo "=========================================="
                echo "✅ PIPELINE COMPLETED SUCCESSFULLY!"
                echo "🌿 Your Plant Shop is now deployed!"
                echo "=========================================="
                echo ""
                echo "To access your application:"
                echo "  Open browser: http://${PUBLIC_IP}:5173"
                echo ""
                echo "Admin features (Add/Edit/Delete Plants):"
                echo "  Should now work with CORS configured!"
            '''
        }
        
        failure {
            sh '''
                echo ""
                echo "=========================================="
                echo "❌ PIPELINE FAILED!"
                echo ""
                echo "Common issues:"
                echo "1. Check if docker-compose.yml has correct permissions"
                echo "2. Verify images exist: ${BACKEND_IMAGE}, ${FRONTEND_IMAGE}"
                echo "3. Check port conflicts (5000, 5173, 27017)"
                echo "=========================================="
                
                # Try to show what went wrong
                echo ""
                echo "=== Last 50 lines of docker-compose logs ==="
                docker-compose logs --tail=50 2>/dev/null || echo "Could not get logs"
            '''
        }
    }
}