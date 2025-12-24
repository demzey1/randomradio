FROM node:18-alpine
WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm ci --only=production || npm install --production

COPY . .

# Cloud Run prefers port 8080; server.js respects PORT env var
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
