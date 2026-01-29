pipeline {
    agent any

    environment {
        DOCKERHUB_CREDS = 'plantcredentials'
        DOCKERHUB_USER = 'sandusewwandi'
        BACKEND_IMAGE = "${DOCKERHUB_USER}/devops_backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/devops_frontend:latest"
        // Enable BuildKit for faster builds
        DOCKER_BUILDKIT = '1'
        BUILDKIT_PROGRESS = 'plain'
        // Set npm to non-interactive
        NPM_CONFIG_LOGLEVEL = 'warn'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                // Verify project structure
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
                '''
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        script {
                            echo 'Building backend image...'
                            // Build with detailed output and error handling
                            sh '''
                                echo "Building from: $(pwd)/backEnd"
                                echo "Files in backEnd:"
                                ls -la backEnd/ || echo "Cannot list backEnd directory"
                                
                                # Build backend with error handling
                                if cd backEnd && docker build \
                                    --progress=plain \
                                    --build-arg NPM_CONFIG_LOGLEVEL=warn \
                                    -t reactweb1-backend \
                                    -t ${BACKEND_IMAGE} . ; then
                                    echo "✅ Backend build successful"
                                    docker images | grep reactweb1-backend
                                else
                                    echo "❌ Backend build failed"
                                    exit 1
                                fi
                            '''
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        script {
                            echo 'Building frontend image...'
                            sh '''
                                echo "Building from: $(pwd)/frontEnd"
                                echo "Files in frontEnd:"
                                ls -la frontEnd/ || echo "Cannot list frontEnd directory"
                                
                                # Build frontend with error handling
                                if cd frontEnd && docker build \
                                    --progress=plain \
                                    --build-arg NPM_CONFIG_LOGLEVEL=warn \
                                    -t reactweb1-frontend \
                                    -t ${FRONTEND_IMAGE} . ; then
                                    echo "✅ Frontend build successful"
                                    docker images | grep reactweb1-frontend
                                else
                                    echo "❌ Frontend build failed"
                                    exit 1
                                fi
                            '''
                        }
                    }
                }
            }
        }

        stage('Push Images to Docker Hub') {
            parallel {
                stage('Push Backend') {
                    steps {
                        withCredentials([usernamePassword(
                            credentialsId: "${DOCKERHUB_CREDS}",
                            usernameVariable: 'DH_USER',
                            passwordVariable: 'DH_PASS'
                        )]) {
                            sh '''
                                echo "Logging into Docker Hub as ${DH_USER}..."
                                echo ${DH_PASS} | docker login -u ${DH_USER} --password-stdin
                                echo "Pushing backend image: ${BACKEND_IMAGE}"
                                docker push ${BACKEND_IMAGE} || echo "Push failed, continuing..."
                            '''
                        }
                    }
                }
                stage('Push Frontend') {
                    steps {
                        withCredentials([usernamePassword(
                            credentialsId: "${DOCKERHUB_CREDS}",
                            usernameVariable: 'DH_USER',
                            passwordVariable: 'DH_PASS'
                        )]) {
                            sh '''
                                echo "Logging into Docker Hub as ${DH_USER}..."
                                echo ${DH_PASS} | docker login -u ${DH_USER} --password-stdin
                                echo "Pushing frontend image: ${FRONTEND_IMAGE}"
                                docker push ${FRONTEND_IMAGE} || echo "Push failed, continuing..."
                            '''
                        }
                    }
                }
            }
            post {
                always {
                    sh 'docker logout 2>/dev/null || true'
                }
            }
        }

        stage('Prepare for Deployment') {
            steps {
                echo 'Setting up folders for docker-compose...'
                sh '''
                    # Clean old folders
                    rm -rf backend frontend 2>/dev/null || true
                    
                    # Copy folders (preserving structure)
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
                    
                    echo "=== Current directory ==="
                    ls -la
                '''
            }
        }

        stage('Free Required Ports') {
            steps {
                script {
                    echo 'Cleaning up old containers on ports 5000, 5173, 27017...'
                    sh '''
                        echo "=== Current running containers ==="
                        docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
                        
                        # Stop containers using specific ports
                        for port in 5000 5173 27017; do
                            echo "Checking port: $port"
                            container_ids=$(docker ps -q --filter "publish=$port")
                            if [ ! -z "$container_ids" ]; then
                                echo "Stopping containers on port $port: $container_ids"
                                docker stop $container_ids 2>/dev/null || true
                                docker rm -f $container_ids 2>/dev/null || true
                            fi
                        done
                        
                        # Clean up unused resources
                        docker system prune -f 2>/dev/null || true
                    '''
                }
            }
        }

        stage('Deploy Containers') {
            steps {
                echo 'Starting deployment with Docker Compose...'
                sh '''
                    echo "=== Current directory for docker-compose ==="
                    pwd
                    ls -la docker-compose.yml || echo "docker-compose.yml not found in current directory"
                    
                    # Stop existing containers
                    echo "Stopping any existing containers..."
                    docker-compose down -v --remove-orphans 2>/dev/null || true
                    
                    # Start new containers
                    echo "Building and starting containers..."
                    DOCKER_BUILDKIT=1 docker-compose up -d --build
                    
                    # Wait and check status
                    echo "Waiting for services to start..."
                    sleep 15
                    
                    echo "=== Container Status ==="
                    docker-compose ps
                    
                    echo "=== Checking container health ==="
                    for container in $(docker-compose ps -q); do
                        name=$(docker inspect --format='{{.Name}}' $container | sed 's/\\///')
                        state=$(docker inspect --format='{{.State.Status}}' $container)
                        echo "Container $name: $state"
                    done
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                script {
                    echo 'Verifying services are running...'
                    sh '''
                        # Count running containers
                        total=$(docker-compose ps -q | wc -l)
                        running=$(docker-compose ps -q | xargs docker inspect -f '{{.State.Status}}' 2>/dev/null | grep -c "running" || echo "0")
                        
                        echo "Running containers: $running/$total"
                        
                        if [ "$running" -eq "$total" ] && [ "$total" -gt 0 ]; then
                            echo "✅ DEPLOYMENT SUCCESSFUL!"
                            echo "All $total containers are running"
                            
                            # Show service URLs
                            echo ""
                            echo "🌐 SERVICE ENDPOINTS:"
                            echo "- Backend API: http://localhost:5000"
                            echo "- Frontend App: http://localhost:5173"
                            echo "- MongoDB: mongodb://localhost:27017"
                            echo ""
                            
                            # Quick health checks
                            echo "🔧 HEALTH CHECKS:"
                            echo "Checking backend..."
                            curl -f http://localhost:5000/health 2>/dev/null && echo "✅ Backend is responding" || echo "⚠️  Backend health check failed"
                            
                        else
                            echo "❌ DEPLOYMENT FAILED"
                            echo "Only $running out of $total containers are running"
                            echo ""
                            echo "Debug information:"
                            docker-compose ps
                            docker-compose logs --tail=50
                            exit 1
                        fi
                    '''
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline cleanup and reporting...'
            sh '''
                echo "=== Cleanup ==="
                rm -rf backend frontend 2>/dev/null || true
                
                # Clean up old images (keep recent ones)
                docker image prune -f --filter "until=24h" 2>/dev/null || true
                
                echo "=== Resource Usage ==="
                docker system df
                df -h .
            '''
            
            script {
                def duration = currentBuild.duration
                def minutes = duration.intdiv(60000)
                def seconds = ((duration % 60000) / 1000).toInteger()
                
                echo "==========================================="
                echo "📊 BUILD REPORT"
                echo "==========================================="
                echo "Result: ${currentBuild.currentResult}"
                echo "Duration: ${minutes}m ${seconds}s"
                echo "Build Number: ${env.BUILD_NUMBER}"
                echo "Build URL: ${env.BUILD_URL}"
                echo "==========================================="
            }
        }
        
        success {
            echo '🎉 Build and deployment completed successfully!'
            sh '''
                echo ""
                echo "🚀 APPLICATION IS LIVE!"
                echo "========================="
                echo "Backend API:  http://localhost:5000"
                echo "Frontend App: http://localhost:5173"
                echo "MongoDB:      mongodb://localhost:27017"
                echo ""
                echo "To view logs: docker-compose logs -f"
                echo "To stop:      docker-compose down"
                echo "========================="
            '''
        }
        
        failure {
            echo '❌ Build failed! Debug information:'
            sh '''
                echo "=== Last 100 lines of logs ==="
                docker-compose logs --tail=100 2>/dev/null || echo "No docker-compose logs available"
                
                echo ""
                echo "=== All Docker containers ==="
                docker ps -a 2>/dev/null || echo "Cannot list docker containers"
                
                echo ""
                echo "=== Docker images ==="
                docker images | head -20 2>/dev/null || echo "Cannot list docker images"
            '''
        }
        
        cleanup {
            echo 'Cleaning up workspace...'
            cleanWs()
        }
    }
}