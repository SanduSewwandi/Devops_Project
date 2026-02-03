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
                    ls -la

                    echo "=== Generating docker-compose.yml ==="
                    cat <<EOF > docker-compose.yml
version: '3'
services:
  mongodb:
    image: mongo:6
    container_name: mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  backend:
    image: ${DOCKERHUB_USER}/devops_backend:latest
    container_name: backend
    ports:
      - "5000:5000"
    environment:
      MONGODB_URI: mongodb://mongodb:27017/devops
      NODE_ENV: production
    depends_on:
      - mongodb
    restart: unless-stopped

  frontend:
    image: ${DOCKERHUB_USER}/devops_frontend:latest
    container_name: frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
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
                    docker --version
                    docker-compose --version
                    echo "✅ Docker environment is ready"
                '''
            }
        }

        stage('Clean Previous Deployment') {
            steps {
                sh '''
                    docker-compose down -v --remove-orphans || true
                    docker system prune -f || true
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    echo "Building backend..."
                    cd backEnd && docker build -t ${BACKEND_IMAGE} .
                    
                    echo "Building frontend..."
                    cd ../frontEnd && docker build -t ${FRONTEND_IMAGE} .
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
                        echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
                        docker push ${BACKEND_IMAGE}
                        docker push ${FRONTEND_IMAGE}
                        docker logout
                    '''
                }
            }
        }

        stage('Deploy Containers') {
            steps {
                sh '''
                    docker-compose up -d
                    sleep 10
                    docker-compose ps
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    running=$(docker-compose ps --services --filter "status=running" | wc -l)
                    if [ "$running" -eq 3 ]; then
                        echo "✅ SUCCESS: All 3 containers are running!"
                        PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || echo "localhost")
                        echo "Access App at: http://$PUBLIC_IP:5173"
                    else
                        echo "❌ ERROR: Only $running containers are running"
                        docker-compose logs
                        exit 1
                    fi
                '''
            }
        }
    }

    post {
        always {
            echo "Build Result: ${currentBuild.currentResult}"
        }
        success {
            echo "🎉 PIPELINE COMPLETED SUCCESSFULLY"
        }
        failure {
            echo "❌ PIPELINE FAILED"
        }
    }
} 