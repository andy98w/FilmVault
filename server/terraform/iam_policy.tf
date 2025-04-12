# IAM policy to allow the compute instance to access object storage
resource "oci_identity_policy" "instance_object_storage_policy" {
  name           = "filmvault-instance-object-storage-policy"
  description    = "Policy to allow compute instances to access object storage for profile pictures"
  compartment_id = var.compartment_id
  
  statements = [
    # Allow instances in the compartment to read, write, and manage objects in the bucket
    "Allow dynamic-group ${oci_identity_dynamic_group.compute_dynamic_group.name} to manage objects in compartment id ${var.compartment_id} where target.bucket.name='${oci_objectstorage_bucket.profile_pictures_bucket.name}'",
    # Allow instances to read bucket information
    "Allow dynamic-group ${oci_identity_dynamic_group.compute_dynamic_group.name} to inspect buckets in compartment id ${var.compartment_id}",
  ]
}

# Create a dynamic group for compute instances in the compartment
resource "oci_identity_dynamic_group" "compute_dynamic_group" {
  name           = "filmvault-compute-dynamic-group"
  description    = "Dynamic group for FilmVault compute instances"
  compartment_id = var.tenancy_ocid # Dynamic groups must be in the root compartment
  
  matching_rule = "Any {instance.compartment.id = '${var.compartment_id}'}"
}

# Add a variable for tenancy OCID
variable "tenancy_ocid" {
  description = "OCID of the tenancy"
  type        = string
  default     = "ocid1.tenancy.oc1..aaaaaaaaywmo3jk7mqebx7aahzj4wyntuoqldc7txwr3bhosj6ta6isgtlca" # Using the value from your main.tf
}