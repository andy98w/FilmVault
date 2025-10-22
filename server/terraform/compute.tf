resource "oci_core_instance" "filmvault_server" {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_id
  display_name        = "filmvault-server"
  shape               = "VM.Standard.E2.1"

  source_details {
    source_type = "image"
    source_id   = data.oci_core_images.app_server_image.images[0].id
  }

  create_vnic_details {
    subnet_id               = oci_core_subnet.mysql_subnet.id
    display_name            = "filmvault-server-vnic"
    assign_public_ip        = true
    hostname_label          = "filmvault-server"
    nsg_ids                 = [oci_core_network_security_group.filmvault_server_nsg.id]
  }

  metadata = {
    ssh_authorized_keys = file(var.ssh_public_key_path)
    user_data = base64encode(
      templatefile("${path.module}/scripts/cloud-init-minimal.tpl", {
        db_user       = var.db_admin_username
        db_password   = random_password.db_password.result
        db_name       = var.db_name
        jwt_secret    = random_password.jwt_secret.result
        domain_name   = var.domain_name
        email_for_ssl = var.email_for_ssl
      })
    )
  }

  lifecycle {
    ignore_changes = [metadata["user_data"]]
  }
}

data "oci_core_images" "app_server_image" {
  compartment_id           = var.compartment_id
  operating_system         = "Oracle Linux"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
  state = "AVAILABLE"
  shape = "VM.Standard.E2.1"
}

output "server_public_ip" {
  value       = oci_core_instance.filmvault_server.public_ip
  description = "Public IP of the application server"
}
