pipeline {
    agent any

    environment {
        DOCKERHUB_USER = 'sandunisewwandi'
        FRONTEND_IMAGE = 'devops_frontend'
        BACKEND_IMAGE = 'devops_backend'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/SanduSewwandi/Devops_Project.git'
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    echo ' Building Frontend Image...'
                    sh 'docker build -t $DOCKERHUB_USER/$FRONTEND_IMAGE:latest ./frontEnd'
                    
                    echo ' Building Backend Image...'
                    sh 'docker build -t $DOCKERHUB_USER/$BACKEND_IMAGE:latest ./backEnd'
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD')]) {
                    sh 'echo $PASSWORD | docker login -u $USERNAME --password-stdin'
                    sh 'docker push $DOCKERHUB_USER/$FRONTEND_IMAGE:latest'
                    sh 'docker push $DOCKERHUB_USER/$BACKEND_IMAGE:latest'
                }
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                echo ' Deploying application...'
                sh 'docker-compose down || true'
                sh 'docker-compose up -d'
            }
        }
    }

    post {
        success {
            echo ' Build and deployment completed successfully!'
        }
        failure {
            echo ' Build or deployment failed!'
        }
        always {
            sh 'docker logout'
        }
    }
}
