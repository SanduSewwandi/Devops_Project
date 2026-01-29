pipeline {
    agent any

    stages {
        stage('Test Docker Access') {
            steps {
                sh '''
                    echo "=== Testing Docker Access ==="
                    echo "Who am I: $(whoami)"
                    echo "My groups: $(groups)"
                    
                    echo "1. Testing docker hello-world..."
                    docker run --rm hello-world
                    
                    echo "2. Testing docker-compose..."
                    cat > docker-compose.test.yml << 'EOF'
version: '3'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "8080:80"
EOF
                    
                    docker-compose -f docker-compose.test.yml up -d
                    sleep 3
                    docker-compose -f docker-compose.test.yml ps
                    docker-compose -f docker-compose.test.yml down
                    
                    echo "✅ Docker and Docker Compose are working!"
                '''
            }
        }
    }
    
    post {
        failure {
            sh '''
                echo "=== FAILURE DIAGNOSTICS ==="
                echo "Checking Docker socket..."
                ls -la /var/run/docker.sock 2>/dev/null || echo "No docker socket"
                
                echo "Checking Docker service..."
                systemctl status docker 2>/dev/null || echo "Cannot check docker service"
                
                echo "PATH: $PATH"
                echo "Docker path: $(which docker 2>/dev/null || echo 'Not found')"
            '''
        }
    }
}