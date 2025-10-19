#!/bin/bash

# FilmVault Server - Secure Cloud Init Script
# This script sets up a production-ready, secure web server

set -e  # Exit on error

# Logging
exec > >(tee /var/log/cloud-init-filmvault.log)
exec 2>&1

echo "=== FilmVault Secure Setup Started at $(date) ==="

# Update system
echo "Updating system packages..."
dnf update -y

# Install required packages
echo "Installing required packages..."
dnf install -y \
  nodejs \
  npm \
  nginx \
  certbot \
  python3-certbot-nginx \
  fail2ban \
  firewalld \
  dnf-automatic \
  aide \
  audit

# Install Node.js 18 (LTS)
echo "Installing Node.js 18..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
dnf install -y nodejs

# Install PM2 globally
npm install -g pm2 serve

# Security: Configure automatic security updates
echo "Configuring automatic security updates..."
cat > /etc/dnf/automatic.conf <<EOF
[commands]
upgrade_type = security
download_updates = yes
apply_updates = yes

[emitters]
emit_via = stdio

[email]
email_from = root@localhost
email_to = root
EOF

systemctl enable --now dnf-automatic.timer

# Security: Configure fail2ban to prevent brute force attacks
echo "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

systemctl enable --now fail2ban

# Security: Configure firewalld
echo "Configuring firewall..."
systemctl enable --now firewalld

# Allow only necessary ports
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-service=ssh
firewall-cmd --reload

# Create service directories
echo "Creating application directories..."
mkdir -p /opt/filmvault-server
mkdir -p /home/opc/filmvault-server/build
mkdir -p /var/log/filmvault

# Set ownership
chown -R opc:opc /opt/filmvault-server
chown -R opc:opc /home/opc/filmvault-server
chown -R opc:opc /var/log/filmvault

# Create environment file with secrets
echo "Creating environment configuration..."
cat > /opt/filmvault-server/.env <<EOF
# Database Configuration
DB_HOST=${db_host}
DB_USER=${db_user}
DB_PASSWORD=${db_password}
DB_NAME=${db_name}

# JWT Configuration
JWT_SECRET=${jwt_secret}

# Server Configuration
NODE_ENV=production
PORT=3000

# OCI Vault Configuration (for secret rotation)
DB_PASSWORD_SECRET_ID=${db_password_secret_id}
JWT_SECRET_ID=${jwt_secret_id}
VAULT_ENDPOINT=${vault_endpoint}
EOF

chmod 600 /opt/filmvault-server/.env
chown opc:opc /opt/filmvault-server/.env

