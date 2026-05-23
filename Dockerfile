# Stage 1: Build the React Frontend
FROM node:20-slim AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Final Image with Express Backend
FROM node:20-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies required for Puppeteer / Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Set the working directory
WORKDIR /app

# Copy package files from the backend directory
COPY backend/package*.json ./
RUN npm install

# Copy the rest of the backend directory
COPY backend/ ./

# Copy built frontend dist from Stage 1 into /app/public
COPY --from=frontend-build /frontend/dist /app/public

# Expose Hugging Face Space port
EXPOSE 7860

# Hugging Face Spaces require running as a non-root user (uid 1000)
# Node base images already include a 'node' user with uid 1000
RUN chown -R node:node /app

USER node

# Start command
CMD ["npm", "start"]
