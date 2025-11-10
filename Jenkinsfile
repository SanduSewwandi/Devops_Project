pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = "sandusewwandi/devops_backend:latest"
        DOCKER_IMAGE_FRONTEND = "sandusewwandi/devops_frontend:latest"
        DEFAULT_BACKEND_PORT = "5000"
        DEFAULT_FRONTEND_PORT = "5173"
    }

    stages {
        stage('Clean Existing Containers & Ports') {
            steps {
                script {
                    // Remove existing backend container
                    sh 'docker rm -f devops_backend || true'

                    // Remove existing frontend container
                    sh 'docker rm -f devops_frontend || true'

                    // Kill any process using backend port
                    sh '''
                    if lsof -i:${DEFAULT_BACKEND_PORT} -t >/dev/null; then
                        sudo kill -9 $(lsof -i:${DEFAULT_BACKEND_PORT} -t)
                    fi
                    '''

                    // Kill any process using frontend port
                    sh '''
                    if lsof -i:${DEFAULT_FRONTEND_PORT} -t >/dev/null; then
                        sudo kill -9 $(lsof -i:${DEFAULT_FRONTEND_PORT} -t)
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
                    // Check if backend port is free, otherwise pick a random free port
                    env.BACKEND_PORT = sh(script: """
                        PORT=${DEFAULT_BACKEND_PORT}
                        while lsof -i:\$PORT -t >/dev/null; do
                            PORT=\$((PORT+1))
                        done
                        echo \$PORT
                    """, returnStdout: true).trim()

                    // Check if frontend port is free, otherwise pick a random free port
                    env.FRONTEND_PORT = sh(script: """
                        PORT=${DEFAULT_FRONTEND_PORT}
                        while lsof -i:\$PORT -t >/dev/null; do
                            PORT=\$((PORT+1))
                        done
                        echo \$PORT
                    """, returnStdout: true).trim()

                    echo "Using backend port: ${BACKEND_PORT}"
                    echo "Using frontend port: ${FRONTEND_PORT}"

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
            echo "Deployment Successful!"
        }
        failure {
            echo "Deployment Failed!"
        }
    }
}
