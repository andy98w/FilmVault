# OCI MySQL Deployment for MyFavMovies

This Terraform configuration deploys a MySQL database in Oracle Cloud Infrastructure (OCI) for the MyFavMovies application.

## Prerequisites

1. Install Terraform (version 1.0.0 or later)
2. Set up OCI credentials
3. Generate an API key and configure OCI CLI

## Configuration Files

- `main.tf`: Main Terraform configuration file with parameterized variables
- `simple_mysql.tf.disabled`: Alternative simplified Terraform configuration (disabled by default)
- `terraform.tfvars`: Variable values for the Terraform configuration
- `scripts/init_database.sql`: SQL script to initialize the database schema
- `scripts/check_mysql_versions.sh`: Script to check available MySQL versions in OCI

## Troubleshooting Common Errors

If you encounter the error `attribute = {adminPassword}, value = {Given Admin Password} - may not be valid` or `attribute = {mysqlVersion}, value = {8.0.32} - may not be valid`, try these solutions:

1. **Password Requirements**: OCI MySQL has strict password requirements. The password should:
   - Be at least 8 characters
   - Include uppercase and lowercase letters
   - Include at least one number
   - Include at least one special character

2. **MySQL Version**: If the specified MySQL version is not available:
   - Remove the `mysql_version` line from the configuration to use the default version
   - Run the script `./scripts/check_mysql_versions.sh` to see available versions

3. **Try using the simplified configuration**:
   ```bash
   # Backup main configuration
   mv main.tf main.tf.bak
   
   # Enable simplified configuration
   mv simple_mysql.tf.disabled simple_mysql.tf
   
   # Re-initialize and apply
   terraform init
   terraform apply
   ```

## Deployment Steps

1. **Initialize Terraform**

   ```bash
   cd /Users/andywu/MyFavMovies/ReactVersion/server/terraform
   terraform init
   ```

2. **Update Variables (Optional)**

   Edit `terraform.tfvars` to customize deployment parameters such as:
   - Database admin password (required)
   - MySQL shape
   - Storage size
   - Network configuration

3. **Plan the Deployment**

   ```bash
   terraform plan
   ```

   Review the planned changes to ensure they match your expectations.

4. **Deploy the Infrastructure**

   ```bash
   terraform apply
   ```

   Type `yes` when prompted to confirm the deployment.

5. **Initialize the Database**

   After deployment completes, you will get the MySQL endpoint information. Use this to connect to the database and run the initialization script:

   ```bash
   mysql -h <mysql_endpoint> -u admin -p < scripts/init_database.sql
   ```

6. **Update Application Configuration**

   Update the application's `.env` file with the new database connection information:

   ```
   DB_HOST=<mysql_endpoint>
   DB_USER=admin
   DB_PASSWORD=<your_admin_password>
   DB_NAME=myfavmovies
   USE_MOCK_DATA=false
   ```

## Cleanup

To destroy the infrastructure when no longer needed:

```bash
terraform destroy
```

Type `yes` when prompted to confirm.

## Security Notes

- The database admin password is stored in `terraform.tfvars`. Ensure this file is not committed to version control.
- By default, the MySQL instance is accessible from anywhere on port 3306. Consider restricting access for production environments.
- The OCI private key is referenced in the provider configuration. Ensure it is kept secure.

## Troubleshooting

- If you encounter issues with the MySQL deployment, check the OCI console for error messages.
- Ensure your OCI user has the necessary permissions to create resources in the specified compartment.
- Check that the availability domain specified in the configuration exists in your region.