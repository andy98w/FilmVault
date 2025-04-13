1. Build locally:
   cd /Users/andywu/FilmVault/server
   npm run build

    2. Create a deployment package:
       tar -czf filmvault-server.tar.gz dist/ package.json package-lock.json

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
   scp /Users/andywu/FilmVault/server/filmvault-server-fixed.tar.gz opc@your-server-ip:/home/opc/

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

scp /Users/andywu/FilmVault/client/filmvault-client-jwt.tar.gz opc@132.145.111.110:/home/opc/

2. Deploy the updated client on your server:
# On your server
cd ~
sudo rm -rf /opt/filmvault-client/build/*
sudo tar -xzvf filmvault-client-jwt.tar.gz -C /opt/filmvault-client
sudo chown -R nginx:nginx /opt/filmvault-client/build
sudo chmod -R 755 /opt/filmvault-client/build
sudo systemctl restart nginx