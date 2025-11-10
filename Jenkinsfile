pipeline {
    agent any

    environment {
        DOCKERHUB_CREDS = 'plantcredential'
        DOCKERHUB_USER  = 'sandunisewwandi'
        BACKEND_IMAGE   = "${DOCKERHUB_USER}/devops_backend:latest"
        FRONTEND_IMAGE  = "${DOCKERHUB_USER}/devops_frontend:latest"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Images') {
            steps {
                echo 'Building backend image...'
                sh 'docker build -t reactweb1-backend  ./backend'

                echo 'Building frontend image...'
                sh 'docker build -t reactweb1-frontend  ./frontend'
            }
        }

        stage('Tag Images') {
            steps {
                sh "docker tag reactweb1-backend  ${BACKEND_IMAGE}"
                sh "docker tag reactweb1-frontend  ${FRONTEND_IMAGE}"
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${DOCKERHUB_CREDS}", usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
                    sh 'echo $DH_PASS | docker login -u $DH_USER --password-stdin'
                    sh "docker push ${BACKEND_IMAGE}"
                    sh "docker push ${FRONTEND_IMAGE}"
                    sh 'docker logout'
                }
            }
        }

        stage('Deploy Containers') {
    steps {
        echo 'Removing old containers if they exist...'
        sh 'docker rm -f mongo || true'
        sh 'docker rm -f backend || true'
        sh 'docker rm -f frontend || true'

        echo 'Deploying using Docker Compose...'
        sh 'docker-compose up -d --build'
    }
}

    }

    post {
        always {
            echo 'Cleaning up unused Docker images...'
            sh 'docker image prune -f'
        }
    }
}