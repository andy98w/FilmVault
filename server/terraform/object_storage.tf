# Object Storage Bucket for profile pictures
resource "oci_objectstorage_bucket" "profile_pictures_bucket" {
  compartment_id = var.compartment_id
  name           = "filmvault-profile-pictures"
  namespace      = data.oci_objectstorage_namespace.user_namespace.namespace
  
  access_type    = "ObjectRead" # Public read access for profile pictures
  
  # Optional: Enable versioning if needed
  versioning     = "Enabled"
  
  # Optional: Object lifecycle policy if needed
  # For example, to automatically delete objects after X days
}

# Get the ObjectStorage namespace
data "oci_objectstorage_namespace" "user_namespace" {
  compartment_id = var.compartment_id
}

# Create a pre-authenticated request for the bucket (optional)
# This allows controlled access without requiring API keys
resource "oci_objectstorage_preauthrequest" "upload_preauth" {
  access_type     = "AnyObjectWrite" # Allow writing any object
  bucket          = oci_objectstorage_bucket.profile_pictures_bucket.name
  name            = "profile-upload-preauth"
  namespace       = data.oci_objectstorage_namespace.user_namespace.namespace
  time_expires    = timeadd(timestamp(), "8760h") # Valid for 1 year
}

# Define local variables for bucket details to be used in outputs
locals {
  bucket_details = {
    name      = oci_objectstorage_bucket.profile_pictures_bucket.name
    namespace = data.oci_objectstorage_namespace.user_namespace.namespace
  }
}

# Output bucket information
output "profile_pictures_bucket" {
  value = {
    name      = oci_objectstorage_bucket.profile_pictures_bucket.name
    namespace = data.oci_objectstorage_namespace.user_namespace.namespace
    url       = "https://objectstorage.${var.region}.oraclecloud.com/n/${data.oci_objectstorage_namespace.user_namespace.namespace}/b/${oci_objectstorage_bucket.profile_pictures_bucket.name}/o/"
  }
}

# Output pre-authenticated request URL (for uploading without requiring OCI credentials)
output "upload_preauth_url" {
  value = "https://objectstorage.${var.region}.oraclecloud.com${oci_objectstorage_preauthrequest.upload_preauth.access_uri}"
  sensitive = true # Mark as sensitive to avoid exposing in logs
}