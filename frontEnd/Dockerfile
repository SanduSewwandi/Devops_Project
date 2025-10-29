# Use Node 20 (fixes crypto.hash issues with Vite)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose Vite default port
EXPOSE 5173

# Start Vite dev server on 0.0.0.0 so it's accessible outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
