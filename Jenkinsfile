pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = "sandusewwandi/devops_backend:latest"
        DOCKER_IMAGE_FRONTEND = "sandusewwandi/devops_frontend:latest"
    }

    stages {
        stage('Deploy Backend & Frontend') {
            steps {
                script {
                    // Stop existing containers
                    sh 'docker rm -f devops_backend || true'
                    sh 'docker rm -f devops_frontend || true'

                    // Pull latest images from Docker Hub
                    sh "docker pull ${DOCKER_IMAGE_BACKEND}"
                    sh "docker pull ${DOCKER_IMAGE_FRONTEND}"

                    // Run containers
                    sh "docker run -d --name devops_backend -p 5000:5000 ${DOCKER_IMAGE_BACKEND}"
                    sh "docker run -d --name devops_frontend -p 5173:5173 ${DOCKER_IMAGE_FRONTEND}"
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment Successful!'
        }
        failure {
            echo 'Deployment Failed!'
        }
    }
}