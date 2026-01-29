pipeline {
    agent any

    environment {
        // Correct usage of Jenkins credentials
        DOCKERHUB_CREDS = credentials('plantcredentials') // no ternary operator here
        DOCKERHUB_USER  = 'sandusewwandi'
        BACKEND_IMAGE   = "${DOCKERHUB_USER}/devops_backend:latest"
        FRONTEND_IMAGE  = "${DOCKERHUB_USER}/devops_frontend:latest"
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
                    test -f docker-compose.yml
                    test -f backEnd/Dockerfile
                    test -f frontEnd/Dockerfile
                    echo "✅ All required files exist"
                    
                    echo "=== Creating docker-compose.yml ==="
                    cat > docker-compose.yml << 'EOF'
version: '3'

services:
  frontend:
    image: sandusewwandi/devops_frontend:latest
    container_name: frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    image: sandusewwandi/devops_backend:latest
    container_name: backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/devops
    depends_on:
      - mongodb
    restart: unless-stopped

  mongodb:
    image: mongo:6
    container_name: mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

volumes:
  mongo_data:
EOF
                    echo "✅ docker-compose.yml created"
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

        stage('Build Docker Images') {
            steps {
                sh '''
                    echo "=== Building Images ==="
                    
                    # Build backend
                    cd backEnd
                    docker build -t reactweb1-backend .
                    docker tag reactweb1-backend ${BACKEND_IMAGE}
                    
                    # Build frontend
                    cd ../frontEnd
                    docker build -t reactweb1-frontend .
                    docker tag reactweb1-frontend ${FRONTEND_IMAGE}
                    
                    echo "✅ Images built and tagged"
                    docker images | grep -E "devops|reactweb"
                '''
            }
        }

        stage('Push Images to Docker Hub') {
            when {
                expression { env.DOCKERHUB_CREDS != '' }
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'plantcredentials',
                    usernameVariable: 'DH_USER',
                    passwordVariable: 'DH_PASS'
                )]) {
                    sh '''
                        echo "=== Pushing to Docker Hub ==="
                        echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
                        
                        docker push ${BACKEND_IMAGE}
                        docker push ${FRONTEND_IMAGE}
                        
                        docker logout
                        echo "✅ Images pushed successfully"
                    '''
                }
            }
        }

        stage('Skip Docker Hub Push') {
            when {
                expression { env.DOCKERHUB_CREDS == '' }
            }
            steps {
                sh '''
                    echo "⚠️ Skipping Docker Hub push - credentials not configured"
                    echo "Using local images only"
                '''
            }
        }

        stage('Cleanup Before Deployment') {
            steps {
                sh '''
                    echo "=== Cleaning Up ==="
                    docker-compose down -v --remove-orphans 2>/dev/null || true
                    docker rm -f $(docker ps -aq) 2>/dev/null || true
                    echo "✅ Cleanup completed"
                '''
            }
        }

        stage('Deploy Containers') {
            steps {
                sh '''
                    echo "=== Deploying Containers ==="
                    docker-compose up -d
                    sleep 10
                    docker-compose ps
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    echo "=== Verifying Deployment ==="
                    total=$(docker-compose ps -q | wc -l)
                    running=$(docker-compose ps -q | xargs docker inspect -f "{{.State.Status}}" 2>/dev/null | grep -c "running")
                    
                    echo "Containers running: $running/$total"
                    
                    if [ "$running" -ne "$total" ]; then
                        echo "❌ Not all containers are running"
                        docker-compose ps -a
                        docker-compose logs --tail=50
                        exit 1
                    fi
                    
                    echo "✅ All containers are running"
                    
                    # Optional service test
                    curl -s -f http://localhost:5000 || echo "⚠️ Backend not responding"
                    curl -s -f http://localhost:5173 || echo "⚠️ Frontend not responding"
                '''
            }
        }
    }

    post {
        always {
            sh '''
                echo "=== Post Build Summary ==="
                docker-compose ps -a 2>/dev/null || docker ps -a
                docker images | grep -E "devops|reactweb|mongo"
            '''
        }
        success {
            echo "🎉 PIPELINE SUCCESS"
        }
        failure {
            echo "❌ PIPELINE FAILED"
        }
    }
}
