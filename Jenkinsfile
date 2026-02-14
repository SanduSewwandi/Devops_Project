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

        stage('Clean') { 
            steps { 
                sh 'docker-compose down -v --remove-orphans || true' 
            } 
        }

        stage('Build & Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${DOCKERHUB_CREDS}", usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
                    sh '''
                        docker build -t ${BACKEND_IMAGE} ./backEnd
                        docker build -t ${FRONTEND_IMAGE} ./frontEnd
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
                    echo "Waiting for services to stabilize..."
                    sleep 15
                '''
            }
        }

        stage('Fix Volume Permissions') {
            steps {
                sh '''
                    echo "Current permissions (Before):"
                    docker exec -u root backend ls -la /app/uploads
                    
                    # Force the volume folder to be owned by the 'node' user
                    docker exec -u root backend chown -R node:node /app/uploads
                    docker exec -u root backend chmod -R 775 /app/uploads
                    
                    echo "Updated permissions (After):"
                    docker exec backend ls -la /app/uploads
                '''
            }
        }
    }

    post {
        success {
            sh 'echo "✅ Success! Frontend: http://${PUBLIC_IP}:5173"'
        }
        failure {
            echo "❌ Failed. Checking backend logs:"
            sh 'docker logs backend --tail=50'
        }
    }
}