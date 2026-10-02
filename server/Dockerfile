FROM node:20-alpine AS base

WORKDIR /app

# Install curl for health check
RUN apk add --no-cache curl

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application code
COPY . .

# Run as non-root user
USER node

EXPOSE 5050

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5050/api/health || exit 1

CMD ["node", "src/server.js"]
