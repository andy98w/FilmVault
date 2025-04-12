# Compute instance for the FilmVault server application
resource "oci_core_instance" "filmvault_server" {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_id
  display_name        = "filmvault-server"
  
  # Compute shape - using VM.Standard.E4.Flex (as requested)
  shape = "VM.Standard.E4.Flex"
  
  shape_config {
    ocpus         = 1
    memory_in_gbs = 16
  }
  
  # Source details - Using Oracle Linux
  source_details {
    source_type = "image"
    source_id   = data.oci_core_images.oracle_linux_images.images[0].id
  }
  
  # Network details
  create_vnic_details {
    subnet_id               = oci_core_subnet.mysql_subnet.id
    display_name            = "filmvault-server-vnic"
    assign_public_ip        = true
    hostname_label          = "filmvault-server"
    nsg_ids                 = [oci_core_network_security_group.filmvault_server_nsg.id]
  }
  
  # Metadata for cloud-init
  metadata = {
    ssh_authorized_keys = file(var.ssh_public_key_path)
    user_data = base64encode(
      templatefile("${path.module}/scripts/cloud-init.tpl", {
        db_host     = oci_mysql_mysql_db_system.myfavmovies_db.endpoints[0].ip_address
        db_user     = var.db_admin_username
        db_password = var.db_admin_password
        db_name     = var.db_name
        # Generate a random JWT secret
        jwt_secret   = random_string.jwt_secret.result
      })
    )
  }
  
  # Prevent replacement on cloud-init changes
  lifecycle {
    ignore_changes = [
      metadata["user_data"]
    ]
  }
  
  # Wait for the MySQL database to be ready
  depends_on = [
    oci_mysql_mysql_db_system.myfavmovies_db
  ]
}

# Latest Oracle Linux image that's compatible with VM.Standard.E4.Flex
data "oci_core_images" "oracle_linux_images" {
  compartment_id           = var.compartment_id
  operating_system         = "Oracle Linux"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
  state                    = "AVAILABLE"
  shape                    = "VM.Standard.E4.Flex"  # Filter for images compatible with this shape
}

# Generate a random JWT secret
resource "random_string" "jwt_secret" {
  length  = 32
  special = true
}

# Output useful info
output "server_public_ip" {
  value = oci_core_instance.filmvault_server.public_ip
}

output "jwt_secret" {
  value     = random_string.jwt_secret.result
  sensitive = true
}