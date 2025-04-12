# FilmVault Environment Variables Setup

## Overview

This document explains how to set up the environment variables required for both the FilmVault client and server applications.

## Server Environment Variables

Create a `.env` file in the server directory with the following variables:

```
# Server environment variables
PORT=5001                        # The port the server will run on
CLIENT_URL=http://localhost:3000 # The URL of the client application

# JWT Authentication
JWT_SECRET=your_jwt_secret_here  # Secret key for JWT token generation (generate a secure random string)

# Database Configuration
DB_HOST=localhost                # Database host
DB_USER=username                 # Database username
DB_PASSWORD=password             # Database password
DB_NAME=myfavmovies             # Database name
DB_NLB_IP=                      # Optional: Network Load Balancer IP for OCI deployment

# TMDB API
TMDB_API_KEY=your_tmdb_api_key_here # Your TMDB API key (get from themoviedb.org)

# OCI Configuration
OCI_USER_OCID=ocid1.user.oc1..example                  # Your OCI user OCID
OCI_FINGERPRINT=00:00:00:00:00:00:00:00:00:00:00:00    # Your OCI API key fingerprint
OCI_TENANCY_OCID=ocid1.tenancy.oc1..example            # Your OCI tenancy OCID
OCI_REGION=ca-toronto-1                                # Your OCI region
OCI_KEY_FILE=/path/to/your/key.pem                     # Path to your OCI private key file

# Email Configuration (for user verification and password reset)
FROM_EMAIL=noreply@example.com              # Email address to send from
SENDGRID_API_KEY=your_sendgrid_api_key_here # SendGrid API key for email delivery

# Development options
USE_MOCK_DATA=false                # Set to 'true' to use mock data instead of a real database
```

## Client Environment Variables

Create a `.env` file in the client directory with the following variables:

```
REACT_APP_API_URL=http://localhost:5001  # The URL of the server API
```

## Generating Secure Secret Keys

For the JWT_SECRET, you should generate a secure random string. Here's how to do it:

### Using Node.js

```javascript
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Using OpenSSL

```bash
openssl rand -hex 32
```

## Getting a TMDB API Key

1. Create an account at [https://www.themoviedb.org](https://www.themoviedb.org)
2. Go to your account settings
3. Click on "API" in the left sidebar
4. Follow the instructions to request an API key
5. Copy the API key (v3 auth) to your `.env` file

## OCI Configuration

If you're using Oracle Cloud Infrastructure (OCI), you'll need to:

1. Create an API key pair
2. Upload the public key to your OCI account
3. Note down the fingerprint, user OCID, and tenancy OCID
4. Store the private key file securely
5. Add these values to your `.env` file
6. Run the setup script to generate the OCI config file:

```bash
cd server
npm run generate-oci-config
```

This will create an `oci_config` file using the values from your environment variables.

See the Oracle Cloud documentation for more details on generating API keys.

## Development vs Production

In production environments:

1. Ensure all secrets are properly secured
2. Use environment-specific `.env` files
3. For React, use `.env.production` for production builds
4. Never commit `.env` files to version control
5. Consider using a secrets management service for production deployments

## Troubleshooting

If you encounter connection issues:

1. Verify all environment variables are set correctly
2. Check database connectivity
3. Ensure your TMDB API key is valid
4. Check the server logs for specific error messages