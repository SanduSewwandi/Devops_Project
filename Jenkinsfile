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
        stage('Checkout & Setup') {
            steps {
                retry(2) {
                    checkout scm
                }
                script {
                    // Automatically fetch the EC2 Public IP for the CORS fix
                    def publicIp = sh(script: "curl -s http://169.254.169.254/latest/meta-data/public-ipv4", returnStdout: true).trim()
                    echo "=== Detected Public IP: ${publicIp} ==="

                    // Generate docker-compose.yml with dynamic IP injection
                    writeFile file: 'docker-compose.yml', text: """
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
    image: ${BACKEND_IMAGE}
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
    image: ${FRONTEND_IMAGE}
    container_name: frontend
    ports:
      - "5173:5173"
    environment:
      # Fixes the CORS/localhost error by pointing to the EC2 Public IP
      - REACT_APP_API_URL=http://${publicIp}:5000
      - VITE_API_URL=http://${publicIp}:5000
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mongo_data:
"""
                }
            }
        }

        stage('Clean Previous') {
            steps {
                sh '''
                    docker-compose down -v --remove-orphans || true
                    docker image prune -f
                '''
            }
        }

        stage('Build Images') {
            steps {
                // Sequential build to ensure stability even with swap
                sh '''
                    echo "Building backend..."
                    cd backEnd && docker build -t ${BACKEND_IMAGE} .
                    
                    echo "Building frontend..."
                    cd ../frontEnd && docker build -t ${FRONTEND_IMAGE} .
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
                        echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
                        docker push ${BACKEND_IMAGE}
                        docker push ${FRONTEND_IMAGE}
                        docker logout
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    docker-compose up -d
                    echo "Waiting for stabilization..."
                    sleep 15
                '''
            }
        }

        stage('Verify') {
            steps {
                sh '''
                    running=$(docker-compose ps --services --filter "status=running" | wc -l)
                    if [ "$running" -eq 3 ]; then
                        echo "✅ SUCCESS: All containers are running!"
                        PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
                        echo "Frontend: http://$PUBLIC_IP:5173"
                    else
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
    }
}