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
                echo 'Checking out source code...'
                checkout scm
                sh 'ls -R'
            }
        }

        stage('Build Docker Images') {
            steps {
                echo 'Building backend image...'
                sh 'docker build -t reactweb1-backend ./backEnd'

                echo 'Building frontend image...'
                sh 'docker build -t reactweb1-frontend ./frontEnd'
            }
        }

        stage('Tag Images for Docker Hub') {
            steps {
                echo 'Tagging images for Docker Hub...'
                sh "docker tag reactweb1-backend ${BACKEND_IMAGE}"
                sh "docker tag reactweb1-frontend ${FRONTEND_IMAGE}"
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                echo 'Pushing images to Docker Hub...'
                withCredentials([usernamePassword(credentialsId: "${DOCKERHUB_CREDS}", usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
                    sh '''
                        echo $DH_PASS | docker login -u $DH_USER --password-stdin
                        docker push ${BACKEND_IMAGE}
                        docker push ${FRONTEND_IMAGE}
                        docker logout
                    '''
                }
            }
        }

        stage('Prepare Compose Folders') {
            steps {
                echo 'Preparing folder structure for docker-compose...'
                sh '''
                    rm -rf backend frontend || true
                    cp -r backEnd backend
                    cp -r frontEnd frontend
                '''
            }
        }

        stage('Free Required Ports') {
            steps {
                echo 'Cleaning up old containers and freeing ports...'
                sh '''
                    echo "Stopping old containers if they exist..."
                    docker rm -f reactweb1_pipeline_backend_1 reactweb1_pipeline_frontend_1 reactweb1_pipeline_mongo_1 2>/dev/null || true

                    echo "Checking and freeing ports 5000, 5173, 27017..."
                    for port in 5000 5173 27017; do
                        echo "Checking port $port..."
                        pid=$(lsof -ti:$port || true)
                        if [ ! -z "$pid" ]; then
                            cmd=$(ps -p $pid -o comm=)
                            if [[ "$cmd" == "docker-proxy" || "$cmd" == "docker" ]]; then
                                echo "Port $port is used by Docker process: $pid ($cmd). Killing..."
                                sudo kill -9 $pid || true
                            else
                                echo "⚠️  Port $port is used by a system process ($cmd). Skipping to avoid breaking host services."
                            fi
                        else
                            echo "✅ Port $port is free"
                        fi
                    done
                '''
            }
        }

        stage('Deploy Containers') {
            steps {
                echo 'Deploying backend, frontend, and MongoDB using Docker Compose...'
                sh '''
                    docker-compose down || true
                    docker-compose up -d --build
                '''
            }
        }
    }

    post {
        always {
            echo 'Cleaning up temporary folders and unused Docker data...'
            sh '''
                rm -rf backend frontend || true
                docker image prune -f
                docker container prune -f
                docker network prune -f
                docker volume prune -f
            '''
        }
    }
}