# Configure Nginx as reverse proxy
echo "Configuring Nginx..."
cat > /etc/nginx/nginx.conf <<'NGINXCONF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 4096;
    client_max_body_size 10M;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

    include /etc/nginx/conf.d/*.conf;
}
NGINXCONF

# Create site configuration
cat > /etc/nginx/conf.d/filmvault.conf <<'SITECONF'
# Redirect HTTP to HTTPS (will be enabled after SSL cert is obtained)
# server {
#     listen 80;
#     server_name _;
#     return 301 https://$host$request_uri;
# }

# HTTP configuration (temporary, until SSL is set up)
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # API Backend
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Login endpoint - stricter rate limiting
    location /api/login {
        limit_req zone=login_limit burst=5;

        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # React Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint (no rate limiting)
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# HTTPS configuration (will be configured by certbot)
# server {
#     listen 443 ssl http2;
#     listen [::]:443 ssl http2;
#     server_name ${domain_name};
#
#     ssl_certificate /etc/letsencrypt/live/${domain_name}/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/${domain_name}/privkey.pem;
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers HIGH:!aNULL:!MD5;
#     ssl_prefer_server_ciphers on;
#
#     # Same location blocks as above
# }
SITECONF

# Test and start Nginx
nginx -t && systemctl enable --now nginx

# SSL Certificate Setup (if domain is provided)
%{ if domain_name != "" && email_for_ssl != "" }
echo "Setting up Let's Encrypt SSL for ${domain_name}..."
certbot --nginx -d ${domain_name} \
  --non-interactive \
  --agree-tos \
  --email ${email_for_ssl} \
  --redirect

# Set up auto-renewal
systemctl enable --now certbot-renew.timer
%{ else }
echo "No domain configured. Skipping SSL setup."
echo "To add SSL later, run: certbot --nginx -d yourdomain.com"
%{ endif }

# Create PM2 ecosystem file
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
      watch: false,
      max_memory_restart: "1G",
      error_file: "/var/log/filmvault/api-error.log",
      out_file: "/var/log/filmvault/api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z"
    },
    {
      name: "filmvault-client",
      script: "serve",
      args: "-s /home/opc/filmvault-server/build -l 3001",
      env: {
        PM2_SERVE_PATH: "/home/opc/filmvault-server/build",
        PM2_SERVE_PORT: 3001,
        PM2_SERVE_SPA: "true"
      },
      instances: 1,
      autorestart: true,
      watch: false,
      error_file: "/var/log/filmvault/client-error.log",
      out_file: "/var/log/filmvault/client-out.log"
    }
  ]
};
PMCONF

chown opc:opc /home/opc/ecosystem.config.js

# Setup PM2 to start on boot
env PATH=$PATH:/usr/bin pm2 startup systemd -u opc --hp /home/opc

# Create placeholder React app
cat > /home/opc/filmvault-server/build/index.html <<'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>FilmVault - Secure Setup Complete</title>
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
      max-width: 800px;
      padding: 40px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 20px;
      backdrop-filter: blur(10px);
    }
    h1 { font-size: 3rem; margin-bottom: 1rem; }
    .status { color: #4ade80; font-size: 1.2rem; margin: 20px 0; }
    .security-badge {
      display: inline-block;
      background: #10b981;
      padding: 10px 20px;
      border-radius: 50px;
      margin: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎬 FilmVault</h1>
    <div class="status">✅ Secure Server Setup Complete!</div>
    <p>Your production-ready server is configured with:</p>
    <div class="security-badge">🔒 HTTPS/SSL Ready</div>
    <div class="security-badge">🛡️ WAF Protection</div>
    <div class="security-badge">🔐 Secrets in Vault</div>
    <div class="security-badge">📊 Monitoring Enabled</div>
    <div class="security-badge">🚪 Bastion Access</div>
    <p style="margin-top: 30px;">
      Deploy your React build to:<br/>
      <code>/home/opc/filmvault-server/build</code>
    </p>
    <p>
      Deploy your API to:<br/>
      <code>/opt/filmvault-server</code>
    </p>
  </div>
</body>
</html>
HTMLEOF

chown -R opc:opc /home/opc/filmvault-server

# Create deployment README
cat > /home/opc/DEPLOYMENT_GUIDE.md <<'READMEEOF'
# FilmVault Secure Deployment Guide

## 🎯 What's Been Configured

Your server now has enterprise-grade security:

- ✅ **Nginx Reverse Proxy** - All traffic goes through Nginx
- ✅ **SSL/TLS Ready** - HTTPS configured (or ready for your domain)
- ✅ **WAF Protection** - Web Application Firewall blocks attacks
- ✅ **Secrets in Vault** - Database password & JWT in OCI Vault
- ✅ **Bastion Host** - SSH access only through bastion
- ✅ **Fail2ban** - Automatic IP blocking after failed attempts
- ✅ **Firewall** - Only ports 80, 443, 22 open
- ✅ **Auto Updates** - Security patches applied automatically
- ✅ **Monitoring** - CPU, disk, and MySQL connection alerts
- ✅ **Logging** - All traffic and events logged

## 🚀 Deployment Steps

### 1. Deploy Backend API

From your development machine:
```bash
# Build your TypeScript
cd server
npm run build

# Upload to server (via bastion)
scp -r dist package.json opc@bastion-ip:/tmp/
ssh opc@bastion-ip
scp -r /tmp/dist /tmp/package.json opc@app-server-private-ip:/opt/filmvault-server/
```

On the server:
```bash
cd /opt/filmvault-server
npm install --production
pm2 start /home/opc/ecosystem.config.js
pm2 save
```

### 2. Deploy React Frontend

From your development machine:
```bash
# Build React app
cd client
npm run build

# Upload to server
scp -r build/* opc@bastion-ip:/tmp/build/
ssh opc@bastion-ip
scp -r /tmp/build/* opc@app-server-private-ip:/home/opc/filmvault-server/build/
```

### 3. Enable HTTPS (if you have a domain)

```bash
sudo certbot --nginx -d yourdomain.com --email your@email.com
```

## 🔒 Security Features

### Access Control
- Public: Web traffic on ports 80/443 (anyone can visit your site)
- Private: MySQL database (only accessible from app server)
- Private: Object Storage (only accessible via app server's IAM role)
- Restricted: SSH (only via bastion host, only from your IP)

### Secrets Management
All sensitive data is stored in OCI Vault:
- Database password
- JWT secret

To retrieve secrets:
```bash
# View secret IDs
terraform output vault_info

# Get actual values (requires OCI CLI)
oci secrets secret-bundle get --secret-id <secret-ocid>
```

### Monitoring & Alerts
Check logs:
```bash
# Application logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx
sudo journalctl -u fail2ban
```

### Security Updates
Automatic security updates are enabled. Check status:
```bash
sudo systemctl status dnf-automatic.timer
```

## 🆘 Troubleshooting

### Check service status
```bash
pm2 status
sudo systemctl status nginx
sudo systemctl status fail2ban
sudo systemctl status firewalld
```

### Test Nginx configuration
```bash
sudo nginx -t
```

### View fail2ban banned IPs
```bash
sudo fail2ban-client status sshd
```

## 📊 Access Your Application

- **Production URL**: http://your-server-ip (or https://yourdomain.com)
- **API Endpoint**: http://your-server-ip/api
- **Health Check**: http://your-server-ip/health

## 🔐 SSH Access

Always use the bastion:
```bash
ssh -J opc@bastion-ip opc@app-server-private-ip
```

Or configure SSH config (~/.ssh/config):
```
Host filmvault-bastion
  HostName <bastion-public-ip>
  User opc

Host filmvault-app
  HostName <app-server-private-ip>
  User opc
  ProxyJump filmvault-bastion
```

Then simply: `ssh filmvault-app`
READMEEOF

chown opc:opc /home/opc/DEPLOYMENT_GUIDE.md

# Create welcome message
cat > /etc/motd <<EOF
╔════════════════════════════════════════════════════════════════╗
║              🎬 FilmVault Secure Server 🔒                     ║
╚════════════════════════════════════════════════════════════════╝

Security Status: ✅ PRODUCTION READY

📋 Quick Info:
   • API Port: 3000 (behind Nginx)
   • React Port: 3001 (behind Nginx)
   • Public Access: Port 80/443 only
   • Database: PRIVATE (${db_host})
   • Storage: PRIVATE (IAM-based access)

📖 Documentation: ~/DEPLOYMENT_GUIDE.md
📊 View Logs: pm2 logs
🔍 Check Status: pm2 status

⚠️  Remember: All deployments through bastion host only!
EOF

echo "=== FilmVault Secure Setup Completed Successfully at $(date) ==="
echo "Server is ready for deployment!"
