FROM node:20-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./

# Write a landing page so the Space isn't blank
RUN mkdir -p /app/public && \
    printf '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Resume Backend API</title><style>body{font-family:-apple-system,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f5f5f5;color:#333;text-align:center;padding:20px}.card{background:#fff;padding:40px;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.1);max-width:500px}h1{font-size:1.5rem;margin:0 0 8px}p{color:#666;margin:8px 0 20px;line-height:1.5}.status{background:#e8f5e9;color:#2e7d32;padding:8px 16px;border-radius:20px;font-size:.85rem;display:inline-block}.endpoints{text-align:left;margin-top:20px;font-size:.85rem;background:#fafafa;padding:16px;border-radius:8px}.endpoints code{display:block;padding:4px 0;color:#1565c0}a{color:#1565c0}</style></head><body><div class="card"><h1>ATS Resume Builder — API</h1><div class="status">Server is running</div><p>This is the backend API server. Upload resumes, AI tailoring, ATS scoring.</p><div class="endpoints"><strong>Available endpoints:</strong><code>POST /api/extract-text</code><code>POST /api/tailor</code><code>POST /api/ats-score</code><code>POST /api/enhance</code><code>POST /api/export-pdf</code></div><p style="margin-top:20px;font-size:.85rem">Frontend: <a href="https://ats-friendly-resume-iota.vercel.app" target="_blank">ats-friendly-resume-iota.vercel.app</a></p></div></body></html>' > /app/public/index.html

EXPOSE 7860

RUN chown -R node:node /app

USER node

CMD ["npm", "start"]
