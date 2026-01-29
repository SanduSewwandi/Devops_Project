FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install ONLY production dependencies (faster, smaller)
RUN npm ci --only=production --silent

# Copy source code AFTER dependencies (caching trick)
COPY . .

# Create non-root user for security
USER node

EXPOSE 5000

CMD ["npm", "start"]
