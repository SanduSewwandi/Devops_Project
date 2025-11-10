pipeline {
    agent any

    environment {
        DOCKERHUB_CREDS = 'plantcredentials'
        DOCKERHUB_USER  = 'sandusewwandi'
        BACKEND_IMAGE   = "${DOCKERHUB_USER}/devops_backend:latest"
        FRONTEND_IMAGE  = "${DOCKERHUB_USER}/devops_frontend:latest"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'ls -R'
            }
        }

        stage('Build Images') {
            steps {
                echo 'Building backend image...'
                sh 'docker build -t reactweb1-backend ./backEnd'

                echo 'Building frontend image...'
                sh 'docker build -t reactweb1-frontend ./frontEnd'
            }
        }

        stage('Tag Images') {
            steps {
                sh "docker tag reactweb1-backend ${BACKEND_IMAGE}"
                sh "docker tag reactweb1-frontend ${FRONTEND_IMAGE}"
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

        stage('Prepare Compose Folders') {
            steps {
                echo 'Copying folders to match docker-compose.yml expectations...'
                sh '''
                    rm -rf backend frontend || true
                    cp -r backEnd backend
                    cp -r frontEnd frontend
                '''
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
            echo 'Cleaning up temporary folders and unused Docker images...'
            sh '''
                rm -rf backend frontend || true
                docker image prune -f
            '''
        }
    }
}
