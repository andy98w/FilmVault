provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}

# Variables
variable "tenancy_ocid" {
  description = "OCID of the OCI tenancy"
  type        = string
  sensitive   = true
}

variable "user_ocid" {
  description = "OCID of the OCI user"
  type        = string
  sensitive   = true
}

variable "fingerprint" {
  description = "Fingerprint of the OCI API key"
  type        = string
  sensitive   = true
}

variable "private_key_path" {
  description = "Path to the OCI private key"
  type        = string
}

variable "compartment_id" {
  description = "OCID of the compartment where resources will be created"
  type        = string
}

variable "db_admin_username" {
  description = "Username for the MySQL admin user"
  type        = string
  default     = "admin"
}

variable "db_admin_password" {
  description = "Password for the MySQL admin user"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Name of the database to create"
  type        = string
  default     = "myfavmovies"
}

variable "vcn_cidr_block" {
  description = "CIDR block for the VCN"
  type        = string
  default     = "10.0.0.0/16"
}

variable "subnet_cidr_block" {
  description = "CIDR block for the subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "mysql_shape" {
  description = "Shape for the MySQL instance"
  type        = string
  default     = "MySQL.VM.Standard.E2.1"
}

variable "mysql_storage_size_gb" {
  description = "Storage size in GB for the MySQL instance"
  type        = number
  default     = 50
}

variable "region" {
  description = "OCI region"
  type        = string
  default     = "ca-toronto-1"
}

variable "ssh_public_key_path" {
  description = "Path to the SSH public key for instance access"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

# MySQL Database System
resource "oci_mysql_mysql_db_system" "myfavmovies_db" {
  compartment_id = var.compartment_id
  display_name   = "myfavmovies-mysql"
  
  # Shape configuration
  shape_name = var.mysql_shape
  
  # MySQL configuration
  admin_username = var.db_admin_username
  admin_password = var.db_admin_password
  
  # Database configuration
  # MySQL version is determined automatically by OCI if not specified
  # Commenting out to let OCI select the default version
  # mysql_version = "8.0.28"
  data_storage_size_in_gb = var.mysql_storage_size_gb
  
  # Network configuration
  subnet_id = oci_core_subnet.mysql_subnet.id
  
  # Availability domain
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name

  # Maintenance config
  maintenance {
    window_start_time = "SUNDAY 00:00"
  }
  
  # Backup policy
  backup_policy {
    is_enabled        = true
    retention_in_days = 7
    window_start_time = "02:00"
  }
}

# Virtual Cloud Network
resource "oci_core_vcn" "mysql_vcn" {
  compartment_id = var.compartment_id
  display_name   = "mysql-vcn"
  cidr_block     = var.vcn_cidr_block
  dns_label      = "mysqlvcn"
}

# Subnet
resource "oci_core_subnet" "mysql_subnet" {
  compartment_id    = var.compartment_id
  vcn_id            = oci_core_vcn.mysql_vcn.id
  display_name      = "mysql-subnet"
  cidr_block        = var.subnet_cidr_block
  dns_label         = "mysqlsubnet"
  security_list_ids = [oci_core_security_list.mysql_security_list.id]
  route_table_id    = oci_core_route_table.mysql_route_table.id
}

# Internet Gateway
resource "oci_core_internet_gateway" "mysql_internet_gateway" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.mysql_vcn.id
  display_name   = "mysql-internet-gateway"
  enabled        = true
}

# Route Table
resource "oci_core_route_table" "mysql_route_table" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.mysql_vcn.id
  display_name   = "mysql-route-table"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.mysql_internet_gateway.id
  }
}

# Security List
resource "oci_core_security_list" "mysql_security_list" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.mysql_vcn.id
  display_name   = "mysql-security-list"

  # Allow all inbound traffic
  ingress_security_rules {
    protocol    = "all"
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
  }

  # Allow all outbound traffic
  egress_security_rules {
    destination      = "0.0.0.0/0"
    destination_type = "CIDR_BLOCK"
    protocol         = "all"
  }
}

# Get availability domains
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_id
}

# Network Load Balancer
resource "oci_network_load_balancer_network_load_balancer" "mysql_nlb" {
  compartment_id = var.compartment_id
  display_name   = "mysql-nlb"
  subnet_id      = oci_core_subnet.mysql_subnet.id
  
  is_private                     = false
  is_preserve_source_destination = false
}

# Backend Set for MySQL
resource "oci_network_load_balancer_backend_set" "mysql_backend_set" {
  name                     = "mysql-backend-set"
  network_load_balancer_id = oci_network_load_balancer_network_load_balancer.mysql_nlb.id
  policy                   = "FIVE_TUPLE"
  
  health_checker {
    protocol          = "TCP"
    port              = 3306
    interval_in_millis = 10000
    timeout_in_millis  = 3000
    retries            = 3
  }
}

# Backend for MySQL
resource "oci_network_load_balancer_backend" "mysql_backend" {
  backend_set_name         = oci_network_load_balancer_backend_set.mysql_backend_set.name
  network_load_balancer_id = oci_network_load_balancer_network_load_balancer.mysql_nlb.id
  port                     = 3306
  ip_address               = oci_mysql_mysql_db_system.myfavmovies_db.endpoints[0].ip_address
}

# Listener for MySQL
resource "oci_network_load_balancer_listener" "mysql_listener" {
  network_load_balancer_id = oci_network_load_balancer_network_load_balancer.mysql_nlb.id
  name                     = "mysql-listener"
  default_backend_set_name = oci_network_load_balancer_backend_set.mysql_backend_set.name
  port                     = 3306
  protocol                 = "TCP"
}

# Output the MySQL endpoint for connection
output "mysql_endpoint" {
  value = "${oci_mysql_mysql_db_system.myfavmovies_db.endpoints[0].hostname}:${oci_mysql_mysql_db_system.myfavmovies_db.endpoints[0].port}"
}

# Output the NLB public IP for connection
output "mysql_nlb_public_ip" {
  value = oci_network_load_balancer_network_load_balancer.mysql_nlb.ip_addresses[0].ip_address
}

# Output connection information
output "mysql_connection_info" {
  value = {
    hostname = oci_mysql_mysql_db_system.myfavmovies_db.endpoints[0].hostname
    nlb_ip   = oci_network_load_balancer_network_load_balancer.mysql_nlb.ip_addresses[0].ip_address
    port     = 3306
    username = "admin" # This is the admin username you set
    database = "myfavmovies" # You'll need to create this database after MySQL is deployed
  }
}