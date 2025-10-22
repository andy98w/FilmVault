terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

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

# Password is now auto-generated in vault.tf - no manual input needed

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

variable "admin_ip_cidr" {
  description = "CIDR block for admin SSH access (your public IP)"
  type        = string
  default     = "160.34.113.43/32"
}

variable "domain_name" {
  description = "Domain name for SSL certificate (optional, for Let's Encrypt)"
  type        = string
  default     = ""
}

variable "email_for_ssl" {
  description = "Email address for Let's Encrypt SSL certificate notifications"
  type        = string
  default     = ""
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

resource "oci_core_security_list" "mysql_security_list" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.mysql_vcn.id
  display_name   = "app-security-list"

  # HTTP from anywhere
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    stateless   = false

    tcp_options {
      min = 80
      max = 80
    }

    description = "HTTP access from anywhere"
  }

  # HTTPS from anywhere
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    stateless   = false

    tcp_options {
      min = 443
      max = 443
    }

    description = "HTTPS access from anywhere"
  }

  # SSH from admin IP
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = var.admin_ip_cidr
    source_type = "CIDR_BLOCK"
    stateless   = false

    tcp_options {
      min = 22
      max = 22
    }

    description = "SSH access from admin IP"
  }

  egress_security_rules {
    destination      = "0.0.0.0/0"
    destination_type = "CIDR_BLOCK"
    protocol         = "all"
  }
}

data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_id
}

output "mysql_connection_info" {
  value = {
    host     = "localhost"
    port     = 3306
    username = var.db_admin_username
    database = var.db_name
    note     = "MySQL runs locally on the compute instance - connects via localhost"
  }
  description = "MySQL connection details (self-hosted on compute instance)"
}