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
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Get Public IP') {
            steps {
                script {
                    env.PUBLIC_IP = sh(
                        script: "curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || echo localhost",
                        returnStdout: true
                    ).trim()

                    echo "Public IP = ${env.PUBLIC_IP}"
                }
            }
        }

        stage('Clean Old Containers') {
            steps {
                sh '''
                    echo "Cleaning old containers..."
                    docker-compose down -v --remove-orphans 2>/dev/null || true
                    docker system prune -f || true
                '''
            }
        }

        stage('Build Images') {
            steps {
                sh '''
                    echo "Building backend image..."
                    docker build -t ${BACKEND_IMAGE} ./backEnd

                    echo "Building frontend image..."
                    docker build -t ${FRONTEND_IMAGE} ./frontEnd
                '''
            }
        }

        stage('Push Images') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKERHUB_CREDS}",
                    usernameVariable: 'DH_USER',
                    passwordVariable: 'DH_PASS'
                )]) {
                    sh '''
                        echo $DH_PASS | docker login -u $DH_USER --password-stdin
                        docker push ${BACKEND_IMAGE}
                        docker push ${FRONTEND_IMAGE}
                        docker logout
                    '''
                }
            }
        }

        stage('Deploy (docker-compose)') {
            steps {
                sh '''
                    echo "Starting services using existing docker-compose.yml..."

                    PUBLIC_IP=${PUBLIC_IP} docker-compose up -d --force-recreate

                    sleep 25
                    docker-compose ps
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    echo "Testing backend..."
                    curl -I http://${PUBLIC_IP}:5000 || true

                    echo "Testing frontend..."
                    curl -I http://${PUBLIC_IP}:5173 || true
                '''
            }
        }
    }

    post {
        success {
            echo "======================================"
            echo " Deployment Successful"
            echo " Frontend → http://${env.PUBLIC_IP}:5173"
            echo " Backend  → http://${env.PUBLIC_IP}:5000"
            echo "======================================"
        }

        always {
            sh 'docker-compose ps || true'
        }
    }
}
