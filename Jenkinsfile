pipeline {
    agent any

    environment {
        DOCKERHUB_CREDS = 'plantcredentials'
        DOCKERHUB_USER  = 'sandusewwandi'
        BACKEND_IMAGE  = "${DOCKERHUB_USER}/devops_backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/devops_frontend:latest"
    }

    stages {
        stage('Checkout') { steps { checkout scm } }
        stage('Get Public IP') {
            steps {
                script {
                    env.PUBLIC_IP = sh(
                        script: "curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || echo localhost",
                        returnStdout: true
                    ).trim()
                }
            }
        }
        stage('Clean') { steps { sh 'docker-compose down -v --remove-orphans || true' } }
        stage('Build Images') {
            steps { sh "docker build -t ${BACKEND_IMAGE} ./backEnd && docker build -t ${FRONTEND_IMAGE} ./frontEnd" }
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
        stage('Deploy') {
            steps {
                sh '''
                    export PUBLIC_IP=${PUBLIC_IP}
                    docker-compose up -d --force-recreate
                    docker-compose ps
                '''
            }
        }
    }

    post {
        always {
            echo "=== PIPELINE COMPLETED ==="
            sh '''
                echo "Containers status:"
                docker-compose ps || echo "Could not get container status"
            '''
        }

        success {
            echo "✅ Deployment succeeded!"
            sh '''
                echo "Frontend URL: http://${PUBLIC_IP}:5173"
                echo "Backend URL: http://${PUBLIC_IP}:5000"
            '''
        }

        failure {
            echo "❌ Deployment failed!"
            sh '''
                echo "Check backend logs:"
                docker logs backend --tail=50
                echo "Check frontend logs:"
                docker logs frontend --tail=50
            '''
        }

        cleanup {
            echo "Cleaning up temporary files..."
            sh '''
                docker exec backend rm -f /uploads/test*.txt 2>/dev/null || true
                echo "Cleanup done"
            '''
        }
    }
}
