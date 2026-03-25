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

variable "domain_name" {
  description = "Domain name (e.g., example.com)"
  type        = string
}

variable "ttl" {
  description = "Default TTL for DNS records"
  type        = number
  default     = 3600
}

variable "a_records" {
  description = "List of A records"
  type = list(object({
    name  = string
    value = string
    ttl   = number
  }))
  default = []
}

variable "aaaa_records" {
  description = "List of AAAA records"
  type = list(object({
    name  = string
    value = string
    ttl   = number
  }))
  default = []
}

variable "cname_records" {
  description = "List of CNAME records"
  type = list(object({
    name  = string
    value = string
    ttl   = number
  }))
  default = []
}

variable "mx_records" {
  description = "List of MX records"
  type = list(object({
    name     = string
    value    = string
    priority = number
    ttl      = number
  }))
  default = []
}

variable "txt_records" {
  description = "List of TXT records"
  type = list(object({
    name  = string
    value = string
    ttl   = number
  }))
  default = []
}

variable "ns_records" {
  description = "List of NS records (for subdomain delegation)"
  type = list(object({
    name  = string
    value = string
    ttl   = number
  }))
  default = []
}

variable "droplet_id" {
  description = "Droplet ID to create records for"
  type        = string
  default     = ""
}

variable "loadbalancer_id" {
  description = "Load balancer ID to create records for"
  type        = string
  default     = ""
}

resource "digitalocean_domain" "main" {
  name = var.domain_name

  tags = [
    "customer:${var.customer_id}",
    "environment:${var.environment}",
    "type:dns",
    "managed-by:terraform",
  ]
}

resource "digitalocean_record" "a" {
  for_each = { for idx, record in var.a_records : "${record.name}-${idx}" => record }

  domain = digitalocean_domain.main.name
  type   = "A"
  name   = each.value.name
  value  = each.value.value
  ttl    = each.value.ttl
}

resource "digitalocean_record" "aaaa" {
  for_each = { for idx, record in var.aaaa_records : "${record.name}-${idx}" => record }

  domain = digitalocean_domain.main.name
  type   = "AAAA"
  name   = each.value.name
  value  = each.value.value
  ttl    = each.value.ttl
}

resource "digitalocean_record" "cname" {
  for_each = { for idx, record in var.cname_records : "${record.name}-${idx}" => record }

  domain = digitalocean_domain.main.name
  type   = "CNAME"
  name   = each.value.name
  value  = each.value.value
  ttl    = each.value.ttl
}

resource "digitalocean_record" "mx" {
  for_each = { for idx, record in var.mx_records : "${record.name}-${idx}" => record }

  domain   = digitalocean_domain.main.name
  type     = "MX"
  name     = each.value.name
  value    = each.value.value
  priority = each.value.priority
  ttl      = each.value.ttl
}

resource "digitalocean_record" "txt" {
  for_each = { for idx, record in var.txt_records : "${record.name}-${idx}" => record }

  domain = digitalocean_domain.main.name
  type   = "TXT"
  name   = each.value.name
  value  = each.value.value
  ttl    = each.value.ttl
}

resource "digitalocean_record" "ns" {
  for_each = { for idx, record in var.ns_records : "${record.name}-${idx}" => record }

  domain = digitalocean_domain.main.name
  type   = "NS"
  name   = each.value.name
  value  = each.value.value
  ttl    = each.value.ttl
}

# Point @ to droplet if specified
resource "digitalocean_record" "droplet" {
  count  = var.droplet_id != "" ? 1 : 0
  domain = digitalocean_domain.main.name
  type   = "A"
  name   = "@"
  value  = var.droplet_id
  ttl    = var.ttl
}

# Point @ to loadbalancer if specified
resource "digitalocean_record" "loadbalancer" {
  count  = var.loadbalancer_id != "" ? 1 : 0
  domain = digitalocean_domain.main.name
  type   = "A"
  name   = "@"
  value  = var.loadbalancer_id
  ttl    = var.ttl
}

output "domain_id" {
  description = "Domain ID"
  value       = digitalocean_domain.main.id
}

output "domain_name" {
  description = "Domain name"
  value       = digitalocean_domain.main.name
}

output "nameservers" {
  description = "Nameservers for the domain"
  value       = digitalocean_domain.main.nameservers
}
