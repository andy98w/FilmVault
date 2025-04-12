# Deploying React Application to OCI

This guide walks you through deploying your FilmVault React application to Oracle Cloud Infrastructure (OCI) using Object Storage as a static website host.

## Step 1: Build the React Application

1. Navigate to the client directory:
   ```bash
   cd /Users/andywu/FilmVault/client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create production build:
   ```bash
   npm run build
   ```
   This will create a `build` directory with optimized production files.

## Step 2: Configure the OCI Console for Static Website Hosting

1. **Log in to OCI Console**:
   - Go to [https://cloud.oracle.com](https://cloud.oracle.com)
   - Sign in with your Oracle Cloud credentials

2. **Create a Bucket**:
   - Go to Storage → Object Storage & Archive Storage → Buckets
   - Click "Create Bucket"
   - Name: `filmvault-website`
   - Set to "Standard" storage tier
   - Check "Emit Object Events" 
   - Click "Create"

3. **Enable Static Website Hosting**:
   - In your bucket details page, click "Edit" under "Static Website"
   - Toggle "Enable static website hosting" to ON
   - Index document: `index.html`
   - Error document: `index.html` (for SPA routing)
   - Click "Save Changes"

4. **Set Bucket Visibility**:
   - Click "Edit" under "Visibility"
   - Change to "Public"
   - Click "Save Changes"

## Step 3: Configure CORS (Cross-Origin Resource Sharing)

1. In your bucket details, go to "CORS"
2. Click "Create Rule"
3. Add the following rule:
   - Allowed Origins: `*`
   - Allowed Methods: `GET`, `HEAD`
   - Allowed Headers: `*`
   - Max Age: `3600`
   - Click "Create CORS Rule"

## Step 4: Upload Files to OCI Bucket

1. **Manual Upload via Console**:
   - In your bucket details page, click "Upload"
   - Select all files from your `build` directory
   - Click "Upload"

2. **OR Use OCI CLI for Bulk Upload**:
   - Install OCI CLI if not already installed
   - Configure authentication
   - Run the following command:
     ```bash
     oci os object bulk-upload --bucket-name filmvault-website --src-dir /Users/andywu/FilmVault/client/build --content-type auto
     ```

## Step 5: Configure the API Endpoint 

For the React app to connect to your backend:

1. Create a `.env.production` file in your client directory:
   ```
   REACT_APP_API_URL=https://your-api-endpoint.com
   ```

2. Rebuild the application with this environment variable and re-upload.

## Step A6: ccess Your Website

Once deployed, your website will be available at:
```
https://objectstorage.{region}.oraclecloud.com/n/{namespace}/b/filmvault-website/o/index.html
```

Replace `{region}` with your OCI region (e.g., `us-phoenix-1`) and `{namespace}` with your tenancy's namespace.

## Step 7: Configure DNS (Optional)

For a custom domain:

1. Purchase a domain if you don't have one
2. Set up OCI Edge service or use a CDN provider
3. Configure your DNS to point to your OCI Object Storage

## Step 8: Setup a CDN for Better Performance (Optional)

1. Go to Networking → Edge Services → CDN
2. Create a new CDN distribution pointing to your bucket
3. Configure caching rules as needed
4. Point your domain to the CDN endpoint

## Troubleshooting

- **404 Errors on Routes**: Ensure your error document is set to `index.html` for SPA routing
- **CORS Issues**: Verify your CORS settings in the bucket configuration
- **API Connection Failed**: Check that your API endpoint is correctly set and accessible

## Production Considerations

- Set up CI/CD pipeline for automated deployments
- Implement proper cache controls for optimal performance
- Configure proper security policies
- Monitor application performance and errors