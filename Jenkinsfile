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
                echo 'Stopping containers or processes using ports 5000, 5173, 27017...'
                sh '''
                    # Remove old containers if they exist
                    for cname in reactweb1_pipeline_backend_1 reactweb1_pipeline_frontend_1 reactweb1_pipeline_mongo_1; do
                        if [ "$(docker ps -a -q -f name=$cname)" ]; then
                            echo "Removing container $cname"
                            docker rm -f $cname
                        else
                            echo "No existing container named $cname"
                        fi
                    done

                    # Kill processes using the ports
                    for port in 5000 5173 27017; do
                        pid=$(lsof -ti:$port || true)
                        if [ ! -z "$pid" ]; then
                            echo "Killing process using port $port"
                            sudo kill -9 $pid
                        else
                            echo "No process found on port $port"
                        fi
                    done
                '''
            }
        }

        stage('Deploy Containers') {
            steps {
                echo 'Deploying backend, frontend, and MongoDB using Docker Compose...'
                sh 'docker-compose up -d --build'
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
