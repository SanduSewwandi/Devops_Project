pipeline {
    agent any

    environment {
        DOCKERHUB_CREDS = 'plantcredentials'
        DOCKERHUB_USER = 'sandusewwandi'
        BACKEND_IMAGE = "${DOCKERHUB_USER}/devops_backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/devops_frontend:latest"
        DOCKER_BUILDKIT = '1'
        NPM_CONFIG_LOGLEVEL = 'warn'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh '''
                    echo "=== Project Structure ==="
                    pwd
                    ls -la
                    echo "=== Checking Critical Files ==="
                    test -f docker-compose.yml && echo "✅ docker-compose.yml exists" || echo "❌ docker-compose.yml missing"
                    test -f backEnd/Dockerfile && echo "✅ backEnd/Dockerfile exists" || echo "❌ backEnd/Dockerfile missing"
                    test -f frontEnd/Dockerfile && echo "✅ frontEnd/Dockerfile exists" || echo "❌ frontEnd/Dockerfile missing"
                '''
            }
        }

        stage('Test Docker Setup') {
            steps {
                sh '''
                    echo "=== Testing Docker ==="
                    docker --version || echo "❌ Docker not installed"
                    docker ps > /dev/null 2>&1 && echo "✅ Docker daemon is running" || echo "❌ Cannot connect to Docker daemon"
                    
                    # Test network connectivity to Docker Hub
                    echo "Testing Docker Hub connectivity..."
                    timeout 10 curl -I https://hub.docker.com 2>/dev/null && echo "✅ Can reach Docker Hub" || echo "⚠️ Cannot reach Docker Hub"
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    echo 'Building backend image...'
                    sh '''
                        cd backEnd
                        docker build --progress=plain --build-arg NPM_CONFIG_LOGLEVEL=warn -t reactweb1-backend .
                        echo "✅ Backend image built: reactweb1-backend"
                        docker images | grep reactweb1-backend
                    '''
                    
                    echo 'Building frontend image...'
                    sh '''
                        cd frontEnd
                        docker build --progress=plain --build-arg NPM_CONFIG_LOGLEVEL=warn -t reactweb1-frontend .
                        echo "✅ Frontend image built: reactweb1-frontend"
                        docker images | grep reactweb1-frontend
                    '''
                }
            }
        }

        stage('Verify and Tag Images') {
            steps {
                sh '''
                    echo "=== Verifying Images ==="
                    
                    # Check if images exist
                    if ! docker image inspect reactweb1-backend > /dev/null 2>&1; then
                        echo "❌ ERROR: Backend image 'reactweb1-backend' not found!"
                        docker images
                        exit 1
                    fi
                    
                    if ! docker image inspect reactweb1-frontend > /dev/null 2>&1; then
                        echo "❌ ERROR: Frontend image 'reactweb1-frontend' not found!"
                        docker images
                        exit 1
                    fi
                    
                    echo "✅ Both images exist"
                    
                    echo "Tagging images for Docker Hub..."
                    docker tag reactweb1-backend ${BACKEND_IMAGE}
                    docker tag reactweb1-frontend ${FRONTEND_IMAGE}
                    
                    echo "✅ Images tagged:"
                    echo "   - ${BACKEND_IMAGE}"
                    echo "   - ${FRONTEND_IMAGE}"
                    
                    docker images | grep -E "(${DOCKERHUB_USER}|reactweb1)"
                '''
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                script {
                    echo "=== Pushing to Docker Hub ==="
                    
                    withCredentials([usernamePassword(
                        credentialsId: "${DOCKERHUB_CREDS}",
                        usernameVariable: 'DH_USER',
                        passwordVariable: 'DH_PASS'
                    )]) {
                        // Try to push with retry logic
                        retry(3) {
                            sh '''
                                echo "Attempting Docker Hub login for user: $DH_USER"
                                
                                # Login with detailed output
                                if echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin; then
                                    echo "✅ Docker Hub login successful"
                                else
                                    echo "❌ Docker Hub login failed"
                                    echo "Debug: Checking credentials..."
                                    echo "Username length: ${#DH_USER}"
                                    echo "Password length: ${#DH_PASS}"
                                    exit 1
                                fi
                                
                                # Push backend with timeout
                                echo "Pushing ${BACKEND_IMAGE}..."
                                if timeout 300 docker push ${BACKEND_IMAGE}; then
                                    echo "✅ Backend image pushed successfully"
                                else
                                    echo "❌ Backend push failed"
                                    echo "Checking image details:"
                                    docker image inspect ${BACKEND_IMAGE} --format='{{.RepoTags}}'
                                    exit 1
                                fi
                                
                                # Push frontend with timeout
                                echo "Pushing ${FRONTEND_IMAGE}..."
                                if timeout 300 docker push ${FRONTEND_IMAGE}; then
                                    echo "✅ Frontend image pushed successfully"
                                else
                                    echo "❌ Frontend push failed"
                                    exit 1
                                fi
                                
                                docker logout
                                echo "🎉 All images successfully pushed to Docker Hub!"
                            '''
                        }
                    }
                }
            }
            
            post {
                failure {
                    echo "❌ Docker Hub push failed. Debug information:"
                    sh '''
                        echo "=== Docker Images ==="
                        docker images | grep -E "(${DOCKERHUB_USER}|reactweb1|devops)"
                        
                        echo "=== Docker Info ==="
                        docker info 2>/dev/null | head -20
                        
                        echo "=== Network Test ==="
                        curl -I https://hub.docker.com --connect-timeout 5 2>/dev/null || echo "Cannot reach Docker Hub"
                    '''
                }
            }
        }

        stage('Debug Docker Hub Issue') {
            when {
                expression { currentBuild.result == 'FAILURE' }
            }
            steps {
                script {
                    echo "=== Debugging Docker Hub Issue ==="
                    
                    withCredentials([usernamePassword(
                        credentialsId: "${DOCKERHUB_CREDS}",
                        usernameVariable: 'DH_USER',
                        passwordVariable: 'DH_PASS'
                    )]) {
                        sh '''
                            echo "Testing Docker Hub credentials manually..."
                            echo "Username: $DH_USER"
                            
                            # Try API test
                            echo "Testing Docker Hub API..."
                            if curl -s -u "$DH_USER:$DH_PASS" https://hub.docker.com/v2/ > /dev/null 2>&1; then
                                echo "✅ Docker Hub API accessible with credentials"
                            else
                                echo "❌ Cannot access Docker Hub API"
                            fi
                            
                            # Check if image names are valid
                            echo "Checking image names..."
                            echo "Backend: ${BACKEND_IMAGE}"
                            echo "Frontend: ${FRONTEND_IMAGE}"
                            
                            # Docker Hub requires lowercase
                            if [[ "${BACKEND_IMAGE}" =~ [A-Z] ]]; then
                                echo "⚠️ WARNING: Image name contains uppercase letters. Docker Hub requires lowercase."
                            fi
                            
                            # Try manual push with verbose
                            echo "Trying manual push with verbose output..."
                            docker push ${BACKEND_IMAGE} 2>&1 | head -50
                        '''
                    }
                }
            }
        }

        stage('Prepare for Deployment') {
            when {
                expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
            }
            steps {
                sh '''
                    echo "Preparing folder structure..."
                    rm -rf backend frontend 2>/dev/null || true
                    
                    if [ -d "backEnd" ]; then
                        cp -r backEnd backend
                        echo "✅ Copied backEnd to backend"
                    else
                        echo "❌ backEnd directory not found"
                        exit 1
                    fi
                    
                    if [ -d "frontEnd" ]; then
                        cp -r frontEnd frontend
                        echo "✅ Copied frontEnd to frontend"
                    else
                        echo "❌ frontEnd directory not found"
                        exit 1
                    fi
                    
                    echo "Current directory:"
                    ls -la
                '''
            }
        }

        stage('Free Required Ports') {
            when {
                expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
            }
            steps {
                sh '''
                    echo "Cleaning up old containers..."
                    docker rm -f reactweb1_pipeline_backend_1 reactweb1_pipeline_frontend_1 reactweb1_pipeline_mongo_1 2>/dev/null || true
                    docker rm -f reactweb1_backend_1 reactweb1_frontend_1 reactweb1_mongo_1 2>/dev/null || true

                    echo "Checking ports 5000, 5173, 27017..."
                    for port in 5000 5173 27017; do
                        container_ids=$(docker ps -q --filter "publish=$port")
                        if [ ! -z "$container_ids" ]; then
                            echo "Stopping container using port $port: $container_ids"
                            docker rm -f $container_ids 2>/dev/null || true
                        fi
                        echo "✅ Port $port is free"
                    done
                '''
            }
        }

        stage('Deploy Containers') {
            when {
                expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
            }
            steps {
                sh '''
                    echo "Deploying with Docker Compose..."
                    docker-compose down -v --remove-orphans 2>/dev/null || true
                    docker-compose up -d --build
                    
                    echo "Waiting for services to start..."
                    sleep 15
                    docker-compose ps
                '''
            }
        }

        stage('Verify Deployment') {
            when {
                expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
            }
            steps {
                sh '''
                    echo "Verifying deployment..."
                    total=$(docker-compose ps -q | wc -l)
                    running=$(docker-compose ps -q | xargs docker inspect -f '{{.State.Status}}' 2>/dev/null | grep -c "running" || echo "0")
                    
                    echo "Running containers: $running/$total"
                    
                    if [ "$running" -eq "$total" ] && [ "$total" -gt 0 ]; then
                        echo "✅ DEPLOYMENT SUCCESSFUL!"
                        echo ""
                        echo "Service URLs:"
                        echo "- Backend API: http://localhost:5000"
                        echo "- Frontend App: http://localhost:5173"
                        echo "- MongoDB: mongodb://localhost:27017"
                    else
                        echo "❌ DEPLOYMENT FAILED"
                        docker-compose ps
                        docker-compose logs --tail=20
                        exit 1
                    fi
                '''
            }
        }
    }

    post {
        always {
            sh '''
                echo "=== Cleanup ==="
                rm -rf backend frontend 2>/dev/null || true
                docker system prune -f 2>/dev/null || true
                echo "Build completed at: $(date)"
            '''
            
            script {
                def duration = currentBuild.duration
                def minutes = duration.intdiv(60000)
                def seconds = ((duration % 60000) / 1000).toInteger()
                
                echo "==========================================="
                echo "Build Result: ${currentBuild.currentResult}"
                echo "Build Duration: ${minutes}m ${seconds}s"
                echo "Build URL: ${env.BUILD_URL}"
                echo "==========================================="
            }
        }
        
        success {
            echo '✅ Build and deployment completed successfully!'
        }
        
        failure {
            echo '❌ Build failed!'
            sh '''
                echo "Debug information:"
                echo "=== Docker Status ==="
                docker ps -a 2>/dev/null || true
                echo ""
                echo "=== Docker Images ==="
                docker images | head -20 2>/dev/null || true
                echo ""
                echo "=== Last Docker Compose Logs ==="
                docker-compose logs --tail=30 2>/dev/null || echo "No docker-compose logs"
            '''
        }
    }
}