# Vault Module - Secrets Management Stub
# This module provides a placeholder for HashiCorp Vault integration
# Currently using DO Spaces S3 backend for state storage
#
# TODO: Implement Vault integration for:
# - API token management
# - SSH key storage
# - TLS certificates
# - Database credentials
# - Customer secrets

terraform {
  required_version = ">= 1.0"
}

# Placeholder variables for future Vault integration
variable "vault_addr" {
  description = "Vault server address"
  type        = string
  default     = ""
}

variable "vault_token" {
  description = "Vault token for authentication"
  type        = string
  default     = ""
  sensitive   = true
}

variable "customer_id" {
  description = "Customer identifier"
  type        = string
  default     = ""
}

# Placeholder for secrets retrieval
# Currently returning empty - will integrate with Vault KV engine
output "secrets" {
  description = "Placeholder for customer secrets"
  value       = {}
  sensitive   = true
}

output "vault_configured" {
  description = "Whether Vault is configured"
  value       = var.vault_addr != ""
}
