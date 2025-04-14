#!/bin/bash

# Update system
dnf update -y

# Install Node.js using more reliable method
echo "Installing Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
dnf clean all
dnf makecache
dnf install -y nodejs

# Install PM2 and serve globally
npm install -g pm2 serve

# Create service directories
mkdir -p /opt/filmvault-server
mkdir -p /home/opc/filmvault-server
mkdir -p /home/opc/filmvault-server/build

# Create environment file
cat > /opt/filmvault-server/.env << EOF
DB_HOST=${db_host}
DB_USER=${db_user}
DB_PASSWORD=${db_password}
DB_NAME=${db_name}
JWT_SECRET=${jwt_secret}
PORT=${"3001"}
EOF

# Setup firewall rules
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --permanent --add-port=3001/tcp
firewall-cmd --reload

# PM2 setup with startup
pm2 startup
env PATH=$PATH:/usr/bin pm2 startup systemd -u opc --hp /home/opc

# Create React app placeholder index.html
cat > /home/opc/filmvault-server/build/index.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#000000" />
  <meta name="description" content="FilmVault - Your Personal Movie Collection" />
  <title>FilmVault</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background-color: #121212;
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      text-align: center;
    }
    .container {
      max-width: 800px;
      padding: 20px;
    }
    h1 {
      color: #ff5252;
      font-size: 2.5rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>FilmVault</h1>
    <p>Your React application will be deployed here.</p>
    <p>Please upload your built React files to /home/opc/filmvault-server/build</p>
  </div>
</body>
</html>
EOF

# Create PM2 ecosystem file for both backend and frontend
cat > /home/opc/ecosystem.config.js << EOF
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
      watch: false
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
      watch: false
    }
  ]
};
EOF

# Create a welcome message
cat > /etc/motd << EOF
=======================================================
Welcome to the FilmVault Server!

Server Configuration:
- DB Host: ${db_host}
- DB Name: ${db_name}
- API Port: 3000
- Frontend Port: 3001

Instructions:
1. Backend API: /opt/filmvault-server
2. Frontend React: /home/opc/filmvault-server/build
3. Use PM2 to manage both services
4. API Endpoint: http://$(hostname -I | awk '{print $1}'):3000
5. React App URL: http://$(hostname -I | awk '{print $1}'):3001

For more info, see: /home/opc/filmvault-server/README.md
=======================================================
EOF

# Create a deployment README
cat > /home/opc/filmvault-server/README.md << EOF
# FilmVault Full Stack Deployment

## Environment Configuration
The server is preconfigured with environment variables in \`.env\`:
- Database host: ${db_host}
- Database name: ${db_name}
- JWT secret is configured

## Backend Deployment Steps

1. Transfer your built backend files to this server:
   \`\`\`
   scp -r dist/* username@$(hostname -I | awk '{print $1}'):/opt/filmvault-server/
   scp package.json username@$(hostname -I | awk '{print $1}'):/opt/filmvault-server/
   \`\`\`

2. Install production dependencies:
   \`\`\`
   cd /opt/filmvault-server
   npm install --production
   \`\`\`

## Frontend Deployment Steps

1. On your development machine, build the React app:
   \`\`\`
   cd client
   npm run build
   \`\`\`

2. Transfer the built React app to this server:
   \`\`\`
   scp -r build/* username@$(hostname -I | awk '{print $1}'):/home/opc/filmvault-server/build/
   \`\`\`

## Starting the Application

Start both backend and frontend with PM2:
\`\`\`
cd /home/opc
pm2 start ecosystem.config.js
pm2 save
\`\`\`

## Monitoring
- View logs: \`pm2 logs\`
- Check status: \`pm2 status\`
- Restart apps: \`pm2 restart all\`

## Accessing the Application
- Backend API: http://$(hostname -I | awk '{print $1}'):3000
- Frontend React App: http://$(hostname -I | awk '{print $1}'):3001

## Security
- The server is configured with firewall rules allowing ports 3000 and 3001
- For production, consider setting up Nginx as a reverse proxy with SSL
EOF

# Set permissions
chown -R opc:opc /opt/filmvault-server
chmod -R 750 /opt/filmvault-server
chown -R opc:opc /home/opc/filmvault-server
chmod -R 750 /home/opc/filmvault-server
chown opc:opc /home/opc/ecosystem.config.js
chmod 750 /home/opc/ecosystem.config.js

# Start the services (they will restart on reboot)
runuser -l opc -c 'pm2 start /home/opc/ecosystem.config.js'
runuser -l opc -c 'pm2 save'