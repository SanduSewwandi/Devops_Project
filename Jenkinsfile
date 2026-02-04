pipeline {
    agent any

    environment {
        DOCKERHUB_CREDS = 'plantcredentials'
        DOCKERHUB_USER  = 'sandusewwandi'
        BACKEND_IMAGE  = "${DOCKERHUB_USER}/devops_backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/devops_frontend:latest"
        PUBLIC_IP = '54.234.237.10'  // Your EC2 IP
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
                sh '''
                    echo "=== Repository Checked Out ==="
                    ls -la
                '''
            }
        }

        stage('Clean Previous Deployment') {
            steps {
                sh '''
                    echo "=== Cleaning Previous Deployment ==="
                    
                    # Stop and remove containers if they exist
                    docker stop frontend backend mongo 2>/dev/null || true
                    docker rm frontend backend mongo 2>/dev/null || true
                    
                    # Clean up Docker resources
                    docker system prune -f 2>/dev/null || true
                    
                    echo "✅ Cleanup completed"
                '''
            }
        }

        stage('Build Backend Image') {
            steps {
                sh '''
                    echo "=== Building Backend Docker Image ==="
                    
                    if [ -d "backEnd" ] && [ -f "backEnd/Dockerfile" ]; then
                        echo "Building backend from source..."
                        cd backEnd
                        docker build -t ${BACKEND_IMAGE} .
                        cd ..
                        echo "✅ Backend image built: ${BACKEND_IMAGE}"
                    else
                        echo "⚠️ Backend directory/Dockerfile not found"
                        echo "Will use existing image: ${BACKEND_IMAGE}"
                    fi
                '''
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh '''
                    echo "=== Building Frontend Docker Image ==="
                    
                    if [ -d "frontEnd" ] && [ -f "frontEnd/Dockerfile" ]; then
                        echo "Building frontend from source..."
                        cd frontEnd
                        docker build -t ${FRONTEND_IMAGE} .
                        cd ..
                        echo "✅ Frontend image built: ${FRONTEND_IMAGE}"
                    else
                        echo "⚠️ Frontend directory/Dockerfile not found"
                        echo "Will use existing image: ${FRONTEND_IMAGE}"
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
                        echo "=== Pushing Images to Docker Hub ==="
                        
                        # Login to Docker Hub
                        echo "${DH_PASS}" | docker login -u "${DH_USER}" --password-stdin
                        
                        # Push backend image if it exists locally
                        if docker image inspect ${BACKEND_IMAGE} > /dev/null 2>&1; then
                            echo "Pushing backend image: ${BACKEND_IMAGE}"
                            docker push ${BACKEND_IMAGE}
                            echo "✅ Backend image pushed"
                        else
                            echo "⚠️ Backend image not found locally"
                        fi
                        
                        # Push frontend image if it exists locally
                        if docker image inspect ${FRONTEND_IMAGE} > /dev/null 2>&1; then
                            echo "Pushing frontend image: ${FRONTEND_IMAGE}"
                            docker push ${FRONTEND_IMAGE}
                            echo "✅ Frontend image pushed"
                        else
                            echo "⚠️ Frontend image not found locally"
                        fi
                        
                        # Logout from Docker Hub
                        docker logout
                        echo "✅ Push completed"
                    '''
                }
            }
        }

        stage('Deploy MongoDB') {
            steps {
                sh '''
                    echo "=== Deploying MongoDB ==="
                    
                    # Create MongoDB volume if it doesn't exist
                    docker volume create mongo_data 2>/dev/null || true
                    
                    # Run MongoDB
                    docker run -d \
                      --name mongo \
                      -p 27017:27017 \
                      -v mongo_data:/data/db \
                      --restart unless-stopped \
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
                    
                    # Create uploads volume
                    docker volume create uploads_volume 2>/dev/null || true
                    
                    # Pull image if not built locally (optional)
                    docker pull ${BACKEND_IMAGE} 2>/dev/null || echo "Using local image"
                    
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
                      --restart unless-stopped \
                      ${BACKEND_IMAGE}
                    
                    echo "✅ Backend deployed"
                    echo "Waiting for backend to initialize..."
                    sleep 15
                '''
            }
        }

        stage('Deploy Frontend') {
            steps {
                sh '''
                    echo "=== Deploying Frontend ==="
                    
                    # Pull image if not built locally (optional)
                    docker pull ${FRONTEND_IMAGE} 2>/dev/null || echo "Using local image"
                    
                    # Run frontend
                    docker run -d \
                      --name frontend \
                      -p 5173:5173 \
                      -e VITE_API_URL=http://${PUBLIC_IP}:5000 \
                      --link backend \
                      --restart unless-stopped \
                      ${FRONTEND_IMAGE}
                    
                    echo "✅ Frontend deployed"
                    sleep 10
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    echo "=== Verifying Deployment ==="
                    
                    # Check container status
                    echo "Container Status:"
                    echo "----------------"
                    
                    mongo_running=$(docker inspect -f "{{.State.Running}}" mongo 2>/dev/null || echo "false")
                    backend_running=$(docker inspect -f "{{.State.Running}}" backend 2>/dev/null || echo "false")
                    frontend_running=$(docker inspect -f "{{.State.Running}}" frontend 2>/dev/null || echo "false")
                    
                    echo "MongoDB: $mongo_running"
                    echo "Backend: $backend_running"
                    echo "Frontend: $frontend_running"
                    
                    # Health checks
                    echo ""
                    echo "Health Checks:"
                    echo "--------------"
                    
                    # Check MongoDB
                    echo -n "MongoDB: "
                    if [ "$mongo_running" = "true" ]; then
                        docker exec mongo mongosh --eval "db.version()" 2>/dev/null && echo "✅ Healthy" || echo "⚠️ Unhealthy"
                    else
                        echo "❌ Not running"
                    fi
                    
                    # Check Backend
                    echo -n "Backend API: "
                    if [ "$backend_running" = "true" ]; then
                        sleep 5
                        curl -s -f http://localhost:5000/api/health && echo "✅ Healthy" || echo "⚠️ Unhealthy"
                    else
                        echo "❌ Not running"
                    fi
                    
                    # Check Frontend
                    echo -n "Frontend: "
                    if [ "$frontend_running" = "true" ]; then
                        curl -s -I http://localhost:5173 | head -1 | grep -q "200" && echo "✅ Serving" || echo "⚠️ Not serving"
                    else
                        echo "❌ Not running"
                    fi
                    
                    # Final verification
                    if [ "$mongo_running" = "true" ] && [ "$backend_running" = "true" ] && [ "$frontend_running" = "true" ]; then
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
                        echo "📋 Admin Features:"
                        echo "   ✅ Add New Plant"
                        echo "   ✅ Edit Existing Plants"
                        echo "   ✅ Delete Plants"
                        echo "   ✅ User Management"
                        echo ""
                        echo "🔧 CORS Configured for:"
                        echo "   http://${PUBLIC_IP}:5173"
                        echo "=========================================="
                    else
                        echo ""
                        echo "❌ DEPLOYMENT FAILED!"
                        echo ""
                        echo "Troubleshooting logs:"
                        echo "====================="
                        
                        echo "MongoDB logs (last 20 lines):"
                        docker logs mongo --tail=20 2>/dev/null || echo "No logs available"
                        echo ""
                        
                        echo "Backend logs (last 20 lines):"
                        docker logs backend --tail=20 2>/dev/null || echo "No logs available"
                        echo ""
                        
                        echo "Frontend logs (last 20 lines):"
                        docker logs frontend --tail=20 2>/dev/null || echo "No logs available"
                        
                        exit 1
                    fi
                '''
            }
        }
    }

    post {
        always {
            echo "Build Status: ${currentBuild.currentResult}"
            sh '''
                echo "=== Build Summary ==="
                echo "Backend Image: ${BACKEND_IMAGE}"
                echo "Frontend Image: ${FRONTEND_IMAGE}"
                echo "Public IP: ${PUBLIC_IP}"
            '''
        }
        
        success {
            sh '''
                echo ""
                echo "=========================================="
                echo "✅ CI/CD PIPELINE COMPLETED SUCCESSFULLY!"
                echo ""
                echo "📦 Images Built & Pushed:"
                echo "   - ${BACKEND_IMAGE}"
                echo "   - ${FRONTEND_IMAGE}"
                echo ""
                echo "🚀 Application Deployed:"
                echo "   http://${PUBLIC_IP}:5173"
                echo ""
                echo "🔧 Features Available:"
                echo "   - Add New Plant (CORS fixed)"
                echo "   - Edit/Delete Plants"
                echo "   - User Management"
                echo "=========================================="
            '''
        }
        
        failure {
            sh '''
                echo ""
                echo "=========================================="
                echo "❌ PIPELINE FAILED!"
                echo ""
                echo "Common issues to check:"
                echo "1. Docker daemon running: sudo systemctl status docker"
                echo "2. Port conflicts:"
                echo "   - sudo lsof -i :5173"
                echo "   - sudo lsof -i :5000"
                echo "   - sudo lsof -i :27017"
                echo "3. Docker Hub credentials"
                echo "4. Dockerfile syntax in backEnd/ and frontEnd/"
                echo "=========================================="
                
                # Show current container status
                echo ""
                echo "Current Docker status:"
                docker ps -a
            '''
        }
    }
}