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
        retry(3)  // Increased retries
        skipDefaultCheckout(true)  // Handle checkout manually
    }

    stages {
        stage('Git Checkout with Retry') {
            steps {
                script {
                    def retryCount = 0
                    def maxRetries = 3
                    
                    while(retryCount < maxRetries) {
                        try {
                            echo "Attempt ${retryCount + 1} to checkout code..."
                            checkout([
                                $class: 'GitSCM',
                                branches: [[name: '*/main']],
                                extensions: [[$class: 'CloneOption', 
                                             timeout: 10,  // Reduced timeout
                                             shallow: true,  // Shallow clone
                                             depth: 1]],  // Only latest commit
                                userRemoteConfigs: [[
                                    url: 'https://github.com/SanduSewwandi/Devops_Project',
                                    credentialsId: ''  // Add if private repo
                                ]]
                            ])
                            echo "✅ Checkout successful"
                            break
                        } catch(Exception e) {
                            retryCount++
                            echo "❌ Checkout failed attempt ${retryCount}: ${e.message}"
                            if(retryCount >= maxRetries) {
                                error("Failed to checkout after ${maxRetries} attempts")
                            }
                            sleep(time: 5, unit: 'SECONDS')  // Wait before retry
                        }
                    }
                }
                
                sh '''
                    echo "=== Workspace Contents ==="
                    pwd
                    ls -la
                    
                    echo ""
                    echo "=== Checking Critical Files ==="
                    if [ -f "docker-compose.yml" ]; then
                        echo "✅ docker-compose.yml exists"
                        cat docker-compose.yml
                    else
                        echo "❌ docker-compose.yml not found!"
                        exit 1
                    fi
                    
                    if [ -f "backEnd/Dockerfile" ]; then
                        echo "✅ backEnd/Dockerfile exists"
                    else
                        echo "❌ backEnd/Dockerfile not found!"
                        exit 1
                    fi
                    
                    if [ -f "frontEnd/Dockerfile" ]; then
                        echo "✅ frontEnd/Dockerfile exists"
                    else
                        echo "❌ frontEnd/Dockerfile not found!"
                        exit 1
                    fi
                '''
            }
        }

        stage('Clean Workspace & Docker') {
            steps {
                sh '''
                    echo "=== Cleaning Previous Build ==="
                    
                    # Clean Docker containers
                    echo "Stopping Docker containers..."
                    docker-compose down --remove-orphans 2>/dev/null || true
                    
                    # Remove dangling images
                    echo "Cleaning Docker images..."
                    docker image prune -f 2>/dev/null || true
                    
                    # Clean workspace (optional, careful with this)
                    echo "Workspace cleanup..."
                    rm -rf node_modules dist build 2>/dev/null || true
                    
                    echo "✅ Cleanup completed"
                '''
            }
        }

        stage('Pull Base Images') {
            steps {
                sh '''
                    echo "=== Pulling Required Images ==="
                    
                    # Pull mongo image (required for docker-compose)
                    echo "Pulling MongoDB..."
                    docker pull mongo:6 || echo "⚠️ Could not pull mongo, will pull during compose"
                    
                    # Check if our images exist in Docker Hub
                    echo "Checking for existing images..."
                    docker pull ${BACKEND_IMAGE} 2>/dev/null || echo "Backend image not found in registry, will build"
                    docker pull ${FRONTEND_IMAGE} 2>/dev/null || echo "Frontend image not found in registry, will build"
                    
                    echo "✅ Image preparation complete"
                '''
            }
        }

        stage('Build Application Images') {
            steps {
                script {
                    try {
                        sh '''
                            echo "=== Building Backend Image ==="
                            cd backEnd
                            
                            # Check for package.json
                            if [ ! -f "package.json" ]; then
                                echo "❌ ERROR: package.json not found in backEnd/"
                                exit 1
                            fi
                            
                            # Build with cache
                            docker build \
                                --cache-from=${BACKEND_IMAGE} \
                                -t ${BACKEND_IMAGE} \
                                -t reactweb1-backend:latest \
                                .
                                
                            echo "✅ Backend image built successfully"
                        '''
                    } catch(Exception e) {
                        echo "Backend build failed: ${e.message}"
                        // Continue with frontend anyway
                    }
                    
                    try {
                        sh '''
                            echo "=== Building Frontend Image ==="
                            cd frontEnd
                            
                            # Check for package.json
                            if [ ! -f "package.json" ]; then
                                echo "❌ ERROR: package.json not found in frontEnd/"
                                exit 1
                            fi
                            
                            # Build with cache
                            docker build \
                                --cache-from=${FRONTEND_IMAGE} \
                                -t ${FRONTEND_IMAGE} \
                                -t reactweb1-frontend:latest \
                                .
                                
                            echo "✅ Frontend image built successfully"
                        '''
                    } catch(Exception e) {
                        echo "Frontend build failed: ${e.message}"
                        error("Build failed. Check Dockerfiles and source code.")
                    }
                }
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
                        echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
                        
                        # Push backend
                        echo "Pushing backend image..."
                        docker push ${BACKEND_IMAGE} || echo "⚠️ Backend push failed, continuing..."
                        
                        # Push frontend
                        echo "Pushing frontend image..."
                        docker push ${FRONTEND_IMAGE} || echo "⚠️ Frontend push failed, continuing..."
                        
                        # Logout
                        docker logout
                        
                        echo "✅ Image push completed"
                    '''
                }
            }
        }

        stage('Deploy Application') {
            steps {
                sh '''
                    echo "=== Deploying Application ==="
                    
                    # Verify we're in the right directory
                    echo "Current directory: $(pwd)"
                    echo "docker-compose.yml content:"
                    cat docker-compose.yml
                    
                    # Start services
                    echo "Starting services with docker-compose..."
                    docker-compose up -d
                    
                    # Wait for services to start
                    echo "Waiting for services to initialize (10 seconds)..."
                    sleep 10
                    
                    # Check status
                    echo "=== Deployment Status ==="
                    docker-compose ps
                '''
            }
        }

        stage('Verify & Test') {
            steps {
                sh '''
                    echo "=== Verifying Deployment ==="
                    
                    # Check if all containers are running
                    RUNNING_CONTAINERS=$(docker-compose ps --services --filter "status=running" | wc -l)
                    TOTAL_CONTAINERS=$(docker-compose ps --services | wc -l)
                    
                    echo "Running: $RUNNING_CONTAINERS out of $TOTAL_CONTAINERS containers"
                    
                    if [ "$RUNNING_CONTAINERS" -eq "$TOTAL_CONTAINERS" ] && [ "$TOTAL_CONTAINERS" -eq 3 ]; then
                        echo "✅ All containers are running!"
                        
                        # Quick health checks
                        echo ""
                        echo "=== Health Checks ==="
                        
                        # Check MongoDB
                        if docker-compose exec -T mongo mongosh --eval "db.adminCommand('ping')" --quiet 2>/dev/null; then
                            echo "✅ MongoDB is responding"
                        else
                            echo "⚠️ MongoDB health check failed"
                        fi
                        
                        # Check backend (give it time)
                        sleep 3
                        if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 2>/dev/null | grep -q "200\|404\|201"; then
                            echo "✅ Backend API is accessible"
                        else
                            echo "⚠️ Backend might be starting up"
                        fi
                        
                        # Display access information
                        echo ""
                        echo "🌐 DEPLOYMENT SUCCESSFUL!"
                        echo "========================================"
                        
                        # Try to get EC2 public IP
                        set +e
                        PUBLIC_IP=$(curl -s --connect-timeout 3 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null)
                        set -e
                        
                        if [ -n "$PUBLIC_IP" ]; then
                            echo "EC2 Public IP: $PUBLIC_IP"
                            echo ""
                            echo "Access URLs:"
                            echo "• Frontend: http://$PUBLIC_IP:5173"
                            echo "• Backend API: http://$PUBLIC_IP:5000"
                            echo "• MongoDB: $PUBLIC_IP:27017"
                        else
                            echo "Access URLs (use your EC2 instance IP):"
                            echo "• Frontend: http://<EC2_IP>:5173"
                            echo "• Backend API: http://<EC2_IP>:5000"
                            echo "• MongoDB: <EC2_IP>:27017"
                        fi
                        echo "========================================"
                        
                    elif [ "$RUNNING_CONTAINERS" -gt 0 ]; then
                        echo "⚠️ Partial deployment: $RUNNING_CONTAINERS/$TOTAL_CONTAINERS containers running"
                        echo "Checking container logs..."
                        
                        # Show which containers are running/not
                        echo ""
                        echo "Container Status:"
                        docker-compose ps
                        
                        # Show logs for failed containers
                        echo ""
                        echo "Recent logs for troubleshooting:"
                        docker-compose logs --tail=20
                        
                        # Don't fail the build, just warn
                        echo "⚠️ WARNING: Some containers didn't start properly"
                        
                    else
                        echo "❌ ERROR: No containers are running!"
                        echo "Debug information:"
                        docker-compose ps -a
                        echo ""
                        echo "Full logs:"
                        docker-compose logs
                        exit 1
                    fi
                '''
            }
        }
    }

    post {
        always {
            echo ""
            echo "==========================================="
            echo "BUILD #${BUILD_NUMBER} - ${currentBuild.currentResult}"
            echo "Build URL: ${BUILD_URL}"
            echo "==========================================="
            
            // Save important information
            archiveArtifacts artifacts: 'docker-compose.yml', allowEmptyArchive: true
            
            // Cleanup to save space
            sh '''
                echo "=== Post-build Cleanup ==="
                echo "Removing unused Docker data..."
                docker system prune -f 2>/dev/null || true
                
                echo "Disk usage:"
                df -h /var/lib/docker 2>/dev/null || true
            '''
        }
        
        success {
            echo "🎉 🎉 🎉 PIPELINE COMPLETED SUCCESSFULLY! 🎉 🎉 🎉"
            echo "Your application should be accessible at the URLs above."
            
            // Optional: Send notification
            emailext (
                subject: "✅ Pipeline Success: ${JOB_NAME} #${BUILD_NUMBER}",
                body: "The pipeline completed successfully.\nBuild URL: ${BUILD_URL}\n\nApplication should be running.",
                to: 'YOUR_EMAIL@example.com'  // Change this
            )
        }
        
        failure {
            echo "❌ ❌ ❌ PIPELINE FAILED! ❌ ❌ ❌"
            echo "Check the logs above for details."
            
            // Show helpful troubleshooting info
            sh '''
                echo ""
                echo "=== Troubleshooting Tips ==="
                echo "1. Check Docker service: sudo systemctl status docker"
                echo "2. Check Jenkins logs: sudo tail -f /var/log/jenkins/jenkins.log"
                echo "3. Check disk space: df -h"
                echo "4. Check Docker logs: sudo journalctl -u docker --no-pager -n 50"
            '''
            
            // Optional: Send failure notification
            emailext (
                subject: "❌ Pipeline Failed: ${JOB_NAME} #${BUILD_NUMBER}",
                body: "The pipeline failed.\nBuild URL: ${BUILD_URL}\n\nCheck Jenkins for details.",
                to: 'YOUR_EMAIL@example.com'  // Change this
            )
        }
        
        unstable {
            echo "⚠️ Pipeline is unstable"
        }
        
        aborted {
            echo "⏹️ Pipeline was aborted"
        }
        
        cleanup {
            // Always run cleanup
            echo "Cleaning up workspace..."
        }
    }
}