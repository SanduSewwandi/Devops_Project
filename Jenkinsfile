pipeline {
    agent any

    environment {
        DOCKERHUB_CREDS = 'plantcredentials'
        DOCKERHUB_USER  = 'sandusewwandi'
        BACKEND_IMAGE  = "${DOCKERHUB_USER}/devops_backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/devops_frontend:latest"
    }

    options {
        timeout(time: 10, unit: 'MINUTES')
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
                    echo ""
                    echo "=== Checking docker-compose.yml ==="
                    cat docker-compose.yml
                '''
            }
        }

        stage('Pre-pull Base Images') {
            steps {
                sh '''
                    echo "=== Pre-pulling Base Images ==="
                    # Pull mongo image in background
                    docker pull mongo:6 &
                    echo "✅ Mongo image pull initiated"
                '''
            }
        }

        stage('Clean Previous Deployment') {
            steps {
                sh '''
                    echo "=== Cleaning Previous Deployment ==="
                    # Stop and remove containers
                    docker-compose down --remove-orphans 2>/dev/null || true
                    
                    # Remove old images to save space
                    docker image prune -f 2>/dev/null || true
                    
                    echo "✅ Cleanup completed"
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    echo "=== Building Docker Images ==="
                    
                    echo "Building backend image..."
                    cd backEnd
                    docker build -t ${BACKEND_IMAGE} .
                    
                    echo "Building frontend image..."
                    cd ../frontEnd
                    docker build -t ${FRONTEND_IMAGE} .
                    
                    echo "✅ Images built successfully"
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
                        docker push ${BACKEND_IMAGE}
                        
                        echo "Pushing frontend image..."
                        docker push ${FRONTEND_IMAGE}
                        
                        docker logout
                        echo "✅ Images pushed to Docker Hub"
                    '''
                }
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                sh '''
                    echo "=== Deploying with Docker Compose ==="
                    
                    # Verify docker-compose file exists
                    echo "Using docker-compose.yml:"
                    cat docker-compose.yml
                    
                    # Deploy
                    echo "Starting services..."
                    docker-compose up -d
                    
                    # Wait a moment for services to start
                    echo "Waiting for services to initialize..."
                    sleep 5
                    
                    echo "=== Initial Deployment Status ==="
                    docker-compose ps
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    echo "=== Verifying Deployment ==="
                    
                    # Wait a bit more for all services
                    sleep 5
                    
                    echo "=== Final Container Status ==="
                    docker-compose ps
                    
                    # Check if all containers are running
                    RUNNING_COUNT=$(docker-compose ps | grep -c "Up")
                    echo "Running containers: $RUNNING_COUNT/3"
                    
                    if [ "$RUNNING_COUNT" -eq 3 ]; then
                        echo "✅ SUCCESS: All containers are running!"
                        
                        # Test backend connectivity
                        echo ""
                        echo "=== Testing Backend Connectivity ==="
                        if docker-compose exec -T backend curl -s -o /dev/null -w "%{http_code}\\n" http://localhost:5000 2>/dev/null; then
                            echo "✅ Backend is accessible"
                        else
                            echo "⚠️ Backend might still be starting"
                        fi
                        
                        # Display access information
                        echo ""
                        echo "🌐 APPLICATION DEPLOYED SUCCESSFULLY"
                        echo "====================================="
                        
                        # Get EC2 public IP
                        if PUBLIC_IP=$(curl -s --max-time 3 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null); then
                            echo "Public IP: $PUBLIC_IP"
                            echo ""
                            echo "Access URLs:"
                            echo "Frontend App:  http://$PUBLIC_IP:5173"
                            echo "Backend API:   http://$PUBLIC_IP:5000"
                            echo "MongoDB:       $PUBLIC_IP:27017"
                        else
                            echo "Access URLs (use your EC2 public IP):"
                            echo "Frontend App:  http://<EC2_IP>:5173"
                            echo "Backend API:   http://<EC2_IP>:5000"
                            echo "MongoDB:       <EC2_IP>:27017"
                        fi
                        echo "====================================="
                        
                    elif [ "$RUNNING_COUNT" -ge 1 ]; then
                        echo "⚠️ Partial deployment: $RUNNING_COUNT/3 containers running"
                        echo "Checking logs..."
                        docker-compose logs --tail=10
                        
                        # Show which containers are running
                        echo ""
                        echo "Running containers:"
                        docker-compose ps | grep "Up"
                        
                    else
                        echo "❌ ERROR: No containers are running"
                        echo "=== Debug Information ==="
                        docker-compose ps -a
                        echo ""
                        echo "=== Recent Logs ==="
                        docker-compose logs --tail=30
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
            echo "Pipeline Result: ${currentBuild.currentResult}"
            echo "Build Number: ${env.BUILD_NUMBER}"
            echo "==========================================="
            
            // Optional: Clean up if needed
            sh '''
                echo "Current disk usage:"
                df -h /var/lib/docker
            '''
        }
        
        success {
            echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
            echo "Check the application at the URLs above."
        }
        
        failure {
            echo "❌ DEPLOYMENT FAILED"
            echo "Check the logs above for details."
        }
        
        cleanup {
            // Clean Docker resources to prevent disk space issues
            sh '''
                echo "=== Cleaning up unused Docker resources ==="
                docker system prune -f 2>/dev/null || true
            '''
        }
    }
}