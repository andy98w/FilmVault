#!/bin/bash
# Script to restart and check the FilmVault API

echo "=== Restarting FilmVault API ==="
pm2 restart filmvault-api

echo ""
echo "=== Checking API logs for errors ==="
pm2 logs filmvault-api --lines 30

echo ""
echo "=== Checking API configuration ==="
echo "Make sure your .env file is set up correctly:"
echo "cat /opt/filmvault-server/.env | grep -v PASSWORD | grep -v SECRET"

echo ""
echo "=== If API continues to error, try these steps ==="
echo "1. Check for disk space issues:"
echo "   df -h"
echo ""
echo "2. Ensure Node.js version is compatible:"
echo "   node -v"
echo ""
echo "3. Try stopping and starting (not just restarting):"
echo "   pm2 stop filmvault-api"
echo "   pm2 start filmvault-api"
echo ""
echo "4. If needed, try redeploying the API:"
echo "   cd /opt/filmvault-server"
echo "   pm2 delete filmvault-api"
echo "   pm2 start dist/index.js --name filmvault-api -i max"
echo ""
echo "5. Check that the MySQL credentials are correct:"
echo "   NODE_ENV=production node -e \"const mysql = require('mysql2/promise'); require('dotenv').config(); async function test() { try { const conn = await mysql.createConnection({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME }); console.log('Connection successful!'); conn.end(); } catch (err) { console.error('Connection error:', err); } } test();\""