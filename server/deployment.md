# FilmVault Deployment Guide

## Environment Configuration
FilmVault server uses two environment files:
- `.env.development` - Used for local development with `npm run dev`
- `.env.production` - Used for production deployment with `npm start`

The environment is selected based on NODE_ENV, which is set in the npm scripts.

## Client Deployment Steps

1. Build the client:
   ```bash
   cd /Users/andywu/FilmVault/client
   npm run build
   ```

2. Package the build:
   ```bash
   cd /Users/andywu/FilmVault/client
   tar -czf filmvault-client.tar.gz build/
   ```

3. Transfer to server:
   ```bash
   # Replace with your SSH key path
   scp -i /path/to/your/ssh/key filmvault-client.tar.gz opc@132.145.111.110:/home/opc/
   ```

4. SSH into server:
   ```bash
   ssh -i /path/to/your/ssh/key opc@132.145.111.110
   ```

5. Deploy client on server:
   ```bash
   cd ~
   sudo rm -rf /opt/filmvault-client/build/*
   sudo tar -xzf filmvault-client.tar.gz -C /opt/filmvault-client/
   sudo chown -R nginx:nginx /opt/filmvault-client/build
   sudo chmod -R 755 /opt/filmvault-client/build
   sudo systemctl restart nginx
   ```

## Server Deployment Steps

1. Build the server:
   ```bash
   cd /Users/andywu/FilmVault/server
   npm run build
   ```

2. Create a deployment package (include environment file):
   ```bash
   cd /Users/andywu/FilmVault/server
   tar -czf filmvault-server.tar.gz dist/ package.json package-lock.json .env.production
   ```

3. Transfer to server:
   ```bash
   # Replace with your SSH key path
   scp -i /path/to/your/ssh/key filmvault-server.tar.gz opc@132.145.111.110:/home/opc/
   ```

4. SSH into server:
   ```bash
   ssh -i /path/to/your/ssh/key opc@132.145.111.110
   ```

5. Deploy server on server:
   ```bash
   cd ~
   sudo pm2 stop filmvault-api
   sudo mkdir -p /opt/filmvault-server-new
   sudo tar -xzf filmvault-server.tar.gz -C /opt/filmvault-server-new
   cd /opt/filmvault-server-new
   sudo npm install --production
   sudo rm -rf /opt/filmvault-server
   sudo mv /opt/filmvault-server-new /opt/filmvault-server
   cd /opt/filmvault-server
   sudo pm2 start dist/index.js --name filmvault-api
   ```

6. Verify deployment:
   ```bash
   pm2 status
   pm2 logs
   ```