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
                    '''
                    
                    echo 'Building frontend image...'
                    sh '''
                        cd frontEnd
                        docker build --progress=plain --build-arg NPM_CONFIG_LOGLEVEL=warn -t reactweb1-frontend .
                    '''
                }
            }
        }

        stage('Tag Images for Docker Hub') {
            steps {
                sh '''
                    echo "Tagging images..."
                    docker tag reactweb1-backend ${BACKEND_IMAGE}
                    docker tag reactweb1-frontend ${FRONTEND_IMAGE}
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
                        echo "Logging into Docker Hub..."
                        echo $DH_PASS | docker login -u $DH_USER --password-stdin
                        echo "Pushing backend image..."
                        docker push ${BACKEND_IMAGE}
                        echo "Pushing frontend image..."
                        docker push ${FRONTEND_IMAGE}
                        docker logout
                    '''
                }
            }
        }

        stage('Prepare for Deployment') {
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
                docker-compose logs --tail=50 2>/dev/null || true
                docker ps -a 2>/dev/null || true
            '''
        }
    }
}