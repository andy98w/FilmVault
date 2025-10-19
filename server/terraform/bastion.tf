resource "oci_core_subnet" "bastion_subnet" {
  compartment_id    = var.compartment_id
  vcn_id            = oci_core_vcn.mysql_vcn.id
  display_name      = "bastion-subnet"
  cidr_block        = "10.0.2.0/24"
  dns_label         = "bastionsubnet"
  security_list_ids = [oci_core_security_list.bastion_security_list.id]
  route_table_id    = oci_core_route_table.mysql_route_table.id
}

resource "oci_core_security_list" "bastion_security_list" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.mysql_vcn.id
  display_name   = "bastion-security-list"

  ingress_security_rules {
    protocol    = "6" # TCP
    source      = var.admin_ip_cidr
    source_type = "CIDR_BLOCK"

    tcp_options {
      min = 22
      max = 22
    }

    description = "SSH from admin IP only"
  }

  egress_security_rules {
    destination      = "0.0.0.0/0"
    destination_type = "CIDR_BLOCK"
    protocol         = "all"
  }
}

resource "oci_core_instance" "bastion_host" {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_id
  display_name        = "filmvault-bastion"
  shape               = "VM.Standard.E2.1.Micro"

  source_details {
    source_type = "image"
    source_id   = data.oci_core_images.bastion_image.images[0].id
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.bastion_subnet.id
    display_name     = "bastion-vnic"
    assign_public_ip = true
    hostname_label   = "bastion"
  }

  metadata = {
    ssh_authorized_keys = file(var.ssh_public_key_path)
  }
}

resource "oci_core_network_security_group_security_rule" "filmvault_server_ssh_from_bastion" {
  network_security_group_id = oci_core_network_security_group.filmvault_server_nsg.id
  direction                 = "INGRESS"
  protocol                  = "6" # TCP
  source                    = oci_core_subnet.bastion_subnet.cidr_block
  source_type               = "CIDR_BLOCK"
  stateless                 = false

  tcp_options {
    destination_port_range {
      min = 22
      max = 22
    }
  }

  description = "SSH access from bastion host"
}

data "oci_core_images" "bastion_image" {
  compartment_id           = var.compartment_id
  operating_system         = "Oracle Linux"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
  state                    = "AVAILABLE"
  shape = "VM.Standard.E2.1.Micro"
}

output "bastion_public_ip" {
  value       = oci_core_instance.bastion_host.public_ip
  description = "Bastion host public IP for SSH access"
}

output "ssh_instructions" {
  value = <<-EOT
    To connect to your application server via bastion:

    1. SSH to bastion:
       ssh opc@${oci_core_instance.bastion_host.public_ip}

    2. From bastion, SSH to application server:
       ssh opc@${oci_core_instance.filmvault_server.private_ip}

    Or use SSH ProxyJump (one command):
       ssh -J opc@${oci_core_instance.bastion_host.public_ip} opc@${oci_core_instance.filmvault_server.private_ip}
  EOT
  description = "Instructions for SSH access via bastion"
}
