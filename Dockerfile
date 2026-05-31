# Stage 1: Build the React client
FROM node:18-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Setup the Express server
FROM node:18-alpine
WORKDIR /app/server

# Copy server files
COPY server/package*.json ./
RUN npm install --production
COPY server/ ./

# Copy built client from stage 1
COPY --from=client-builder /app/client/dist /app/client/dist

# Expose the API and Web Server port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
