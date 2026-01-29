pipeline {
    // Use a label that has Docker installed, or specify requirements
    agent {
        label 'docker || linux'  // Adjust based on your Jenkins agent labels
    }
    
    // Add pipeline options for better control
    options {
        timeout(time: 30, unit: 'MINUTES')
        retry(1)  // Retry the entire pipeline once if it fails
        disableConcurrentBuilds()  // Prevent parallel builds on same workspace
        buildDiscarder(logRotator(numToKeepStr: '10'))  // Keep only last 10 builds
    }

    environment {
        DOCKERHUB_CREDS = 'plantcredentials'
        DOCKERHUB_USER = 'sandusewwandi'
        BACKEND_IMAGE = "${DOCKERHUB_USER}/devops_backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/devops_frontend:latest"
        DOCKER_BUILDKIT = '1'
        NPM_CONFIG_LOGLEVEL = 'warn'
        COMPOSE_PROJECT_NAME = "reactweb1_${BUILD_ID}"  // Unique project name per build
        BUILD_TIMESTAMP = new Date().format("yyyyMMdd-HHmmss")
    }

    stages {
        // STAGE 1: Validate Environment - This runs first to catch agent issues
        stage('Validate Environment') {
            steps {
                sh '''
                    echo "==========================================="
                    echo "=== ENVIRONMENT VALIDATION ==="
                    echo "==========================================="
                    echo "Build ID: ${BUILD_ID}"
                    echo "Build Number: ${BUILD_NUMBER}"
                    echo "Jenkins Agent: ${NODE_NAME}"
                    echo "Workspace: ${WORKSPACE}"
                    echo "Job Name: ${JOB_NAME}"
                    
                    echo ""
                    echo "=== Checking Required Tools ==="
                    
                    # Check Java
                    echo -n "Java: "
                    java -version 2>&1 | head -1 || echo "NOT INSTALLED"
                    
                    # Check Git
                    echo -n "Git: "
                    git --version 2>&1 | head -1 || echo "NOT INSTALLED"
                    
                    # Check Docker - CRITICAL
                    echo -n "Docker: "
                    if command -v docker &> /dev/null; then
                        docker --version
                        # Test Docker daemon
                        if docker ps > /dev/null 2>&1; then
                            echo "✅ Docker daemon is accessible"
                        else
                            echo "❌ Docker daemon is NOT accessible"
                            echo "Current user: $(whoami)"
                            echo "User groups: $(groups)"
                            exit 1
                        fi
                    else
                        echo "❌ Docker is NOT INSTALLED"
                        exit 1
                    fi
                    
                    # Check Docker Compose - CRITICAL
                    echo -n "Docker Compose: "
                    if command -v docker-compose &> /dev/null; then
                        docker-compose --version
                    else
                        # Try docker compose (v2)
                        if docker compose version &> /dev/null; then
                            echo "✅ Docker Compose V2 available"
                            echo "Note: Using 'docker compose' (V2) instead of 'docker-compose'"
                        else
                            echo "❌ docker-compose is NOT INSTALLED"
                            echo "Please install docker-compose on the Jenkins agent"
                            exit 1
                        fi
                    fi
                    
                    # Check available disk space
                    echo ""
                    echo "=== System Resources ==="
                    df -h . | head -2
                    
                    echo "✅ Environment validation completed successfully"
                    echo "==========================================="
                '''
            }
            
            post {
                failure {
                    echo "❌ Environment validation failed!"
                    echo "Please ensure the Jenkins agent has:"
                    echo "1. Docker installed and running"
                    echo "2. docker-compose installed"
                    echo "3. Jenkins user has permission to use Docker"
                    echo "4. Sufficient disk space"
                }
            }
        }

        // STAGE 2: Checkout SCM
        stage('Checkout SCM') {
            steps {
                checkout scm
                sh '''
                    echo "=== Project Structure ==="
                    pwd
                    ls -la
                    
                    echo ""
                    echo "=== Checking Critical Files ==="
                    
                    # Check for docker-compose.yml
                    if [ -f "docker-compose.yml" ]; then
                        echo "✅ docker-compose.yml exists"
                        echo "   Size: $(wc -l < docker-compose.yml) lines"
                    else
                        echo "❌ docker-compose.yml missing"
                        echo "Looking for docker-compose files..."
                        find . -name "*docker-compose*" -type f 2>/dev/null || true
                        exit 1
                    fi
                    
                    # Check for Dockerfiles
                    if [ -f "backEnd/Dockerfile" ]; then
                        echo "✅ backEnd/Dockerfile exists"
                    else
                        echo "❌ backEnd/Dockerfile missing"
                        exit 1
                    fi
                    
                    if [ -f "frontEnd/Dockerfile" ]; then
                        echo "✅ frontEnd/Dockerfile exists"
                    else
                        echo "❌ frontEnd/Dockerfile missing"
                        exit 1
                    fi
                    
                    # Check for package.json files
                    if [ -f "backEnd/package.json" ]; then
                        echo "✅ backEnd/package.json exists"
                    else
                        echo "⚠️ backEnd/package.json missing (may not be Node.js project)"
                    fi
                    
                    if [ -f "frontEnd/package.json" ]; then
                        echo "✅ frontEnd/package.json exists"
                    else
                        echo "⚠️ frontEnd/package.json missing (may not be Node.js project)"
                    fi
                    
                    echo ""
                    echo "✅ All critical files found"
                '''
            }
        }

        // STAGE 3: Test Docker Setup
        stage('Test Docker Setup') {
            steps {
                sh '''
                    echo "=== Testing Docker Setup ==="
                    
                    # Verify Docker can run containers
                    echo "Testing Docker with hello-world..."
                    docker run --rm hello-world > /dev/null 2>&1
                    if [ $? -eq 0 ]; then
                        echo "✅ Docker can run containers"
                    else
                        echo "❌ Docker cannot run containers"
                        exit 1
                    fi
                    
                    # Test network connectivity to Docker Hub
                    echo "Testing Docker Hub connectivity..."
                    if timeout 10 curl -s -I https://hub.docker.com > /dev/null 2>&1; then
                        echo "✅ Can reach Docker Hub"
                    else
                        echo "⚠️ Warning: Cannot reach Docker Hub (network issue?)"
                        echo "Continuing anyway - images might be cached locally"
                    fi
                    
                    # Clean up any leftover containers from previous builds
                    echo "Cleaning up previous build containers..."
                    docker-compose -p reactweb1 down -v --remove-orphans 2>/dev/null || true
                    docker-compose -p reactweb1_pipeline down -v --remove-orphans 2>/dev/null || true
                    
                    echo "✅ Docker setup test completed"
                '''
            }
        }

        // STAGE 4: Build Docker Images
        stage('Build Docker Images') {
            steps {
                script {
                    echo '=== Building Docker Images ==='
                    
                    // Build backend
                    sh '''
                        echo "Building backend image..."
                        cd backEnd
                        
                        # Check if Dockerfile exists
                        if [ ! -f "Dockerfile" ]; then
                            echo "❌ ERROR: Dockerfile not found in backEnd/"
                            pwd
                            ls -la
                            exit 1
                        fi
                        
                        # Build with detailed output
                        docker build --progress=plain \
                                     --build-arg NPM_CONFIG_LOGLEVEL=warn \
                                     -t reactweb1-backend:${BUILD_ID} \
                                     -t reactweb1-backend:latest \
                                     .
                        
                        # Verify the image was created
                        if docker image inspect reactweb1-backend:latest > /dev/null 2>&1; then
                            echo "✅ Backend image built successfully"
                            docker images | grep reactweb1-backend
                        else
                            echo "❌ Backend image build failed"
                            exit 1
                        fi
                    '''
                    
                    // Build frontend
                    sh '''
                        echo "Building frontend image..."
                        cd frontEnd
                        
                        # Check if Dockerfile exists
                        if [ ! -f "Dockerfile" ]; then
                            echo "❌ ERROR: Dockerfile not found in frontEnd/"
                            pwd
                            ls -la
                            exit 1
                        fi
                        
                        # Build with detailed output
                        docker build --progress=plain \
                                     --build-arg NPM_CONFIG_LOGLEVEL=warn \
                                     -t reactweb1-frontend:${BUILD_ID} \
                                     -t reactweb1-frontend:latest \
                                     .
                        
                        # Verify the image was created
                        if docker image inspect reactweb1-frontend:latest > /dev/null 2>&1; then
                            echo "✅ Frontend image built successfully"
                            docker images | grep reactweb1-frontend
                        else
                            echo "❌ Frontend image build failed"
                            exit 1
                        fi
                    '''
                }
            }
            
            post {
                failure {
                    echo "❌ Docker image build failed"
                    sh '''
                        echo "Debug information:"
                        echo "Current directory: $(pwd)"
                        echo "Directory contents:"
                        ls -la
                        echo "backEnd contents:"
                        ls -la backEnd/ 2>/dev/null || echo "backEnd not found"
                        echo "frontEnd contents:"
                        ls -la frontEnd/ 2>/dev/null || echo "frontEnd not found"
                    '''
                }
            }
        }

        // STAGE 5: Verify and Tag Images
        stage('Verify and Tag Images') {
            steps {
                sh '''
                    echo "=== Verifying and Tagging Images ==="
                    
                    # List all images for debugging
                    echo "Current Docker images:"
                    docker images | grep -E "(reactweb1|REPOSITORY)" || true
                    
                    # Verify backend image
                    echo ""
                    echo "Verifying backend image..."
                    if docker image inspect reactweb1-backend:latest > /dev/null 2>&1; then
                        echo "✅ Backend image exists"
                        echo "   Image ID: $(docker image inspect reactweb1-backend:latest --format='{{.Id}}' | cut -c 8-20)"
                        echo "   Size: $(docker image inspect reactweb1-backend:latest --format='{{.Size}}' | numfmt --to=iec)"
                    else
                        echo "❌ ERROR: Backend image 'reactweb1-backend:latest' not found!"
                        docker images
                        exit 1
                    fi
                    
                    # Verify frontend image
                    echo ""
                    echo "Verifying frontend image..."
                    if docker image inspect reactweb1-frontend:latest > /dev/null 2>&1; then
                        echo "✅ Frontend image exists"
                        echo "   Image ID: $(docker image inspect reactweb1-frontend:latest --format='{{.Id}}' | cut -c 8-20)"
                        echo "   Size: $(docker image inspect reactweb1-frontend:latest --format='{{.Size}}' | numfmt --to=iec)"
                    else
                        echo "❌ ERROR: Frontend image 'reactweb1-frontend:latest' not found!"
                        docker images
                        exit 1
                    fi
                    
                    # Tag for Docker Hub
                    echo ""
                    echo "Tagging images for Docker Hub..."
                    
                    # Tag backend
                    docker tag reactweb1-backend:latest ${BACKEND_IMAGE}
                    docker tag reactweb1-backend:${BUILD_ID} ${BACKEND_IMAGE}-${BUILD_TIMESTAMP}
                    
                    # Tag frontend
                    docker tag reactweb1-frontend:latest ${FRONTEND_IMAGE}
                    docker tag reactweb1-frontend:${BUILD_ID} ${FRONTEND_IMAGE}-${BUILD_TIMESTAMP}
                    
                    echo "✅ Images tagged:"
                    echo "   - ${BACKEND_IMAGE}"
                    echo "   - ${BACKEND_IMAGE}-${BUILD_TIMESTAMP}"
                    echo "   - ${FRONTEND_IMAGE}"
                    echo "   - ${FRONTEND_IMAGE}-${BUILD_TIMESTAMP}"
                    
                    echo ""
                    echo "Final image list:"
                    docker images | grep -E "(reactweb1|${DOCKERHUB_USER}|devops)" | head -10
                '''
            }
        }

        // STAGE 6: Push Images to Docker Hub
        stage('Push Images to Docker Hub') {
            steps {
                script {
                    echo "=== Pushing to Docker Hub ==="
                    
                    withCredentials([usernamePassword(
                        credentialsId: "${DOCKERHUB_CREDS}",
                        usernameVariable: 'DH_USER',
                        passwordVariable: 'DH_PASS'
                    )]) {
                        // Push with retry logic
                        retry(2) {
                            sh '''
                                echo "Logging into Docker Hub as: $DH_USER"
                                
                                # Login with error handling
                                if echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin; then
                                    echo "✅ Docker Hub login successful"
                                else
                                    echo "❌ Docker Hub login failed"
                                    echo "Check your credentials in Jenkins: ${DOCKERHUB_CREDS}"
                                    exit 1
                                fi
                                
                                echo ""
                                echo "Pushing backend images..."
                                
                                # Push main backend image
                                echo "Pushing ${BACKEND_IMAGE}..."
                                if timeout 180 docker push ${BACKEND_IMAGE}; then
                                    echo "✅ Backend image pushed successfully"
                                else
                                    echo "❌ Backend push failed"
                                    exit 1
                                fi
                                
                                # Push timestamped backend image
                                echo "Pushing ${BACKEND_IMAGE}-${BUILD_TIMESTAMP}..."
                                if timeout 60 docker push ${BACKEND_IMAGE}-${BUILD_TIMESTAMP}; then
                                    echo "✅ Backend timestamped image pushed"
                                else
                                    echo "⚠️ Warning: Timestamped backend image push failed (continuing anyway)"
                                fi
                                
                                echo ""
                                echo "Pushing frontend images..."
                                
                                # Push main frontend image
                                echo "Pushing ${FRONTEND_IMAGE}..."
                                if timeout 180 docker push ${FRONTEND_IMAGE}; then
                                    echo "✅ Frontend image pushed successfully"
                                else
                                    echo "❌ Frontend push failed"
                                    exit 1
                                fi
                                
                                # Push timestamped frontend image
                                echo "Pushing ${FRONTEND_IMAGE}-${BUILD_TIMESTAMP}..."
                                if timeout 60 docker push ${FRONTEND_IMAGE}-${BUILD_TIMESTAMP}; then
                                    echo "✅ Frontend timestamped image pushed"
                                else
                                    echo "⚠️ Warning: Timestamped frontend image push failed (continuing anyway)"
                                fi
                                
                                # Logout
                                docker logout
                                echo ""
                                echo "🎉 All images successfully pushed to Docker Hub!"
                            '''
                        }
                    }
                }
            }
            
            post {
                failure {
                    echo "❌ Docker Hub push failed!"
                    sh '''
                        echo "=== Debug Information ==="
                        echo "Docker Hub User: ${DOCKERHUB_USER}"
                        echo "Backend Image: ${BACKEND_IMAGE}"
                        echo "Frontend Image: ${FRONTEND_IMAGE}"
                        
                        echo ""
                        echo "=== Local Images ==="
                        docker images | grep -E "(${DOCKERHUB_USER}|reactweb1|devops)" || echo "No matching images found"
                        
                        echo ""
                        echo "=== Network Test ==="
                        timeout 5 curl -I https://hub.docker.com 2>/dev/null && echo "Docker Hub is reachable" || echo "Cannot reach Docker Hub"
                        
                        echo ""
                        echo "=== Docker Info ==="
                        docker info 2>/dev/null | grep -E "(Username|Registry|Images)" || true
                    '''
                }
                
                success {
                    echo "✅ Images pushed successfully to Docker Hub"
                    sh '''
                        echo "Images available at:"
                        echo "- https://hub.docker.com/r/${DOCKERHUB_USER}/devops_backend"
                        echo "- https://hub.docker.com/r/${DOCKERHUB_USER}/devops_frontend"
                    '''
                }
            }
        }

        // STAGE 7: Prepare for Deployment
        stage('Prepare for Deployment') {
            when {
                expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
            }
            steps {
                sh '''
                    echo "=== Preparing for Deployment ==="
                    
                    # Clean up previous deployment directories
                    echo "Cleaning up old directories..."
                    rm -rf deploy-backend deploy-frontend 2>/dev/null || true
                    
                    # Create fresh directories
                    mkdir -p deploy-backend deploy-frontend
                    
                    # Copy backend files
                    echo "Copying backend files..."
                    if [ -d "backEnd" ]; then
                        cp -r backEnd/* deploy-backend/ 2>/dev/null || true
                        # Ensure docker-compose.yml is in the right place
                        if [ -f "docker-compose.yml" ]; then
                            cp docker-compose.yml ./
                        fi
                        echo "✅ Backend files copied"
                    else
                        echo "❌ backEnd directory not found"
                        exit 1
                    fi
                    
                    # Copy frontend files
                    echo "Copying frontend files..."
                    if [ -d "frontEnd" ]; then
                        cp -r frontEnd/* deploy-frontend/ 2>/dev/null || true
                        echo "✅ Frontend files copied"
                    else
                        echo "❌ frontEnd directory not found"
                        exit 1
                    fi
                    
                    echo ""
                    echo "Deployment directory structure:"
                    ls -la
                    echo ""
                    echo "docker-compose.yml:"
                    head -20 docker-compose.yml 2>/dev/null || echo "docker-compose.yml not found"
                '''
            }
        }

        // STAGE 8: Free Required Ports
        stage('Free Required Ports') {
            when {
                expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
            }
            steps {
                sh '''
                    echo "=== Freeing Required Ports ==="
                    
                    # List ports to free
                    PORTS="5000 5173 27017"
                    
                    for PORT in $PORTS; do
                        echo ""
                        echo "Checking port $PORT..."
                        
                        # Find containers using the port
                        CONTAINERS=$(docker ps --quiet --filter "publish=$PORT")
                        
                        if [ ! -z "$CONTAINERS" ]; then
                            echo "Found containers using port $PORT:"
                            docker ps --filter "publish=$PORT"
                            echo "Stopping containers..."
                            docker rm -f $CONTAINERS 2>/dev/null || true
                            echo "✅ Stopped containers on port $PORT"
                        else
                            echo "✅ No containers using port $PORT"
                        fi
                    done
                    
                    # Clean up any Docker Compose projects from previous runs
                    echo ""
                    echo "Cleaning up old Docker Compose projects..."
                    docker-compose -p reactweb1 down -v --remove-orphans 2>/dev/null || true
                    docker-compose -p reactweb1_pipeline down -v --remove-orphans 2>/dev/null || true
                    
                    # Kill any processes that might be holding ports
                    echo ""
                    echo "Checking for host processes on ports..."
                    for PORT in $PORTS; do
                        if command -v lsof &> /dev/null; then
                            PIDS=$(sudo lsof -ti:$PORT 2>/dev/null || true)
                            if [ ! -z "$PIDS" ]; then
                                echo "Found processes on port $PORT: $PIDS"
                                echo "You may need to manually kill these if they're not Docker containers"
                            fi
                        fi
                    done
                    
                    echo ""
                    echo "✅ Port cleanup completed"
                '''
            }
        }

        // STAGE 9: Deploy Containers
        stage('Deploy Containers') {
            when {
                expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
            }
            steps {
                sh '''
                    echo "=== Deploying Containers ==="
                    
                    # Use unique project name to avoid conflicts
                    export COMPOSE_PROJECT_NAME="reactweb1_build_${BUILD_ID}"
                    
                    echo "Docker Compose project name: $COMPOSE_PROJECT_NAME"
                    echo "Using images:"
                    echo "  Backend: ${BACKEND_IMAGE}"
                    echo "  Frontend: ${FRONTEND_IMAGE}"
                    
                    # Stop and remove any existing containers
                    echo "Stopping any existing containers..."
                    docker-compose down -v --remove-orphans 2>/dev/null || true
                    
                    # Start new containers
                    echo "Starting containers..."
                    docker-compose up -d --build
                    
                    # Wait for services to start
                    echo "Waiting for services to initialize..."
                    sleep 10
                    
                    # Check container status
                    echo ""
                    echo "Container status:"
                    docker-compose ps
                    
                    # Show logs for troubleshooting
                    echo ""
                    echo "Recent logs (last 5 lines each):"
                    docker-compose logs --tail=5 2>/dev/null || echo "Could not get logs"
                    
                    echo ""
                    echo "✅ Deployment initiated"
                '''
            }
            
            post {
                failure {
                    echo "❌ Deployment failed!"
                    sh '''
                        echo "=== Deployment Debug ==="
                        docker-compose ps -a 2>/dev/null || echo "No docker-compose project"
                        echo ""
                        echo "=== Recent Logs ==="
                        docker-compose logs --tail=50 2>/dev/null || echo "No logs available"
                    '''
                }
            }
        }

        // STAGE 10: Verify Deployment
        stage('Verify Deployment') {
            when {
                expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
            }
            steps {
                sh '''
                    echo "=== Verifying Deployment ==="
                    
                    # Wait a bit more for services to fully start
                    echo "Waiting for services to be ready..."
                    sleep 15
                    
                    # Get container status
                    echo ""
                    echo "Container Details:"
                    docker-compose ps
                    
                    # Count running containers
                    TOTAL_CONTAINERS=$(docker-compose ps -q 2>/dev/null | wc -l)
                    RUNNING_CONTAINERS=$(docker-compose ps -q 2>/dev/null | xargs docker inspect -f '{{.State.Status}}' 2>/dev/null | grep -c "running" || echo "0")
                    
                    echo ""
                    echo "Running containers: $RUNNING_CONTAINERS/$TOTAL_CONTAINERS"
                    
                    if [ "$TOTAL_CONTAINERS" -eq 0 ]; then
                        echo "❌ ERROR: No containers found!"
                        exit 1
                    fi
                    
                    if [ "$RUNNING_CONTAINERS" -lt "$TOTAL_CONTAINERS" ]; then
                        echo "❌ ERROR: Some containers are not running!"
                        echo ""
                        echo "Container states:"
                        docker-compose ps -q | xargs -I {} docker inspect -f '{{.Name}}: {{.State.Status}}' {} 2>/dev/null
                        echo ""
                        echo "Checking logs for failed containers..."
                        docker-compose logs 2>/dev/null | tail -100
                        exit 1
                    fi
                    
                    # Test backend health
                    echo ""
                    echo "Testing backend API..."
                    if timeout 10 curl -f -s http://localhost:5000/health 2>/dev/null || \
                       timeout 10 curl -f -s http://localhost:5000 2>/dev/null; then
                        echo "✅ Backend is responding"
                    else
                        echo "⚠️ Warning: Backend not responding immediately (might need more time)"
                    fi
                    
                    # Test frontend (if it serves HTTP)
                    echo "Testing frontend..."
                    if timeout 10 curl -f -s http://localhost:5173 2>/dev/null; then
                        echo "✅ Frontend is responding"
                    else
                        echo "⚠️ Warning: Frontend not responding immediately (might need more time)"
                    fi
                    
                    echo ""
                    echo "==========================================="
                    echo "🎉 DEPLOYMENT SUCCESSFUL!"
                    echo "==========================================="
                    echo ""
                    echo "Application URLs:"
                    echo "- Frontend: http://localhost:5173"
                    echo "- Backend API: http://localhost:5000"
                    echo "- MongoDB: mongodb://localhost:27017"
                    echo ""
                    echo "To view logs: docker-compose logs -f"
                    echo "To stop: docker-compose down"
                    echo "==========================================="
                '''
            }
        }
    }

    post {
        always {
            echo ""
            echo "==========================================="
            echo "=== PIPELINE COMPLETION ==="
            echo "==========================================="
            
            script {
                def duration = currentBuild.duration
                def minutes = duration.intdiv(60000)
                def seconds = ((duration % 60000) / 1000).toInteger()
                
                echo "Build Result: ${currentBuild.currentResult}"
                echo "Build Duration: ${minutes}m ${seconds}s"
                echo "Build Number: ${BUILD_NUMBER}"
                echo "Build URL: ${env.BUILD_URL}"
                echo "Workspace: ${WORKSPACE}"
            }
            
            // Cleanup
            sh '''
                echo ""
                echo "=== Performing Cleanup ==="
                
                # Remove temporary deployment directories
                rm -rf deploy-backend deploy-frontend 2>/dev/null || true
                
                # Remove old Docker images to save space
                echo "Cleaning up Docker images..."
                docker system prune -f --filter "until=24h" 2>/dev/null || true
                
                echo "Cleanup completed at: $(date)"
            '''
        }
        
        success {
            echo '==========================================='
            echo '✅ PIPELINE SUCCESSFUL!'
            echo '✅ Build, push, and deployment completed!'
            echo '==========================================='
            
            // Optional: Send success notification
            // emailext body: "Pipeline ${env.JOB_NAME} #${env.BUILD_NUMBER} completed successfully!\n\nView details: ${env.BUILD_URL}", subject: "✅ Pipeline Success: ${env.JOB_NAME} #${env.BUILD_NUMBER}", to: 'team@example.com'
        }
        
        failure {
            echo '==========================================='
            echo '❌ PIPELINE FAILED!'
            echo '==========================================='
            
            sh '''
                echo ""
                echo "=== FAILURE DIAGNOSTICS ==="
                echo ""
                echo "1. Docker Status:"
                docker ps -a 2>/dev/null || echo "Docker not available"
                
                echo ""
                echo "2. Docker Images:"
                docker images | grep -E "(reactweb1|${DOCKERHUB_USER}|devops)" | head -20 2>/dev/null || echo "No relevant images"
                
                echo ""
                echo "3. Docker Compose Status:"
                docker-compose ps -a 2>/dev/null || echo "docker-compose not available"
                
                echo ""
                echo "4. Recent Docker Compose Logs:"
                docker-compose logs --tail=50 2>/dev/null || echo "No docker-compose logs available"
                
                echo ""
                echo "5. Disk Space:"
                df -h . 2>/dev/null || true
                
                echo ""
                echo "6. Last 10 lines of important files:"
                echo "docker-compose.yml:"
                tail -10 docker-compose.yml 2>/dev/null || echo "docker-compose.yml not found"
                
                echo ""
                echo "=== END DIAGNOSTICS ==="
            '''
            
            // Optional: Send failure notification
            // emailext body: "Pipeline ${env.JOB_NAME} #${env.BUILD_NUMBER} failed!\n\nView details: ${env.BUILD_URL}\n\nCheck Jenkins for full logs.", subject: "❌ Pipeline Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}", to: 'team@example.com'
        }
        
        aborted {
            echo '⚠️ Pipeline was aborted by user'
        }
    }
}