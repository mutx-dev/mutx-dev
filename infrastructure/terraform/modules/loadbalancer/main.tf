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
}

variable "vpc_uuid" {
  description = "VPC UUID to attach load balancer to"
  type        = string
}

variable "droplet_ids" {
  description = "List of droplet IDs to forward traffic to"
  type        = list(string)
  default     = []
}

variable "algorithm" {
  description = "Load balancing algorithm (round_robin, least_connections)"
  type        = string
  default     = "round_robin"
}

variable "healthcheck_interval" {
  description = "Seconds between health checks"
  type        = number
  default     = 10
}

variable "healthcheck_timeout" {
  description = "Seconds to wait for a response"
  type        = number
  default     = 5
}

variable "healthcheck_unhealthy_threshold" {
  description = "Unhealthy threshold before removing from pool"
  type        = number
  default     = 3
}

variable "healthcheck_healthy_threshold" {
  description = "Healthy threshold before adding to pool"
  type        = number
  default     = 2
}

variable "http_port" {
  description = "HTTP port to listen on"
  type        = number
  default     = 80
}

variable "https_port" {
  description = "HTTPS port to listen on"
  type        = number
  default     = 443
}

variable "agent_port" {
  description = "Agent port for internal traffic"
  type        = number
  default     = 8080
}

variable "expose_agent_port_public" {
  description = "Whether to expose the agent TCP port on the public load balancer"
  type        = bool
  default     = false
}

variable "enable_proxy_protocol" {
  description = "Enable PROXY protocol for preserving client IP"
  type        = bool
  default     = false
}

variable "enable_ssl_redirect" {
  description = "Redirect HTTP to HTTPS"
  type        = bool
  default     = true
}

variable "certificate_id" {
  description = "SSL certificate ID (if using DigitalOcean managed cert)"
  type        = string
  default     = ""
}

variable "redirect_http_to_https" {
  description = "Redirect all HTTP traffic to HTTPS"
  type        = bool
  default     = true
}

resource "digitalocean_loadbalancer" "public" {
  name     = "${var.project_name}-${var.customer_id}-lb"
  region   = var.region
  vpc_uuid = var.vpc_uuid

  algorithm = var.algorithm

  healthcheck {
    protocol            = "http"
    port                = var.http_port
    path                = "/health"
    interval            = var.healthcheck_interval
    timeout             = var.healthcheck_timeout
    unhealthy_threshold = var.healthcheck_unhealthy_threshold
    healthy_threshold   = var.healthcheck_healthy_threshold
  }

  forwarding_rule {
    entry_port     = var.http_port
    entry_protocol = "http"

    target_port            = var.http_port
    target_protocol        = "http"
    redirect_http_to_https = var.redirect_http_to_https
  }

  forwarding_rule {
    entry_port     = var.https_port
    entry_protocol = "https"

    target_port     = var.https_port
    target_protocol = "https"

    certificate_id = var.certificate_id != "" ? var.certificate_id : null
  }

  dynamic "forwarding_rule" {
    for_each = var.expose_agent_port_public ? [1] : []
    content {
      # Agent port forwarding (opt-in)
      entry_port       = var.agent_port
      entry_protocol   = "tcp"
      target_port       = var.agent_port
      target_protocol   = "tcp"
    }
  }

  droplet_ids = var.droplet_ids

  enable_proxy_protocol = var.enable_proxy_protocol

  tags = [
    "customer:${var.customer_id}",
    "environment:${var.environment}",
    "type:loadbalancer",
    "managed-by:terraform",
  ]
}

resource "digitalocean_loadbalancer" "internal" {
  count    = var.enable_proxy_protocol ? 1 : 0
  name     = "${var.project_name}-${var.customer_id}-lb-internal"
  region   = var.region
  vpc_uuid = var.vpc_uuid

  algorithm = var.algorithm

  # Internal load balancers use TCP healthcheck
  healthcheck {
    protocol            = "tcp"
    port                = var.agent_port
    interval            = var.healthcheck_interval
    timeout             = var.healthcheck_timeout
    unhealthy_threshold = var.healthcheck_unhealthy_threshold
    healthy_threshold   = var.healthcheck_healthy_threshold
  }

  forwarding_rule {
    entry_port     = var.agent_port
    entry_protocol = "tcp"

    target_port     = var.agent_port
    target_protocol = "tcp"
  }

  droplet_ids = var.droplet_ids

  enable_proxy_protocol = true

  # Tag as internal
  tags = [
    "customer:${var.customer_id}",
    "environment:${var.environment}",
    "type:loadbalancer",
    "type:internal",
    "managed-by:terraform",
  ]
}

output "loadbalancer_id" {
  description = "Load balancer ID"
  value       = digitalocean_loadbalancer.public.id
}

output "loadbalancer_ip" {
  description = "Load balancer public IP"
  value       = digitalocean_loadbalancer.public.ip
}

output "loadbalancer_internal_ip" {
  description = "Load balancer internal IP (if created)"
  value       = var.enable_proxy_protocol ? digitalocean_loadbalancer.internal[0].ip : null
}

output "loadbalancer_hostname" {
  description = "Load balancer hostname"
  value       = digitalocean_loadbalancer.public.hostname
}
