#!/bin/bash

# FilmVault - MINIMAL Setup for Portfolio/Demo App
# Optimized for E2.Micro (1GB RAM)

set -e
exec > >(tee /var/log/cloud-init-filmvault.log)
exec 2>&1

echo "=== FilmVault Minimal Setup Started at $(date) ==="

# Update system (essential only)
echo "Updating system..."
dnf update -y

# Install Node.js 18
echo "Installing Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
dnf install -y nodejs nginx certbot python3-certbot-nginx

# Install MySQL 8.0
echo "Installing MySQL..."
dnf install -y mysql-server

# Install PM2 globally
npm install -g pm2 serve

# Create directories
mkdir -p /opt/filmvault-server
mkdir -p /home/opc/filmvault-server/build
mkdir -p /var/log/filmvault

chown -R opc:opc /opt/filmvault-server
chown -R opc:opc /home/opc/filmvault-server
chown -R opc:opc /var/log/filmvault

# Configure MySQL
echo "Configuring MySQL..."
systemctl enable --now mysqld

# Secure MySQL installation and create database
mysql -u root <<MYSQL_SCRIPT
-- Set root password
ALTER USER 'root'@'localhost' IDENTIFIED BY '${db_password}';

-- Create database
CREATE DATABASE IF NOT EXISTS ${db_name};

-- Create application user
CREATE USER IF NOT EXISTS '${db_user}'@'localhost' IDENTIFIED BY '${db_password}';
GRANT ALL PRIVILEGES ON ${db_name}.* TO '${db_user}'@'localhost';
FLUSH PRIVILEGES;

-- Remove anonymous users
DELETE FROM mysql.user WHERE User='';

-- Remove remote root login
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');

FLUSH PRIVILEGES;
MYSQL_SCRIPT

echo "MySQL configured successfully!"

# Create environment file
cat > /opt/filmvault-server/.env <<EOF
DB_HOST=localhost
DB_USER=${db_user}
DB_PASSWORD=${db_password}
DB_NAME=${db_name}
JWT_SECRET=${jwt_secret}
NODE_ENV=production
PORT=3000
EOF

chmod 600 /opt/filmvault-server/.env
chown opc:opc /opt/filmvault-server/.env

# Configure Nginx (minimal, no SSL needed for demo)
cat > /etc/nginx/nginx.conf <<'NGINXCONF'
user nginx;
worker_processes 1;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 512;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    sendfile on;
    keepalive_timeout 65;
    client_max_body_size 10M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    include /etc/nginx/conf.d/*.conf;
}
NGINXCONF

# Site configuration with SSL support
cat > /etc/nginx/conf.d/filmvault.conf <<SITECONF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${domain_name};

    # API Backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # React Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
SITECONF

# Configure firewalld (minimal)
systemctl enable --now firewalld
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=ssh
firewall-cmd --reload

# Start Nginx
nginx -t && systemctl enable --now nginx

# SSL Certificate Setup with Let's Encrypt
%{ if domain_name != "" && email_for_ssl != "" }
echo "Setting up Let's Encrypt SSL for ${domain_name}..."
sleep 10  # Wait for DNS to propagate

# Try to get certificate (with retry logic)
for i in {1..3}; do
  if certbot --nginx -d ${domain_name} \
    --non-interactive \
    --agree-tos \
    --email ${email_for_ssl} \
    --redirect; then
    echo "SSL certificate obtained successfully!"
    break
  else
    echo "Attempt $i failed, waiting 30 seconds..."
    sleep 30
  fi
done

# Set up auto-renewal
systemctl enable --now certbot-renew.timer
echo "SSL setup complete! Your site is now accessible at https://${domain_name}"
%{ else }
echo "No domain/email configured. Skipping SSL setup."
echo "Site accessible at: http://$(hostname -I | awk '{print $1}')"
echo "To add SSL later:"
echo "  1. Add domain DNS A record pointing to this server"
echo "  2. Run: sudo certbot --nginx -d yourdomain.com --email your@email.com"
%{ endif }

# PM2 ecosystem file
cat > /home/opc/ecosystem.config.js <<'PMCONF'
module.exports = {
  apps: [
    {
      name: "filmvault-api",
      script: "/opt/filmvault-server/dist/index.js",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "700M",
      error_file: "/var/log/filmvault/api-error.log",
      out_file: "/var/log/filmvault/api-out.log"
    },
    {
      name: "filmvault-client",
      script: "serve",
      args: "-s /home/opc/filmvault-server/build -l 3001",
      instances: 1,
      autorestart: true,
      max_memory_restart: "200M",
      error_file: "/var/log/filmvault/client-error.log",
      out_file: "/var/log/filmvault/client-out.log"
    }
  ]
};
PMCONF

chown opc:opc /home/opc/ecosystem.config.js

# Setup PM2 startup
env PATH=$PATH:/usr/bin pm2 startup systemd -u opc --hp /home/opc

# Create placeholder page
cat > /home/opc/filmvault-server/build/index.html <<'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>FilmVault - Portfolio Demo</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      text-align: center;
    }
    .container {
      max-width: 600px;
      padding: 40px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 20px;
      backdrop-filter: blur(10px);
    }
    h1 { font-size: 3rem; margin-bottom: 1rem; }
    .badge {
      display: inline-block;
      background: #10b981;
      padding: 8px 16px;
      border-radius: 50px;
      margin: 10px;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎬 FilmVault</h1>
    <p style="font-size: 1.2rem;">Portfolio Demo Application</p>
    <div class="badge">✅ Server Ready</div>
    <div class="badge">🔒 Secure</div>
    <div class="badge">💰 Cost Optimized</div>
    <p style="margin-top: 30px; font-size: 0.9rem;">
      Deploy your built application to get started!
    </p>
  </div>
</body>
</html>
HTMLEOF

chown -R opc:opc /home/opc/filmvault-server

# Create simple deployment guide
cat > /home/opc/DEPLOY.md <<'README'
# FilmVault - Quick Deployment

## This is a minimal setup optimized for portfolio/demo use

### Deploy Backend
```bash
scp -r dist package.json opc@<server-ip>:/opt/filmvault-server/
ssh opc@<server-ip>
cd /opt/filmvault-server
npm install --production
pm2 start /home/opc/ecosystem.config.js
pm2 save
```

### Deploy Frontend
```bash
scp -r build/* opc@<server-ip>:/home/opc/filmvault-server/build/
ssh opc@<server-ip> "pm2 restart all"
```

## Access Your App
- **URL:** http://<server-ip>
- **API:** http://<server-ip>/api
- **Health:** http://<server-ip>/health

## Resources (E2.Micro - 1GB RAM)
This is a minimal free-tier setup. If you experience slowness:
- Restart: `pm2 restart all`
- Check memory: `free -h`
- View logs: `pm2 logs`

## Cost: ~$15-26/month
- Compute: FREE (E2.Micro)
- MySQL: $15/month
- Block Storage: $11/month
README

chown opc:opc /home/opc/DEPLOY.md

# Welcome message
cat > /etc/motd <<EOF
╔══════════════════════════════════════════════════╗
║        🎬 FilmVault Portfolio Demo 🎬            ║
╚══════════════════════════════════════════════════╝

Status: ✅ READY (Minimal/Free Tier)

Resources: E2.Micro (1GB RAM)
Database: MySQL (private)
Access: http://$(hostname -I | awk '{print $1}')

📖 Deployment: ~/DEPLOY.md
📊 Monitor: pm2 status
EOF

echo "=== Setup Complete at $(date) ==="
