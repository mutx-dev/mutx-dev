terraform {
  required_version = ">= 1.0"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "customer_id" {
  description = "Customer identifier"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, production)"
  type        = string
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc3"
}

variable "bucket_name" {
  description = "Name of the Spaces bucket"
  type        = string
  default     = ""
}

variable "acl" {
  description = "ACL for the bucket (private, public-read)"
  type        = string
  default     = "private"
}

variable "cors_enabled" {
  description = "Enable CORS for the bucket"
  type        = bool
  default     = false
}

variable "cors_origins" {
  description = "List of allowed CORS origins"
  type        = list(string)
  default     = []
}

variable "lifecycle_policy" {
  description = "Lifecycle policy rules (map of prefix to days)"
  type        = map(number)
  default     = {}
}

locals {
  bucket_name_prefix = var.bucket_name != "" ? var.bucket_name : "${var.project_name}-${var.customer_id}"
}

resource "digitalocean_spaces_bucket" "main" {
  count  = 1
  name   = local.bucket_name_prefix
  region = var.region
  acl    = var.acl

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = var.cors_enabled ? var.cors_origins : []
    max_age_seconds = 3000
  }

  lifecycle_rule {
    enabled = true

    dynamic "rule" {
      for_each = var.lifecycle_policy
      content {
        id         = "rule-${rule.key}"
        prefix     = rule.key
        expiration = rule.value
      }
    }
  }

  tags = [
    "customer:${var.customer_id}",
    "environment:${var.environment}",
    "type:storage",
    "managed-by:terraform",
  ]
}

output "bucket_name" {
  description = "Spaces bucket name"
  value       = digitalocean_spaces_bucket.main[0].name
}

output "bucket_endpoint" {
  description = "Spaces bucket endpoint URL"
  value       = digitalocean_spaces_bucket.main[0].endpoint
}

output "bucket_bucket_domain_name" {
  description = "Spaces bucket domain name"
  value       = digitalocean_spaces_bucket.main[0].bucket_domain_name
}

output "bucket_region" {
  description = "Spaces bucket region"
  value       = digitalocean_spaces_bucket.main[0].region
}
