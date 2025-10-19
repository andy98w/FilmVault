# OCI Logging and Monitoring Configuration
# SIMPLIFIED for portfolio/demo app - basic monitoring only

/*
# Full logging disabled to reduce costs for demo app
# Uncomment if needed for production

# Log Group for centralized logging
resource "oci_logging_log_group" "filmvault_log_group" {
  compartment_id = var.compartment_id
  display_name   = "filmvault-log-group"
  description    = "Log group for FilmVault application"
}

# VCN Flow Logs - track network traffic
resource "oci_logging_log" "vcn_flow_logs" {
  display_name = "filmvault-vcn-flow-logs"
  log_group_id = oci_logging_log_group.filmvault_log_group.id
  log_type     = "SERVICE"

  configuration {
    source {
      category    = "all"
      resource    = oci_core_vcn.mysql_vcn.id
      service     = "flowlogs"
      source_type = "OCISERVICE"
    }

    compartment_id = var.compartment_id
  }

  is_enabled         = true
  retention_duration = 30
}

# Application Server Custom Logs
resource "oci_logging_log" "application_logs" {
  display_name = "filmvault-application-logs"
  log_group_id = oci_logging_log_group.filmvault_log_group.id
  log_type     = "CUSTOM"

  configuration {
    source {
      category    = "application"
      resource    = oci_core_instance.filmvault_server.id
      service     = "objectstorage"
      source_type = "OCISERVICE"
    }

    compartment_id = var.compartment_id
  }

  is_enabled         = true
  retention_duration = 30
}

# Audit Logs - track who did what in OCI
resource "oci_logging_log" "audit_logs" {
  display_name = "filmvault-audit-logs"
  log_group_id = oci_logging_log_group.filmvault_log_group.id
  log_type     = "SERVICE"

  configuration {
    source {
      category    = "all"
      resource    = var.compartment_id
      service     = "audit"
      source_type = "OCISERVICE"
    }

    compartment_id = var.compartment_id
  }

  is_enabled         = true
  retention_duration = 90 # Keep audit logs longer
}

# Notification Topic for Alerts
resource "oci_ons_notification_topic" "filmvault_alerts" {
  compartment_id = var.compartment_id
  name           = "filmvault-alerts"
  description    = "Notification topic for FilmVault security and performance alerts"
}

# Alarm for high CPU usage on application server
resource "oci_monitoring_alarm" "high_cpu_alarm" {
  compartment_id        = var.compartment_id
  display_name          = "filmvault-high-cpu"
  destinations          = [oci_ons_notification_topic.filmvault_alerts.id]
  is_enabled            = true
  metric_compartment_id = var.compartment_id
  namespace             = "oci_computeagent"
  query                 = "CpuUtilization[1m].mean() > 80"
  severity              = "WARNING"

  body = "High CPU usage detected on FilmVault server"

  repeat_notification_duration = "PT2H"
}

# Alarm for MySQL high connections
resource "oci_monitoring_alarm" "mysql_high_connections" {
  compartment_id        = var.compartment_id
  display_name          = "filmvault-mysql-high-connections"
  destinations          = [oci_ons_notification_topic.filmvault_alerts.id]
  is_enabled            = true
  metric_compartment_id = var.compartment_id
  namespace             = "oci_mysql_database"
  query                 = "ActiveConnections[1m].mean() > 50"
  severity              = "WARNING"

  body = "High number of MySQL connections detected"

  repeat_notification_duration = "PT2H"
}

# Alarm for disk space
resource "oci_monitoring_alarm" "disk_space_alarm" {
  compartment_id        = var.compartment_id
  display_name          = "filmvault-low-disk-space"
  destinations          = [oci_ons_notification_topic.filmvault_alerts.id]
  is_enabled            = true
  metric_compartment_id = var.compartment_id
  namespace             = "oci_computeagent"
  query                 = "DiskUtilization[1m].mean() > 85"
  severity              = "CRITICAL"

  body = "Low disk space on FilmVault server"

  repeat_notification_duration = "PT1H"
}

# Output logging information
output "logging_info" {
  value = {
    log_group_id      = oci_logging_log_group.filmvault_log_group.id
    vcn_flow_logs_id  = oci_logging_log.vcn_flow_logs.id
    app_logs_id       = oci_logging_log.application_logs.id
    audit_logs_id     = oci_logging_log.audit_logs.id
    alert_topic_id    = oci_ons_notification_topic.filmvault_alerts.id
  }
  description = "Logging and monitoring resource IDs"
}
*/

# Minimal monitoring for demo - just basic OCI metrics (included free)
output "logging_info" {
  value = {
    status = "Basic OCI metrics enabled (free)"
    note   = "Full logging disabled for cost savings"
    access = "View metrics in OCI Console → Monitoring"
  }
  description = "Monitoring status"
}
