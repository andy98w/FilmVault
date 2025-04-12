# Environment Setup Guide for FilmVault

This document provides instructions for setting up your environment variables for the FilmVault application.

## Client Environment Variables

Create a `.env` file in the `client` directory with the following variables:

```
REACT_APP_API_URL=http://localhost:3000
```

## Server Environment Variables

Create a `.env` file in the `server` directory with the following variables:

### Basic Configuration
```
PORT=3000
CLIENT_URL=http://localhost:3000
```

### JWT Authentication
```
JWT_SECRET=your_secure_random_string
```

To generate a secure random string for JWT_SECRET, you can run this command:
```
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Database Configuration
```
DB_HOST=localhost
DB_USER=your_database_username
DB_PASSWORD=your_database_password
DB_NAME=myfavmovies
DB_NLB_IP=
```

### TMDB API
```
TMDB_API_KEY=your_tmdb_api_key_here
```
Get your TMDB API key by signing up at [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)

### Oracle Cloud Infrastructure (Optional for OCI deployment)
```
OCI_USER_OCID=ocid1.user.oc1..example
OCI_FINGERPRINT=00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00
OCI_TENANCY_OCID=ocid1.tenancy.oc1..example
OCI_REGION=ca-toronto-1
OCI_KEY_FILE=/path/to/your/key.pem
```

### Email Configuration (SendGrid)
```
FROM_EMAIL=your_sender_email@example.com
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

#### Setting Up SendGrid for Email Functionality

1. Sign up for a SendGrid account at [https://sendgrid.com/](https://sendgrid.com/)
2. Create an API key from the SendGrid dashboard:
   - Go to Settings > API Keys
   - Click "Create API Key"
   - Give it a name like "FilmVault API"
   - Select "Full Access" or customize permissions as needed
   - Copy the generated API key

3. Verify your sender identity:
   - Go to Settings > Sender Authentication
   - Follow the instructions to verify a single sender or domain

4. Add the API key to your `.env` file:
   ```
   SENDGRID_API_KEY=your_api_key_here
   FROM_EMAIL=your_verified_email@example.com
   ```

### Development Options
```
USE_MOCK_DATA=false
TEST_EMAIL=your_test_email@example.com
```

## Testing Email Functionality

After setting up your environment variables, you can test the email functionality using:

```bash
cd server
npx ts-node test-email.ts
```

This will send test verification and password reset emails to the email address specified in the TEST_EMAIL environment variable.

## Notes for Development

- In development, if no SendGrid API key is provided, the application will fall back to displaying verification tokens in the API response
- For production, always ensure that SENDGRID_API_KEY is properly configured to enable actual email sending