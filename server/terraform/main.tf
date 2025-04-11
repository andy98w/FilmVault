provider "oci" {
  tenancy_ocid     = "ocid1.tenancy.oc1..aaaaaaaaywmo3jk7mqebx7aahzj4wyntuoqldc7txwr3bhosj6ta6isgtlca"
  user_ocid        = "ocid1.user.oc1..aaaaaaaa5zii5jopnr66gd5i3reki4banjn66ery4uanf6eujxqzj64o4peq"
  fingerprint      = "51:97:01:df:99:0f:e8:36:57:ab:ab:9b:cb:8f:30:78"
  private_key_path = "/Users/andywu/Documents/andywu47.pem"
  region           = var.region
}

# Variables
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
  default     = "MySQL.VM.Standard.E3.1.8GB"
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

  # Allow MySQL traffic
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    
    tcp_options {
      min = 3306
      max = 3306
    }
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

# Output the MySQL endpoint for connection
output "mysql_endpoint" {
  value = "${oci_mysql_mysql_db_system.myfavmovies_db.endpoints[0].hostname}:${oci_mysql_mysql_db_system.myfavmovies_db.endpoints[0].port}"
}

# Output connection information
output "mysql_connection_info" {
  value = {
    hostname = oci_mysql_mysql_db_system.myfavmovies_db.endpoints[0].hostname
    port     = oci_mysql_mysql_db_system.myfavmovies_db.endpoints[0].port
    username = "admin" # This is the admin username you set
    database = "myfavmovies" # You'll need to create this database after MySQL is deployed
  }
}