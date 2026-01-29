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
                sh "docker tag reactweb1-backend ${BACKEND_IMAGE}"
                sh "docker tag reactweb1-frontend ${FRONTEND_IMAGE}"
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${DOCKERHUB_CREDS}", usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
                    sh 'echo $DH_PASS | docker login -u $DH_USER --password-stdin'
                    sh "docker push ${BACKEND_IMAGE}"
                    sh "docker push ${FRONTEND_IMAGE}"
                    sh 'docker logout'
                }
            }
        }

        stage('Prepare Compose Folders') {
            steps {
                echo 'Copying folders to match docker-compose.yml expectations...'
                sh '''
                    rm -rf backend frontend || true
                    cp -r backEnd backend
                    cp -r frontEnd frontend
                '''
            }
        }

        stage('Free Required Ports') {
            steps {
                echo 'Stopping containers and freeing ports 5000, 5173, 27017...'
                sh '''
                    # Stop any running containers using these ports
                    for port in 5000 5173 27017; do
                        containers=$(docker ps -q --filter "publish=$port")
                        if [ ! -z "$containers" ]; then
                            echo "Stopping containers on port $port: $containers"
                            docker rm -f $containers
                        else
                            echo "No container using port $port"
                        fi
                    done

                    # Kill any other processes using these ports (optional, for host processes)
                    for port in 5000 5173 27017; do
                        pid=$(lsof -ti:$port || true)
                        if [ ! -z "$pid" ]; then
                            echo "Killing process using port $port: $pid"
                            sudo kill -9 $pid
                        else
                            echo "No host process using port $port"
                        fi
                    done
                '''
            }
        }

        stage('Deploy Containers') {
            steps {
                echo 'Deploying backend, frontend, and MongoDB using Docker Compose...'
                sh '''
                    # Ensure old containers/volumes are removed safely
                    docker-compose down -v --remove-orphans || true
                    docker-compose up -d --build
                '''
            }
        }
    }

    post {
        always {
            echo 'Cleaning up temporary folders and unused Docker images...'
            sh '''
                rm -rf backend frontend || true
                docker image prune -f
            '''
        }
    }
}
