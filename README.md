# Smart Campus Learning System

A comprehensive, responsive, and beautifully designed Glassmorphism web application to connect Faculty, Students, and Administrators.

## Features
- **Student Dashboard**: Browse resources by branch and subject, download files, and track progress offline (PWA support).
- **Faculty Dashboard**: Upload resources with granular targeting (year, branch, semester, section), schedule deadlines, and monitor analytics.
- **Admin Dashboard**: Manage users, maintain global taxonomy, and view aggregate analytics.
- **Push Notifications**: Receive real-time push alerts tailored to specific students when relevant content is uploaded.

## Deployment Instructions

### Method A: Docker (Recommended)
This uses a multi-stage Dockerfile and Docker Compose to easily spin up the application with persistent volumes.

1. Rename `.env.example` to `server/.env` and configure your secure keys.
2. Ensure Docker and Docker Compose are installed.
3. Run the following command in the root directory:
   ```bash
   docker-compose up -d --build
   ```
4. The application is now accessible at `http://localhost:5000`.

### Method B: Standard Node Setup (e.g. VPS, PM2)
You can deploy this as a standard Node project. The root `package.json` provides helper scripts.

1. Clone the repository to your production server.
2. Install all dependencies across the monorepo:
   ```bash
   npm run install:all
   ```
3. Build the production React frontend:
   ```bash
   npm run build
   ```
4. Copy `.env.example` to `server/.env` and configure the environment variables (Ensure `NODE_ENV=production`).
5. Start the server (for example, using PM2):
   ```bash
   cd server
   pm2 start server.js --name "smart-campus"
   ```

## Development
- Start backend: `npm run dev:server` (Port 5000)
- Start frontend: `npm run dev:client` (Port 5173)
