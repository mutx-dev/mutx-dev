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

variable "redis_version" {
  description = "Redis version"
  type        = string
  default     = "7"
}

variable "droplet_size" {
  description = "Droplet size for the database"
  type        = string
  default     = "db-s-1vcpu-1gb"
}

variable "vpc_uuid" {
  description = "VPC UUID to attach Redis to"
  type        = string
}

variable "num_nodes" {
  description = "Number of Redis nodes"
  type        = number
  default     = 1
}

variable "backup_window" {
  description = "Backup window (e.g., '01:00-02:00')"
  type        = string
  default     = "01:00-02:00"
}

variable "maintenance_window" {
  description = "Day and time of week for maintenance (e.g., 'MON:03:00')"
  type        = string
  default     = "MON:03:00"
}

variable "eviction_policy" {
  description = "Eviction policy (noeviction, allkeys-lru, etc.)"
  type        = string
  default     = "noeviction"
}

resource "digitalocean_database_cluster" "redis" {
  name       = "${var.project_name}-${var.customer_id}-redis"
  engine     = "redis"
  version    = var.redis_version
  size       = var.droplet_size
  region     = var.region
  node_count = var.num_nodes

  private_network_uuid = var.vpc_uuid

  backup_window = var.backup_window
  maintenance_window {
    day  = split(":", var.maintenance_window)[0]
    hour = split(":", var.maintenance_window)[1]
  }

  redis {
    eviction_policy = var.eviction_policy
  }

  tags = [
    "customer:${var.customer_id}",
    "environment:${var.environment}",
    "type:redis",
    "managed-by:terraform",
  ]
}

resource "digitalocean_database_firewall" "redis" {
  cluster_id = digitalocean_database_cluster.redis.id

  rule {
    type  = "ip_addr"
    value = "10.0.0.0/8"
  }

  rule {
    type  = "tag"
    value = "customer:${var.customer_id}"
  }
}

resource "digitalocean_database_connection" "redis" {
  host     = digitalocean_database_cluster.redis.private_host
  port     = digitalocean_database_cluster.redis.port
  password = ""
}

output "redis_id" {
  description = "Redis cluster ID"
  value       = digitalocean_database_cluster.redis.id
}

output "redis_host" {
  description = "Redis private host"
  value       = digitalocean_database_cluster.redis.private_host
  sensitive   = true
}

output "redis_port" {
  description = "Redis port"
  value       = digitalocean_database_cluster.redis.port
}

output "redis_connection_string" {
  description = "Redis connection string"
  value       = digitalocean_database_connection.redis.uri
  sensitive   = true
}
