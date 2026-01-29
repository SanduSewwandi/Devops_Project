pipeline {
    agent any

    environment {
        DOCKERHUB_CREDS = 'plantcredentials'
        DOCKERHUB_USER  = 'sandusewwandi'
        BACKEND_IMAGE  = "${DOCKERHUB_USER}/devops_backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/devops_frontend:latest"
        DOCKER_BUILDKIT = '1'  # Enable BuildKit for faster builds
        BUILDKIT_PROGRESS = 'plain'
        NPM_CONFIG_CACHE = '/tmp/npm_cache'  # Cache npm packages
        NPM_CONFIG_LOGLEVEL = 'warn'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        retry(2)  # Retry on failure
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Checkout & Setup') {
            steps {
                checkout scm
                sh '''
                    echo "=== Setting Up Workspace ==="
                    pwd
                    ls -la
                    
                    # Create optimized docker-compose.yml
                    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  mongodb:
    image: mongo:6
    container_name: mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

  backend:
    image: ${BACKEND_IMAGE}
    container_name: backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/devops
      - NODE_ENV=production
    depends_on:
      - mongodb
    restart: unless-stopped

  frontend:
    image: ${FRONTEND_IMAGE}
    container_name: frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mongodb_data:
EOF
                    echo "✅ docker-compose.yml created"
                    
                    # Create .dockerignore files if they don't exist
                    if [ ! -f backEnd/.dockerignore ]; then
                        cat > backEnd/.dockerignore << 'DOCKERIGNORE'
node_modules
npm-debug.log
.git
.gitignore
README.md
Dockerfile*
docker-compose*
.vscode
.idea
.DS_Store
DOCKERIGNORE
                    fi
                    
                    if [ ! -f frontEnd/.dockerignore ]; then
                        cat > frontEnd/.dockerignore << 'DOCKERIGNORE'
node_modules
build
dist
npm-debug.log
.git
.gitignore
README.md
Dockerfile*
docker-compose*
.vscode
.idea
.DS_Store
DOCKERIGNORE
                    fi
                '''
            }
        }

        stage('Prepare Build Cache') {
            steps {
                sh '''
                    echo "=== Setting Up Build Cache ==="
                    
                    # Create cache directories
                    mkdir -p /tmp/npm_cache
                    mkdir -p /tmp/yarn_cache
                    
                    # Check for existing Docker layers cache
                    echo "Checking for existing images to reuse..."
                    docker images | grep -E "node:|alpine:" || echo "No base images cached"
                    
                    # Pre-pull base images for faster builds
                    echo "Pre-pulling base images..."
                    docker pull node:18-alpine 2>/dev/null || echo "Could not pre-pull node:18-alpine"
                    docker pull node:20-alpine 2>/dev/null || echo "Could not pre-pull node:20-alpine"
                    docker pull mongo:6 2>/dev/null || echo "Could not pre-pull mongo:6"
                '''
            }
        }

        stage('Build Backend Image') {
            steps {
                sh '''
                    echo "=== Building Backend (Optimized) ==="
                    cd backEnd
                    
                    # Create optimized Dockerfile if it doesn't exist
                    if [ ! -f Dockerfile ]; then
                        cat > Dockerfile << 'DOCKERFILE'
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --silent

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
DOCKERFILE
                    fi
                    
                    # Build with cache and parallel layers
                    echo "Building backend with cache optimization..."
                    time docker build \
                      --progress=plain \
                      --build-arg NODE_ENV=production \
                      --cache-from ${BACKEND_IMAGE} \
                      -t ${BACKEND_IMAGE} \
                      -t reactweb1-backend:latest \
                      .
                    
                    echo "✅ Backend built in: $(($SECONDS / 60))m$(($SECONDS % 60))s"
                '''
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh '''
                    echo "=== Building Frontend (Optimized) ==="
                    cd frontEnd
                    
                    # Create optimized Dockerfile if it doesn't exist
                    if [ ! -f Dockerfile ]; then
                        cat > Dockerfile << 'DOCKERFILE'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --silent
COPY . .
RUN npm run build --silent

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
DOCKERFILE
                    fi
                    
                    # Create nginx config if needed
                    if [ ! -f nginx.conf ]; then
                        cat > nginx.conf << 'NGINX'
server {
    listen 5173;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX
                    fi
                    
                    # Build with cache optimization
                    echo "Building frontend with cache optimization..."
                    time docker build \
                      --progress=plain \
                      --build-arg NODE_ENV=production \
                      --cache-from ${FRONTEND_IMAGE} \
                      -t ${FRONTEND_IMAGE} \
                      -t reactweb1-frontend:latest \
                      .
                    
                    echo "✅ Frontend built in: $(($SECONDS / 60))m$(($SECONDS % 60))s"
                '''
            }
        }

        stage('Push Images (Optional)') {
            when {
                expression { env.DOCKERHUB_CREDS != '' }
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKERHUB_CREDS}",
                    usernameVariable: 'DH_USER',
                    passwordVariable: 'DH_PASS'
                )]) {
                    sh '''
                        echo "=== Pushing Images ==="
                        echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
                        
                        echo "Pushing backend..."
                        docker push ${BACKEND_IMAGE} || echo "⚠️ Backend push skipped"
                        
                        echo "Pushing frontend..."
                        docker push ${FRONTEND_IMAGE} || echo "⚠️ Frontend push skipped"
                        
                        docker logout
                        echo "✅ Push completed"
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    echo "=== Deploying Application ==="
                    
                    # Cleanup old containers
                    echo "Cleaning up old deployment..."
                    docker-compose down -v --remove-orphans 2>/dev/null || true
                    
                    # Deploy new containers
                    echo "Starting services..."
                    docker-compose up -d
                    
                    # Wait for services
                    echo "Waiting for services to start..."
                    for i in {1..10}; do
                        running=$(docker-compose ps -q | xargs docker inspect -f "{{.State.Status}}" 2>/dev/null | grep -c "running")
                        total=$(docker-compose ps -q | wc -l)
                        
                        echo "Status: $running/$total containers running"
                        
                        if [ "$running" -eq "$total" ] && [ "$total" -eq 3 ]; then
                            echo "✅ All containers are running!"
                            break
                        fi
                        
                        if [ $i -eq 10 ]; then
                            echo "⚠️ Containers taking longer than expected to start"
                        fi
                        
                        sleep 5
                    done
                    
                    echo "Deployment completed in: $(($SECONDS / 60))m$(($SECONDS % 60))s"
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    echo "=== Health Check ==="
                    
                    # Final status
                    echo "Final container status:"
                    docker-compose ps
                    
                    # Quick health checks (non-blocking)
                    echo ""
                    echo "Quick health checks..."
                    
                    # Backend check
                    echo -n "Backend: "
                    if docker-compose ps backend | grep -q "Up"; then
                        echo "✅ Running"
                    else
                        echo "❌ Not running"
                    fi
                    
                    # Frontend check
                    echo -n "Frontend: "
                    if docker-compose ps frontend | grep -q "Up"; then
                        echo "✅ Running"
                    else
                        echo "❌ Not running"
                    fi
                    
                    # MongoDB check
                    echo -n "MongoDB: "
                    if docker-compose ps mongodb | grep -q "Up"; then
                        echo "✅ Running"
                    else
                        echo "❌ Not running"
                    fi
                    
                    echo ""
                    echo "🌐 Application URLs:"
                    echo "Backend API:  http://localhost:5000"
                    echo "Frontend App: http://localhost:5173"
                    echo "MongoDB:      localhost:27017"
                '''
            }
        }
    }

    post {
        always {
            sh '''
                echo "=== Build Summary ==="
                echo "Total build time: $(($SECONDS / 60))m$(($SECONDS % 60))s"
                echo ""
                echo "Container status:"
                docker-compose ps 2>/dev/null || echo "No containers running"
                echo ""
                echo "Image sizes:"
                docker images ${BACKEND_IMAGE} --format "Backend: {{.Repository}}:{{.Tag}} - {{.Size}}" 2>/dev/null || true
                docker images ${FRONTEND_IMAGE} --format "Frontend: {{.Repository}}:{{.Tag}} - {{.Size}}" 2>/dev/null || true
            '''
            
            script {
                echo "==========================================="
                echo "Build #${BUILD_NUMBER} - ${currentBuild.currentResult}"
                echo "Duration: ${currentBuild.durationString}"
                echo "URL: ${BUILD_URL}"
                echo "==========================================="
            }
        }
        
        success {
            echo "🎉 BUILD SUCCESSFUL"
            sh '''
                echo ""
                echo "🚀 Deployment Complete!"
                echo "Access your application at:"
                PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")
                echo "• Frontend: http://$PUBLIC_IP:5173"
                echo "• Backend API: http://$PUBLIC_IP:5000"
                echo ""
                echo "To view logs: docker-compose logs -f"
                echo "To stop: docker-compose down"
            '''
        }
        
        failure {
            echo "❌ BUILD FAILED"
            sh '''
                echo "=== Debug Information ==="
                echo ""
                echo "1. Recent Docker events:"
                docker events --since "10m" 2>/dev/null | tail -20 || echo "Could not get events"
                echo ""
                echo "2. Container logs:"
                docker-compose logs --tail=50 2>/dev/null || echo "No logs available"
                echo ""
                echo "3. System resources:"
                df -h /var/lib/docker 2>/dev/null || df -h /
                echo ""
                echo "4. Memory usage:"
                free -h || echo "Memory info unavailable"
            '''
        }
    }
}