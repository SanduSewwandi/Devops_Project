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

        stage('Build Images') {
            steps {
                sh 'docker build -t reactweb1-backend ./backEnd'
                sh 'docker build -t reactweb1-frontend ./frontEnd'
            }
        }

        stage('Tag Images') {
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

        stage('Free Required Ports') {
            steps {
                sh '''
                    echo "Stopping old containers..."
                    docker rm -f backend frontend mongo || true

                    echo "Checking port 27017..."
                    pid=$(lsof -ti:27017)

                    if [ ! -z "$pid" ]; then
                        cmd=$(ps -p $pid -o comm=)
                        if [[ "$cmd" == "docker-proxy" || "$cmd" == "docker" ]]; then
                            echo "Port 27017 is used by Docker process: $pid ($cmd). Killing..."
                            sudo kill -9 $pid
                        else
                            echo "WARNING: Port 27017 is used by a system process ($cmd). Aborting to avoid breaking host MongoDB."
                            exit 1
                        fi
                    else
                        echo "Port 27017 is free"
                    fi
                '''
            }
        }

        stage('Deploy Containers') {
            steps {
                sh '''
                    echo "Ensuring no leftover containers block deployment"
                    docker-compose down || true

                    retries=3
                    for i in $(seq 1 $retries); do
                        docker-compose up -d --build && break || {
                            echo "Attempt $i failed, waiting 5s..."
                            sleep 5
                        }
                    done
                '''
            }
        }
    }

    post {
        always {
            echo 'Cleaning up unused Docker images...'
            sh 'docker image prune -f'
        }
    }
}
