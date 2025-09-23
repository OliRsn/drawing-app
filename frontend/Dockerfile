# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Set the API URL from the build argument
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Copy package.json + lockfile and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
