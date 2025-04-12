# Network Security Group for the FilmVault Server
resource "oci_core_network_security_group" "filmvault_server_nsg" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.mysql_vcn.id
  display_name   = "filmvault-server-nsg"
}

# Allow all ingress traffic
resource "oci_core_network_security_group_security_rule" "filmvault_server_nsg_rule_all_ingress" {
  network_security_group_id = oci_core_network_security_group.filmvault_server_nsg.id
  direction                 = "INGRESS"
  protocol                  = "all"
  source                    = "0.0.0.0/0"
  source_type               = "CIDR_BLOCK"
  stateless                 = false
}

# Allow all outbound traffic
resource "oci_core_network_security_group_security_rule" "filmvault_server_nsg_rule_egress" {
  network_security_group_id = oci_core_network_security_group.filmvault_server_nsg.id
  direction                 = "EGRESS"
  protocol                  = "all"
  destination               = "0.0.0.0/0"
  destination_type          = "CIDR_BLOCK"
  stateless                 = false
}