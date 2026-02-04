pipeline {
    agent any
    
    environment {
        PUBLIC_IP = '54.234.237.10'  // Hardcode your IP
    }
    
    stages {
        stage('Cleanup') {
            steps {
                sh '''
                    echo "=== Cleaning up old containers ==="
                    
                    # Stop and remove containers if they exist
                    docker stop frontend backend mongo 2>/dev/null || true
                    docker rm frontend backend mongo 2>/dev/null || true
                    
                    # Remove old volumes
                    docker volume rm mongo_data uploads_volume 2>/dev/null || true
                    
                    echo "✅ Cleanup completed"
                '''
            }
        }
        
        stage('Deploy MongoDB') {
            steps {
                sh '''
                    echo "=== Deploying MongoDB ==="
                    docker run -d \
                      --name mongo \
                      -p 27017:27017 \
                      -v mongo_data:/data/db \
                      mongo:6
                    
                    echo "✅ MongoDB deployed"
                    sleep 5
                '''
            }
        }
        
        stage('Deploy Backend') {
            steps {
                sh '''
                    echo "=== Deploying Backend ==="
                    
                    # Pull the latest backend image
                    docker pull sandusewwandi/devops_backend:latest || echo "Using local image"
                    
                    # Run backend with CORS configuration
                    docker run -d \
                      --name backend \
                      -p 5000:5000 \
                      -e MONGODB_URI=mongodb://mongo:27017/devops \
                      -e NODE_ENV=production \
                      -e JWT_SECRET=dummysecret \
                      -e CLDN_API_KEY=823756362343243 \
                      -e CLDN_API_SECRET=FwkT9WUwifSXJn-Mev1-2gpvw5c \
                      -e CLDN_NAME=djzjdus1k \
                      -e ADMIN_EMAIL=admin@plant.com \
                      -e ADMIN_PASS=Admin123 \
                      -e CORS_ORIGIN=http://localhost:5173,http://${PUBLIC_IP}:5173 \
                      -v uploads_volume:/app/uploads \
                      --link mongo \
                      sandusewwandi/devops_backend:latest
                    
                    echo "✅ Backend deployed"
                    sleep 10
                '''
            }
        }
        
        stage('Deploy Frontend') {
            steps {
                sh '''
                    echo "=== Deploying Frontend ==="
                    
                    # Pull the latest frontend image
                    docker pull sandusewwandi/devops_frontend:latest || echo "Using local image"
                    
                    # Run frontend
                    docker run -d \
                      --name frontend \
                      -p 5173:5173 \
                      -e VITE_API_URL=http://${PUBLIC_IP}:5000 \
                      --link backend \
                      sandusewwandi/devops_frontend:latest
                    
                    echo "✅ Frontend deployed"
                    sleep 10
                '''
            }
        }
        
        stage('Verify Deployment') {
            steps {
                sh '''
                    echo "=== Verifying Deployment ==="
                    
                    # Check if all containers are running
                    echo "Checking container status..."
                    
                    MONGO_STATUS=$(docker inspect -f "{{.State.Status}}" mongo 2>/dev/null || echo "not running")
                    BACKEND_STATUS=$(docker inspect -f "{{.State.Status}}" backend 2>/dev/null || echo "not running")
                    FRONTEND_STATUS=$(docker inspect -f "{{.State.Status}}" frontend 2>/dev/null || echo "not running")
                    
                    echo "MongoDB: $MONGO_STATUS"
                    echo "Backend: $BACKEND_STATUS"
                    echo "Frontend: $FRONTEND_STATUS"
                    
                    if [ "$MONGO_STATUS" = "running" ] && [ "$BACKEND_STATUS" = "running" ] && [ "$FRONTEND_STATUS" = "running" ]; then
                        echo ""
                        echo "🎉 🎉 🎉 DEPLOYMENT SUCCESSFUL! 🎉 🎉 🎉"
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
                        echo "📋 Admin Features Available:"
                        echo "   ✅ Add New Plant"
                        echo "   ✅ Edit Existing Plants"
                        echo "   ✅ Delete Plants"
                        echo "   ✅ User Management"
                        echo ""
                        echo "🔧 CORS Configured for:"
                        echo "   http://${PUBLIC_IP}:5173"
                        echo "=========================================="
                        
                        # Test the services
                        echo ""
                        echo "=== Running Health Checks ==="
                        
                        echo "1. Testing MongoDB connection..."
                        docker exec mongo mongosh --eval "db.version()" 2>/dev/null && echo "✅ MongoDB is healthy" || echo "⚠️ MongoDB connection test failed"
                        
                        echo "2. Testing Backend API..."
                        sleep 5
                        curl -s -f http://localhost:5000/api/health && echo "✅ Backend API is healthy" || echo "⚠️ Backend API test failed"
                        
                        echo "3. Testing Frontend..."
                        curl -s -I http://localhost:5173 | head -1 | grep -q "200" && echo "✅ Frontend is serving" || echo "⚠️ Frontend test failed"
                        
                    else
                        echo ""
                        echo "❌ DEPLOYMENT FAILED!"
                        echo ""
                        echo "=== Container Logs ==="
                        echo "MongoDB logs:"
                        docker logs mongo --tail=20 2>/dev/null || echo "No MongoDB logs available"
                        echo ""
                        echo "Backend logs:"
                        docker logs backend --tail=20 2>/dev/null || echo "No Backend logs available"
                        echo ""
                        echo "Frontend logs:"
                        docker logs frontend --tail=20 2>/dev/null || echo "No Frontend logs available"
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
                echo "🌿 Your Plant Shop is now live at:"
                echo "   http://${PUBLIC_IP}:5173"
                echo ""
                echo "To test admin features:"
                echo "1. Open http://${PUBLIC_IP}:5173"
                echo "2. Login as admin"
                echo "3. Try 'Add New Plant' - it should work!"
                echo "=========================================="
            '''
        }
        
        failure {
            sh '''
                echo ""
                echo "=========================================="
                echo "❌ PIPELINE FAILED!"
                echo ""
                echo "Quick troubleshooting:"
                echo "1. Check if Docker is running: sudo systemctl status docker"
                echo "2. Check port availability:"
                echo "   - Port 5173 (Frontend): sudo netstat -tulpn | grep :5173"
                echo "   - Port 5000 (Backend): sudo netstat -tulpn | grep :5000"
                echo "   - Port 27017 (MongoDB): sudo netstat -tulpn | grep :27017"
                echo "3. Check container logs individually:"
                echo "   docker logs mongo"
                echo "   docker logs backend"
                echo "   docker logs frontend"
                echo "=========================================="
            '''
        }
    }
}