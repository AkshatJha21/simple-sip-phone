# Node.js Router API Dockerfile
#
# This builds a simple Express server that handles routing decisions
# for the Kamailio SIP proxy.

FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY src/ ./src/

# Expose the API port
EXPOSE 3000

# Run the server
CMD ["node", "src/index.js"]
