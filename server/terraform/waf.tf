# Web Application Firewall (WAF) Configuration
# Note: OCI WAF requires a load balancer. For now, WAF-like protection is implemented in Nginx
# This file documents the WAF strategy and can be extended with a load balancer later

# WAF Protection is currently implemented at the Nginx level in cloud-init-secure.tpl:
# - SQL injection pattern blocking
# - XSS pattern blocking
# - Path traversal blocking
# - Rate limiting (global and per-endpoint)
# - Security headers injection

# To add full OCI WAF:
# 1. Create an OCI Load Balancer
# 2. Create WAF policy (example below, commented out)
# 3. Attach WAF to load balancer
# 4. Point load balancer to application server

/*
# Uncomment this when you add a load balancer:

resource "oci_waf_web_app_firewall_policy" "filmvault_waf_policy" {
  compartment_id = var.compartment_id
  display_name   = "filmvault-waf-policy"

  actions {
    name = "allow"
    type = "ALLOW"
  }

  actions {
    name = "block"
    type = "RETURN_HTTP_RESPONSE"

    code = 403
    body {
      text = "Blocked by security policy"
      type = "STATIC_TEXT"
    }
  }

  request_access_control {
    default_action_name = "allow"
  }
}

resource "oci_waf_web_app_firewall" "filmvault_waf" {
  compartment_id                = var.compartment_id
  backend_type                  = "LOAD_BALANCER"
  load_balancer_id              = oci_load_balancer_load_balancer.filmvault_lb.id
  web_app_firewall_policy_id    = oci_waf_web_app_firewall_policy.filmvault_waf_policy.id
  display_name                  = "filmvault-waf"
}
*/

# Output information
output "waf_info" {
  value = {
    status = "WAF protection implemented in Nginx (server-level)"
    nginx_protections = [
      "SQL injection blocking",
      "XSS blocking",
      "Path traversal blocking",
      "Rate limiting (1000/min global, 300/min API, 5/min login)",
      "Security headers (X-Frame-Options, CSP, etc.)"
    ]
    upgrade_path = "To add OCI WAF: Create load balancer and uncomment waf.tf"
  }
  description = "WAF protection status"
}
