FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy server files and data
COPY server/ ./server/
COPY data/rag_index.jsonl ./data/

# Expose port
EXPOSE 4000

# Start server
CMD ["node", "server/index.js"]