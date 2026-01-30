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
        stage('Checkout') {
            steps {
                retry(2) {
                    checkout scm
                }
                sh '''
                    echo "=== Project Structure ==="
                    pwd
                    ls -la

                    echo "=== Checking Critical Files ==="
                    test -f docker-compose.yml && echo "✅ docker-compose.yml exists" || echo "⚠️ Creating docker-compose.yml"
                    test -f backEnd/Dockerfile && echo "✅ backEnd/Dockerfile exists" || echo "❌ backEnd/Dockerfile missing"
                    test -f frontEnd/Dockerfile && echo "✅ frontEnd/Dockerfile exists" || echo "❌ frontEnd/Dockerfile missing"
                    
                    # Create a simple docker-compose.yml
                    echo "version: '3'" > docker-compose.yml
                    echo "services:" >> docker-compose.yml
                    echo "  mongodb:" >> docker-compose.yml
                    echo "    image: mongo:6" >> docker-compose.yml
                    echo "    container_name: mongodb" >> docker-compose.yml
                    echo "    ports:" >> docker-compose.yml
                    echo "      - \"27017:27017\"" >> docker-compose.yml
                    echo "    volumes:" >> docker-compose.yml
                    echo "      - mongo_data:/data/db" >> docker-compose.yml
                    echo "    restart: unless-stopped" >> docker-compose.yml
                    echo "" >> docker-compose.yml
                    echo "  backend:" >> docker-compose.yml
                    echo "    image: sandusewwandi/devops_backend:latest" >> docker-compose.yml
                    echo "    container_name: backend" >> docker-compose.yml
                    echo "    ports:" >> docker-compose.yml
                    echo "      - \"5000:5000\"" >> docker-compose.yml
                    echo "    environment:" >> docker-compose.yml
                    echo "      MONGODB_URI: mongodb://mongodb:27017/devops" >> docker-compose.yml
                    echo "      NODE_ENV: production" >> docker-compose.yml
                    echo "    depends_on:" >> docker-compose.yml
                    echo "      - mongodb" >> docker-compose.yml
                    echo "    restart: unless-stopped" >> docker-compose.yml
                    echo "" >> docker-compose.yml
                    echo "  frontend:" >> docker-compose.yml
                    echo "    image: sandusewwandi/devops_frontend:latest" >> docker-compose.yml
                    echo "    container_name: frontend" >> docker-compose.yml
                    echo "    ports:" >> docker-compose.yml
                    echo "      - \"5173:5173\"" >> docker-compose.yml
                    echo "    depends_on:" >> docker-compose.yml
                    echo "      - backend" >> docker-compose.yml
                    echo "    restart: unless-stopped" >> docker-compose.yml
                    echo "" >> docker-compose.yml
                    echo "volumes:" >> docker-compose.yml
                    echo "  mongo_data:" >> docker-compose.yml
                    
                    echo "✅ docker-compose.yml created"
                    echo "=== docker-compose.yml content ==="
                    cat docker-compose.yml
                '''
            }
        }

        stage('Test Docker Setup') {
            steps {
                sh '''
                    echo "=== Testing Docker ==="
                    docker --version
                    docker ps > /dev/null
                    docker-compose --version
                    echo "✅ Docker is running"
                '''
            }
        }

        stage('Clean Previous Deployment') {
            steps {
                sh '''
                    echo "=== Cleaning Previous Deployment ==="
                    docker-compose down -v --remove-orphans 2>/dev/null || true
                    docker rm -f $(docker ps -aq) 2>/dev/null || true
                    docker network prune -f 2>/dev/null || true
                    echo "✅ Cleanup completed"
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    echo "=== Building Images ==="
                    
                    echo "Building backend..."
                    cd backEnd
                    docker build -t reactweb1-backend .
                    docker tag reactweb1-backend ${BACKEND_IMAGE}
                    
                    echo "Building frontend..."
                    cd ../frontEnd
                    docker build -t reactweb1-frontend .
                    docker tag reactweb1-frontend ${FRONTEND_IMAGE}
                    
                    echo "✅ Images built and tagged"
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
                        echo "✅ Images pushed"
                    '''
                }
            }
        }

        stage('Deploy Containers') {
            steps {
                sh '''
                    echo "=== Deploying Containers ==="
                    
                    echo "Starting services..."
                    docker-compose up -d
                    
                    echo "Waiting for services to start..."
                    sleep 15
                    
                    echo "=== Container Status ==="
                    docker-compose ps
                    
                    # Check if containers are running
                    echo "=== Health Check ==="
                    for container in mongodb backend frontend; do
                        if docker-compose ps $container | grep -q "Up"; then
                            echo "✅ $container is running"
                        else
                            echo "❌ $container is NOT running"
                            docker-compose logs $container --tail=10
                        fi
                    done
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    echo "=== Verifying Deployment ==="
                    
                    # Final check
                    sleep 5
                    
                    echo "=== Final Container Status ==="
                    docker-compose ps
                    
                    # Count running containers
                    running=$(docker-compose ps -q | xargs docker inspect -f "{{.State.Status}}" 2>/dev/null | grep -c "running")
                    
                    if [ "$running" -eq 3 ]; then
                        echo "✅ SUCCESS: All 3 containers are running!"
                        
                        echo ""
                        echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY"
                        echo "======================================="
                        echo "Services deployed:"
                        echo "1. MongoDB:    localhost:27017"
                        echo "2. Backend:    localhost:5000"
                        echo "3. Frontend:   localhost:5173"
                        echo "======================================="
                        
                        # Get EC2 public IP
                        echo ""
                        echo "🌐 Public Access URLs:"
                        if PUBLIC_IP=$(curl -s --max-time 5 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null); then
                            echo "Backend API:  http://$PUBLIC_IP:5000"
                            echo "Frontend App: http://$PUBLIC_IP:5173"
                        else
                            echo "Use your EC2 public IP with ports 5000 and 5173"
                        fi
                    else
                        echo "❌ ERROR: Only $running/3 containers are running"
                        echo "=== Debug Info ==="
                        docker-compose ps -a
                        docker-compose logs --tail=50
                        exit 1
                    fi
                '''
            }
        }
    }

    post {
        always {
            echo "==========================================="
            echo "Build Result: ${currentBuild.currentResult}"
            echo "Build URL: ${env.BUILD_URL}"
            echo "Build Number: ${env.BUILD_NUMBER}"
            echo "==========================================="
        }
        
        success {
            echo "🎉 PIPELINE COMPLETED SUCCESSFULLY"
        }
        
        failure {
            echo "❌ PIPELINE FAILED"
        }
    }
}