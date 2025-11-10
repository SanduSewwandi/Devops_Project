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
                    // Remove any container using backend port
                    sh '''
                    backend_container=$(docker ps -aq --filter "publish=${BACKEND_PORT}")
                    if [ ! -z "$backend_container" ]; then
                        docker rm -f $backend_container
                    fi
                    '''

                    // Remove any container using frontend port
                    sh '''
                    frontend_container=$(docker ps -aq --filter "publish=${FRONTEND_PORT}")
                    if [ ! -z "$frontend_container" ]; then
                        docker rm -f $frontend_container
                    fi
                    '''

                    // Kill any process using backend port
                    sh '''
                    if lsof -i:${BACKEND_PORT} -t >/dev/null; then
                        sudo kill -9 $(lsof -i:${BACKEND_PORT} -t)
                    fi
                    '''

                    // Kill any process using frontend port
                    sh '''
                    if lsof -i:${FRONTEND_PORT} -t >/dev/null; then
                        sudo kill -9 $(lsof -i:${FRONTEND_PORT} -t)
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
                    // Run backend container
                    sh "docker run -d --name devops_backend -p ${BACKEND_PORT}:5000 ${DOCKER_IMAGE_BACKEND}"

                    // Run frontend container
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
