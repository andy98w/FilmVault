# Network Security Group for the FilmVault Server
resource "oci_core_network_security_group" "filmvault_server_nsg" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.mysql_vcn.id
  display_name   = "filmvault-server-nsg"
}

# SSH - Restricted to your IP only
resource "oci_core_network_security_group_security_rule" "filmvault_server_ssh" {
  network_security_group_id = oci_core_network_security_group.filmvault_server_nsg.id
  direction                 = "INGRESS"
  protocol                  = "6" # TCP
  source                    = var.admin_ip_cidr
  source_type               = "CIDR_BLOCK"
  stateless                 = false

  tcp_options {
    destination_port_range {
      min = 22
      max = 22
    }
  }

  description = "SSH access from admin IP only"
}

# HTTP - Public access for web traffic
resource "oci_core_network_security_group_security_rule" "filmvault_server_http" {
  network_security_group_id = oci_core_network_security_group.filmvault_server_nsg.id
  direction                 = "INGRESS"
  protocol                  = "6" # TCP
  source                    = "0.0.0.0/0"
  source_type               = "CIDR_BLOCK"
  stateless                 = false

  tcp_options {
    destination_port_range {
      min = 80
      max = 80
    }
  }

  description = "HTTP access from anywhere"
}

# HTTPS - Public access for secure web traffic
resource "oci_core_network_security_group_security_rule" "filmvault_server_https" {
  network_security_group_id = oci_core_network_security_group.filmvault_server_nsg.id
  direction                 = "INGRESS"
  protocol                  = "6" # TCP
  source                    = "0.0.0.0/0"
  source_type               = "CIDR_BLOCK"
  stateless                 = false

  tcp_options {
    destination_port_range {
      min = 443
      max = 443
    }
  }

  description = "HTTPS access from anywhere"
}

# Application ports (API and React) - Public access
# Note: In production, these should be behind Nginx reverse proxy
resource "oci_core_network_security_group_security_rule" "filmvault_server_apps" {
  network_security_group_id = oci_core_network_security_group.filmvault_server_nsg.id
  direction                 = "INGRESS"
  protocol                  = "6" # TCP
  source                    = "0.0.0.0/0"
  source_type               = "CIDR_BLOCK"
  stateless                 = false

  tcp_options {
    destination_port_range {
      min = 3000
      max = 3001
    }
  }

  description = "Application ports (API: 3000, React: 3001)"
}

# Allow all outbound traffic
resource "oci_core_network_security_group_security_rule" "filmvault_server_nsg_rule_egress" {
  network_security_group_id = oci_core_network_security_group.filmvault_server_nsg.id
  direction                 = "EGRESS"
  protocol                  = "all"
  destination               = "0.0.0.0/0"
  destination_type          = "CIDR_BLOCK"
  stateless                 = false

  description = "Allow all outbound traffic"
}