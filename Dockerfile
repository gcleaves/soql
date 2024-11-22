# Dockerfile for SOQL Query Playground with Express Server

FROM node:18

# Set the working directory
WORKDIR /app

# Copy server files
COPY server.mjs ./
COPY index.html ./

# Install dependencies
RUN npm init -y && npm install express node-fetch

# Set the environment variable for Node
ENV PORT=3000

# Start the Express server
CMD [ "node", "server.mjs" ]
