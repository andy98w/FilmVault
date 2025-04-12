# FilmVault Terraform Infrastructure

This Terraform configuration creates the complete infrastructure for the FilmVault application in Oracle Cloud Infrastructure (OCI).

## Components Created

1. **MySQL Database**
   - MySQL Database System in OCI
   - Network Load Balancer for external access

2. **Application Server**
   - Compute instance with Oracle Linux 8
   - Pre-configured with Node.js and PM2
   - Firewall rules for access

3. **Networking**
   - Virtual Cloud Network (VCN)
   - Subnet configuration
   - Internet Gateway
   - Security Lists for database and application access

## Prerequisites

1. OCI account and API credentials configured
2. Terraform installed locally
3. SSH key pair for server access

## Configuration

Before applying, you need to set these variables:

1. Edit `terraform.tfvars` file (create if it doesn't exist):
   ```
   compartment_id = "ocid1.compartment.oc1..xxxxxxxx"
   db_admin_password = "your-secure-password"
   ssh_public_key_path = "/path/to/your/id_rsa.pub"
   ```

## Deployment

1. **Initialize Terraform**:
   ```bash
   terraform init
   ```

2. **Validate the configuration**:
   ```bash
   terraform plan
   ```

3. **Apply the configuration**:
   ```bash
   terraform apply
   ```

4. **View outputs**:
   After successful deployment, Terraform will display:
   - MySQL endpoint for connection
   - Network Load Balancer IP
   - Compute instance public IP
   - JWT secret (displayed once)

## Accessing Your Infrastructure

1. **MySQL Database**:
   - Network Load Balancer IP: Use for database connections
   - Username: admin
   - Database: myfavmovies

2. **Application Server**:
   - SSH access: `ssh opc@[server_public_ip]`
   - Application deployment folder: `/opt/filmvault-server`

## Deploying Your Application

After infrastructure is created:

1. Build your application locally:
   ```bash
   cd /Users/andywu/FilmVault/server
   npm run build
   ```

2. Transfer files to the server:
   ```bash
   scp -r dist/* opc@[server_public_ip]:/opt/filmvault-server/
   scp package.json opc@[server_public_ip]:/opt/filmvault-server/
   ```

3. SSH to the server and start the application:
   ```bash
   ssh opc@[server_public_ip]
   cd /opt/filmvault-server
   npm install --production
   pm2 start dist/index.js --name filmvault-api
   pm2 save
   ```

## Cleanup

To destroy all created resources:
```bash
terraform destroy
```