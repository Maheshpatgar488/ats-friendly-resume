# Use an official Node.js runtime as the base image
FROM node:20-slim

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

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose Hugging Face Space port
EXPOSE 7860

# Hugging Face Spaces require running as a non-root user (uid 1000)
RUN useradd -m -u 1000 user && \
    chown -R user:user /app

USER user

# Start command
CMD ["npm", "start"]
