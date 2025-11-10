pipeline {
    agent any

    environment {
        DOCKERHUB_USER = "sandusewwandi"
        DOCKER_HUB_PASSWORD = credentials('docker-hub-password') // Jenkins secret
        FRONTEND_IMAGE = "devops_frontend"
        BACKEND_IMAGE = "devops_backend"
        FRONTEND_TAG   = "${DOCKERHUB_USER}/${FRONTEND_IMAGE}:latest"
        BACKEND_TAG    = "${DOCKERHUB_USER}/${BACKEND_IMAGE}:latest"
    }

    stages {

        stage('Build Backend Image') {
            steps {
                echo "Building Backend Docker Image..."
                sh "docker build -t ${BACKEND_TAG} ./backEnd"
            }
        }

        stage('Build Frontend Image') {
            steps {
                echo "Building Frontend Docker Image..."
                sh "docker build -t ${FRONTEND_TAG} ./frontEnd"
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                echo "Logging in to Docker Hub..."
                sh "echo ${DOCKER_HUB_PASSWORD} | docker login -u ${DOCKERHUB_USER} --password-stdin"
                
                echo "Pushing Backend Image..."
                sh "docker push ${BACKEND_TAG}"
                
                echo "Pushing Frontend Image..."
                sh "docker push ${FRONTEND_TAG}"
            }
        }

        stage('Deploy Containers') {
            steps {
                echo "Stopping existing containers..."
                sh "docker rm -f devops-backend || true"
                sh "docker rm -f devops-frontend || true"

                echo "Running Backend Container..."
                sh "docker run -d --name devops-backend -p 8080:8080 ${BACKEND_TAG}"

                echo "Running Frontend Container..."
                sh "docker run -d --name devops-frontend -p 5173:5173 ${FRONTEND_TAG}"
            }
        }
    }

    post {
        success {
            echo "Deployment Successful!"
        }
        failure {
            echo "Deployment Failed!"
        }
    }
}
