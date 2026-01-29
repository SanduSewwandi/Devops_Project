pipeline {
    agent any

    environment {
        DOCKERHUB_CREDS = 'plantcredentials'
        DOCKERHUB_USER  = 'sandusewwandi'
        BACKEND_IMAGE  = "${DOCKERHUB_USER}/devops_backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/devops_frontend:latest"
        DOCKER_BUILDKIT = '1'
        NPM_CONFIG_LOGLEVEL = 'warn'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                sh '''
                    set -e
                    echo "=== Project Structure ==="
                    pwd
                    ls -la

                    echo "=== Checking Critical Files ==="
                    test -f docker-compose.yml
                    test -f backEnd/Dockerfile
                    test -f frontEnd/Dockerfile
                    echo "✅ All required files exist"
                '''
            }
        }

        stage('Test Docker Setup') {
            steps {
                sh '''
                    set -e
                    echo "=== Testing Docker ==="
                    docker --version
                    docker ps > /dev/null
                    echo "✅ Docker is running"
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    set -e
                    echo "Building backend image..."
                    cd backEnd
                    docker build --progress=plain -t reactweb1-backend .
                '''

                sh '''
                    set -e
                    echo "Building frontend image..."
                    cd frontEnd
                    docker build --progress=plain -t reactweb1-frontend .
                '''
            }
        }

        stage('Tag Images for Docker Hub') {
            steps {
                sh '''
                    set -e
                    echo "Tagging images..."
                    docker tag reactweb1-backend  ${BACKEND_IMAGE}
                    docker tag reactweb1-frontend ${FRONTEND_IMAGE}
                '''
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKERHUB_CREDS}",
                    usernameVariable: 'DH_USER',
                    passwordVariable: 'DH_PASS'
                )]) {
                    sh '''
                        set -e
                        echo "Logging into Docker Hub..."
                        echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin

                        echo "Verifying images exist..."
                        docker images | grep devops

                        echo "Pushing backend image..."
                        docker push ${BACKEND_IMAGE}

                        echo "Pushing frontend image..."
                        docker push ${FRONTEND_IMAGE}

                        docker logout
                        echo "✅ Images pushed successfully"
                    '''
                }
            }
        }

        stage('Prepare for Deployment') {
            steps {
                sh '''
                    set -e
                    echo "Preparing folders..."
                    rm -rf backend frontend || true
                    cp -r backEnd backend
                    cp -r frontEnd frontend
                    echo "✅ Folder preparation done"
                '''
            }
        }

        stage('Free Required Ports') {
            steps {
                sh '''
                    set -e
                    echo "Stopping old containers..."
                    docker rm -f $(docker ps -aq) 2>/dev/null || true
                    echo "✅ Containers cleaned"
                '''
            }
        }

        stage('Deploy Containers') {
            steps {
                sh '''
                    set -e
                    echo "Deploying containers..."
                    docker-compose down -v --remove-orphans || true
                    docker-compose up -d
                    sleep 15
                    docker-compose ps
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    set -e
                    echo "Verifying containers..."
                    total=$(docker-compose ps -q | wc -l)
                    running=$(docker-compose ps -q | xargs docker inspect -f '{{.State.Status}}' | grep -c running)

                    echo "Running: $running / $total"

                    if [ "$running" -ne "$total" ]; then
                        docker-compose logs --tail=50
                        exit 1
                    fi

                    echo "✅ DEPLOYMENT SUCCESSFUL"
                    echo "Backend:  http://localhost:5000"
                    echo "Frontend: http://localhost:5173"
                '''
            }
        }
    }

    post {
        always {
            sh '''
                echo "=== Post cleanup ==="
                rm -rf backend frontend || true
                docker image prune -f || true
            '''

            echo "==========================================="
            echo "Build Result  : ${currentBuild.currentResult}"
            echo "Build URL     : ${env.BUILD_URL}"
            echo "==========================================="
        }

        success {
            echo "🎉 PIPELINE COMPLETED SUCCESSFULLY"
        }

        failure {
            echo "❌ PIPELINE FAILED"
            sh '''
                docker ps -a || true
                docker-compose logs --tail=50 || true
            '''
        }
    }
}
