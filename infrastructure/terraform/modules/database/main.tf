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

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "mutx"
}

variable "db_user" {
  description = "Database user"
  type        = string
  default     = "mutx"
}

variable "db_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "16"
}

variable "droplet_size" {
  description = "Droplet size for the database (if using droplet-based DB)"
  type        = string
  default     = "db-s-1vcpu-2gb"
}

variable "vpc_uuid" {
  description = "VPC UUID to attach database to"
  type        = string
}

variable "volume_size" {
  description = "Volume size in GB for additional storage"
  type        = number
  default     = 10
}

variable "private_networking" {
  description = "Enable private networking"
  type        = bool
  default     = true
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

resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "digitalocean_database_cluster" "postgres" {
  name       = "${var.project_name}-${var.customer_id}-postgres"
  engine     = "pg"
  version    = var.db_version
  size       = var.droplet_size
  region     = var.region
  node_count = 1

  private_network_uuid = var.vpc_uuid

  backup_window = var.backup_window
  maintenance_window {
    day  = split(":", var.maintenance_window)[0]
    hour = split(":", var.maintenance_window)[1]
  }

  tags = [
    "customer:${var.customer_id}",
    "environment:${var.environment}",
    "type:database",
    "managed-by:terraform",
  ]
}

resource "digitalocean_database_db" "database" {
  name   = var.db_name
  cluster_id = digitalocean_database_cluster.postgres.id
}

resource "digitalocean_database_user" "user" {
  name     = var.db_user
  cluster_id = digitalocean_database_cluster.postgres.id
}

resource "digitalocean_database_firewall" "customer" {
  cluster_id = digitalocean_database_cluster.postgres.id

  rule {
    type  = "ip_addr"
    value = "10.0.0.0/8"
  }

  rule {
    type  = "tag"
    value = "customer:${var.customer_id}"
  }
}

resource "digitalocean_database_connection" "postgres" {
  host     = digitalocean_database_cluster.postgres.private_host
  port     = digitalocean_database_cluster.postgres.port
  database = var.db_name
  user     = var.db_user
  password = random_password.db_password.result
}

output "database_id" {
  description = "Database cluster ID"
  value       = digitalocean_database_cluster.postgres.id
}

output "database_name" {
  description = "Database name"
  value       = var.db_name
}

output "database_user" {
  description = "Database user"
  value       = var.db_user
}

output "database_host" {
  description = "Database private host"
  value       = digitalocean_database_cluster.postgres.private_host
  sensitive   = true
}

output "database_port" {
  description = "Database port"
  value       = digitalocean_database_cluster.postgres.port
}

output "database_password" {
  description = "Database password"
  value       = random_password.db_password.result
  sensitive   = true
}

output "connection_string" {
  description = "PostgreSQL connection string"
  value       = digitalocean_database_connection.postgres.uri
  sensitive   = true
}

output "connection_uri" {
  description = "PostgreSQL connection URI"
  value       = "postgresql://${var.db_user}:${random_password.db_password.result}@${digitalocean_database_cluster.postgres.private_host}:${digitalocean_database_cluster.postgres.port}/${var.db_name}"
  sensitive   = true
}
