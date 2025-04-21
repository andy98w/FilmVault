# FilmVault Deployment Guide
1. **Check service status**:
   ```bash
   sudo systemctl status filmvault
   ```

2. **View application logs**:
   ```bash
   sudo journalctl -u filmvault -f
   ```

3. **Restart the service**:
   ```bash
   sudo systemctl restart filmvault
   ```

4. **Stop the service**:
   ```bash
   sudo systemctl stop filmvault
   ```

5. **Start the service**:
   ```bash
   sudo systemctl start filmvault
   ```

6. **Update environment variables**:
   ```bash
   sudo nano /etc/systemd/system/filmvault.service
   sudo systemctl daemon-reload
   sudo systemctl restart filmvault
   ```

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
   scp filmvault-client.tar.gz opc@132.145.111.110:/home/opc/
   ```

4. SSH into server:
   ```bash
   ssh -i id_rsa opc@132.145.111.110
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
   npm run build
   ```

2. Create a deployment package (include environment file):
   ```bash
   tar -czf filmvault-server.tar.gz dist/ package.json package-lock.json .env.production
   ```

3. Transfer to server:
   ```bash
   scp filmvault-server.tar.gz opc@132.145.111.110:/home/opc/
   ```

4. SSH into server:
   ```bash
   ssh -i id_rsa opc@132.145.111.110
   ```

5. Deploy server on server:
   ```bash
   cd ~
   sudo systemctl stop filmvault
   sudo mkdir -p /opt/filmvault-server-new
   sudo tar -xzf filmvault-server.tar.gz -C /opt/filmvault-server-new
   cd /opt/filmvault-server-new
   sudo npm install --production
   sudo rm -rf /opt/filmvault-server
   sudo mv /opt/filmvault-server-new /opt/filmvault-server
   ```

6. Create or update systemd service file:
   ```bash
   sudo nano /etc/systemd/system/filmvault.service
   ```
   
   Add the following content:
   ```
   [Unit]
   Description=FilmVault Node.js Application
   After=network.target
   
   [Service]
   Type=simple
   User=opc
   WorkingDirectory=/opt/filmvault-server
   ExecStart=/usr/bin/node dist/index.js
   Restart=on-failure
   RestartSec=10
   StandardOutput=syslog
   StandardError=syslog
   SyslogIdentifier=filmvault
   Environment=NODE_ENV=production
   Environment=PORT=3001
   # Add other environment variables as needed
   # Environment=DB_HOST=your_db_host
   # Environment=DB_USER=your_db_user
   # Environment=DB_PASSWORD=your_db_password
   
   [Install]
   WantedBy=multi-user.target
   ```

7. Enable and start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable filmvault
   sudo systemctl start filmvault
   ```

8. Verify deployment:
   ```bash
   sudo systemctl status filmvault
   sudo journalctl -u filmvault -f
   ```

9. Restart the service after configuration changes:
   ```bash
   sudo systemctl restart filmvault
   ```