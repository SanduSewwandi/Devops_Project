pipeline {
    agent any

    environment {
        DOCKERHUB_CREDS = 'plantcredentials'
        DOCKERHUB_USER  = 'sandusewwandi'
        BACKEND_IMAGE  = "${DOCKERHUB_USER}/devops_backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/devops_frontend:latest"
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
                    // Fetches AWS Public IP or defaults to localhost
                    env.PUBLIC_IP = sh(
                        script: "curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || echo localhost",
                        returnStdout: true
                    ).trim()
                    echo "Deploying to IP: ${env.PUBLIC_IP}"
                }
            }
        }

        stage('Clean Old Deployment') {
            steps {
                sh 'docker-compose down -v --remove-orphans || true'
            }
        }

        stage('Build & Push Images') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKERHUB_CREDS}",
                    usernameVariable: 'DH_USER',
                    passwordVariable: 'DH_PASS'
                )]) {
                    sh '''
                        # Build
                        docker build -t ${BACKEND_IMAGE} ./backEnd
                        docker build -t ${FRONTEND_IMAGE} ./frontEnd
                        
                        # Login and Push
                        echo $DH_PASS | docker login -u $DH_USER --password-stdin
                        docker push ${BACKEND_IMAGE}
                        docker push ${FRONTEND_IMAGE}
                        docker logout
                    '''
                }
            }
        }

        stage('Deploy Application') {
            steps {
                sh '''
                    # Export IP so docker-compose can read it
                    export PUBLIC_IP=${PUBLIC_IP}
                    
                    # Start services
                    docker-compose up -d --force-recreate
                    
                    echo "Waiting 15 seconds for services to initialize..."
                    sleep 15
                '''
            }
        }

        stage('Fix Volume Permissions') {
            steps {
                sh '''
                    echo "Fixing permissions for the uploads volume..."
                    
                    # 1. Ensure directory exists inside the container
                    docker exec -u root backend mkdir -p /app/uploads
                    
                    # 2. Change ownership to the 'node' user (UID 1000) 
                    # This allows your Node.js app to write files to the volume
                    docker exec -u root backend chown -R node:node /app/uploads
                    
                    # 3. Set proper read/write permissions
                    docker exec -u root backend chmod -R 775 /app/uploads
                    
                    echo "✅ Permissions updated successfully"
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    docker-compose ps
                    echo "Frontend: http://${PUBLIC_IP}:5173"
                    echo "Backend:  http://${PUBLIC_IP}:5000"
                '''
            }
        }
    }

    post {
        always {
            echo "Pipeline finished with status: ${currentBuild.currentResult}"
        }
        
        failure {
            echo "❌ Deployment Failed! Checking backend logs for errors:"
            sh 'docker logs backend --tail=100'
        }
        
        cleanup {
            // Removes temporary test files if they were created
            sh 'docker exec backend rm -f /app/uploads/test*.txt 2>/dev/null || true'
        }
    }
}