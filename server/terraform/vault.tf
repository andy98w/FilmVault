# OCI Vault for Secrets Management
# This provides secure storage for sensitive data like database passwords

# Create a Vault
resource "oci_kms_vault" "filmvault_secrets" {
  compartment_id = var.compartment_id
  display_name   = "filmvault-secrets"
  vault_type     = "DEFAULT"
}

# Create a Master Encryption Key
resource "oci_kms_key" "filmvault_master_key" {
  compartment_id = var.compartment_id
  display_name   = "filmvault-master-encryption-key"

  key_shape {
    algorithm = "AES"
    length    = 32
  }

  management_endpoint = oci_kms_vault.filmvault_secrets.management_endpoint
}

# Generate a strong random password for MySQL
resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
  min_lower        = 2
  min_upper        = 2
  min_numeric      = 2
  min_special      = 2
}

# Store the database password in the vault as a secret
resource "oci_vault_secret" "db_password_secret" {
  compartment_id = var.compartment_id
  vault_id       = oci_kms_vault.filmvault_secrets.id
  key_id         = oci_kms_key.filmvault_master_key.id
  secret_name    = "filmvault-db-password"

  secret_content {
    content_type = "BASE64"
    content      = base64encode(random_password.db_password.result)
  }

  description = "MySQL database admin password"
}

# Generate JWT secret
resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

# Store JWT secret in vault
resource "oci_vault_secret" "jwt_secret" {
  compartment_id = var.compartment_id
  vault_id       = oci_kms_vault.filmvault_secrets.id
  key_id         = oci_kms_key.filmvault_master_key.id
  secret_name    = "filmvault-jwt-secret"

  secret_content {
    content_type = "BASE64"
    content      = base64encode(random_password.jwt_secret.result)
  }

  description = "JWT signing secret"
}

# Policy to allow compute instances to read secrets
resource "oci_identity_policy" "vault_read_policy" {
  name           = "filmvault-vault-read-policy"
  description    = "Allow compute instances to read secrets from vault"
  compartment_id = var.compartment_id

  statements = [
    "Allow dynamic-group ${oci_identity_dynamic_group.compute_dynamic_group.name} to read secret-bundles in compartment id ${var.compartment_id}",
    "Allow dynamic-group ${oci_identity_dynamic_group.compute_dynamic_group.name} to read secrets in compartment id ${var.compartment_id}",
  ]

  depends_on = [oci_identity_dynamic_group.compute_dynamic_group]
}

# Output vault information (not the secrets themselves)
output "vault_info" {
  value = {
    vault_id           = oci_kms_vault.filmvault_secrets.id
    vault_name         = oci_kms_vault.filmvault_secrets.display_name
    db_password_secret_id = oci_vault_secret.db_password_secret.id
    jwt_secret_id      = oci_vault_secret.jwt_secret.id
  }
  description = "Vault and secret IDs (use OCI CLI to retrieve actual secret values)"
}

# Output the actual passwords (marked as sensitive, only visible with terraform output)
output "db_password" {
  value     = random_password.db_password.result
  sensitive = true
}

output "jwt_secret" {
  value     = random_password.jwt_secret.result
  sensitive = true
}
