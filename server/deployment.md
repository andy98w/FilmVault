# FilmVault Server Deployment Guide

## Environment Configuration
FilmVault server uses two environment files:
- `.env.development` - Used for local development with `npm run dev`
- `.env.production` - Used for production deployment with `npm start`

The environment is selected based on NODE_ENV, which is set in the npm scripts.

## Deployment Steps

1. Build locally:
   ```bash
   cd /Users/andywu/FilmVault/server
   npm run build
   ```

2. Create a deployment package (include environment file):
   ```bash
   # Include package files and compiled code
   tar -czf filmvault-server.tar.gz dist/ package.json package-lock.json .env.production
   ```

    3. Transfer to server:
       scp -i id_rsa filmvault-server.tar.gz opc@132.145.111.110:/tmp/

    4. SSH into server:
       ssh -i id_rsa opc@132.145.111.110

    5. Deploy:
   # Stop current service
   sudo pm2 stop all

   # Backup current deployment (optional)
   sudo cp -r /opt/filmvault-server /opt/filmvault-server.bak.$(date +%Y%m%d)

   # Extract new deployment
   sudo mkdir -p /opt/filmvault-server-new
   sudo tar -xzf /tmp/filmvault-server.tar.gz -C /opt/filmvault-server-new

   # Install dependencies
   cd /opt/filmvault-server-new
   sudo npm install --production

   # Switch deployment
   sudo rm -rf /opt/filmvault-server
   sudo mv /opt/filmvault-server-new /opt/filmvault-server

   # Start service
   cd /opt/filmvault-server
   sudo pm2 start dist/index.js --name filmvault

    6. Verify deployment:
       pm2 status
       pm2 logs")

1. Transfer this updated package to your server:
   scp /Users/andywu/FilmVault/server/filmvault-server-auth-fix.tar.gz opc@your-server-ip:/home/opc/

2. On the server, implement these steps:
# Extract the updated server files
cd ~
sudo tar -xzvf filmvault-server-fixed.tar.gz -C /opt/filmvault-server/

# Remove and reinstall dependencies
cd /opt/filmvault-server
sudo rm -rf node_modules
sudo npm install

# Restart the server
pm2 restart filmvault-api

cd /Users/andywu/FilmVault/server && tar -czvf filmvault-server-cors-fix.tar.gz dist/ package.json package-lock.json

scp /Users/andywu/FilmVault/client/filmvault-server-production-fixed.tar.gz opc@132.145.111.110:/home/opc/

2. Deploy the updated client on your server:
# On your server
cd ~
sudo rm -rf /opt/filmvault-client/build/*
sudo tar -xzvf filmvault-client-production-fixed.tar.gz -C /opt/filmvault-client
sudo chown -R nginx:nginx /opt/filmvault-client/build
sudo chmod -R 755 /opt/filmvault-client/build
sudo systemctl restart nginx

cd /opt/filmvault-server

# Make sure .env.production exists with correct values for production
sudo nano .env.production

# Start server with production environment
NODE_ENV=production pm2 start dist/index.js --name filmvault-api
ln -sf .env.production .env

# Create in home directory where you have write access
cd ~
cat > ecosystem.config.js << 'EOF'
module.exports = {
apps: [{
name: 'filmvault-api',
script: 'dist/index.js',
cwd: '/opt/filmvault-server',
env_production: {
NODE_ENV: 'production',
DB_HOST: '40.233.72.63',
DB_USER: 'admin',
DB_PASSWORD: 'Poilkjmn1!A',
DB_NAME: 'myfavmovies',
USE_MOCK_DATA: 'false',
SKIP_OCI: 'true',
PORT: '3001',
CLIENT_URL: 'https://filmvault.space',
SERVER_URL: 'https://filmvault.space/api',
JWT_SECRET: 'bc0f723cf28884ce96b0145f5773915adda0a8c5a210a1581bfe247a14f5a7c3',
TMDB_API_KEY: '8d577764c95d04282fe610ceecd260c2',
OCI_PAR_URL: 'https://objectstorage.ca-toronto-1.oraclecloud.com/p/j760BvPoSbgh7gfqrrAHfcdRpnlyiHgLdXdwhIq5m9MZR48ygD8XcD4N32g6AFZg/n/yzep9haqilyk/b/f
ilmvault-profile-pictures/o/'
}
}]
};
EOF

# Copy it to /opt using sudo
sudo cp ecosystem.config.js /opt/filmvault-server/
sudo chmod 644 /opt/filmvault-server/ecosystem.config.js

# Stop current app and start with ecosystem file
pm2 stop filmvault-api
pm2 start /opt/filmvault-server/ecosystem.config.js --env production
pm2 save

1. Deploy the server:
# Transfer the package to your server
scp -i /path/to/your/ssh/key /Users/andywu/FilmVault/server/filmvault-server-fixed.tar.gz opc@132.145.111.110:/home/opc/

# SSH into the server
ssh -i /path/to/your/ssh/key opc@132.145.111.110

# Deploy the server
cd ~
sudo pm2 stop filmvault-api
sudo tar -xzf filmvault-server-fixed.tar.gz -C /opt/filmvault-server/
cd /opt/filmvault-server
NODE_ENV=production sudo pm2 start dist/index.js --name filmvault-api

2. Deploy the client:
# Transfer the client package to your server
scp -i /path/to/your/ssh/key /Users/andywu/FilmVault/client/filmvault-client-fixed.tar.gz opc@132.145.111.110:/home/opc/

# SSH into the server
ssh -i /path/to/your/ssh/key opc@132.145.111.110

# Deploy the client
cd ~
sudo rm -rf /opt/filmvault-client/build/*
sudo tar -xzf filmvault-client-fixed.tar.gz -C /opt/filmvault-client/
sudo chown -R nginx:nginx /opt/filmvault-client/build
sudo chmod -R 755 /opt/filmvault-client/build
sudo systemctl restart nginx