pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = "sandusewwandi/devops_backend:latest"
        DOCKER_IMAGE_FRONTEND = "sandusewwandi/devops_frontend:latest"
        BACKEND_PORT = "5000"
        FRONTEND_PORT = "5173"
    }

    stages {
        stage('Clean Existing Containers & Ports') {
            steps {
                script {
                    // Stop and remove backend container if exists
                    sh '''
                    if [ $(docker ps -q -f "name=devops_backend") ]; then
                        docker rm -f devops_backend
                    fi
                    '''

                    // Stop and remove frontend container if exists
                    sh '''
                    if [ $(docker ps -q -f "name=devops_frontend") ]; then
                        docker rm -f devops_frontend
                    fi
                    '''

                    // Optional: Kill any process using backend port
                    sh '''
                    if lsof -i:${BACKEND_PORT} -t >/dev/null; then
                        sudo kill -9 $(lsof -i:${BACKEND_PORT} -t)
                    fi
                    '''
                }
            }
        }

        stage('Pull Latest Docker Images') {
            steps {
                script {
                    sh "docker pull ${DOCKER_IMAGE_BACKEND}"
                    sh "docker pull ${DOCKER_IMAGE_FRONTEND}"
                }
            }
        }

        stage('Run Backend & Frontend Containers') {
            steps {
                script {
                    sh "docker run -d --name devops_backend -p ${BACKEND_PORT}:5000 ${DOCKER_IMAGE_BACKEND}"
                    sh "docker run -d --name devops_frontend -p ${FRONTEND_PORT}:5173 ${DOCKER_IMAGE_FRONTEND}"
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
