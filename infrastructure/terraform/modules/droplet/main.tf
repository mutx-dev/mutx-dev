terraform {
  required_version = ">= 1.0"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

variable "customer_id" {
  description = "Customer identifier"
  type        = string
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
}

variable "droplet_size" {
  description = "Droplet size (bare-metal slug)"
  type        = string
}

variable "droplet_image" {
  description = "Droplet image ID or slug"
  type        = string
}

variable "vpc_uuid" {
  description = "VPC UUID to attach droplet to"
  type        = string
}

variable "ssh_key" {
  description = "SSH public key for the customer"
  type        = string
  sensitive   = true
}

variable "admin_ssh_key_id" {
  description = "DigitalOcean SSH key ID for admin access"
  type        = string
  default     = ""
}

variable "environment" {
  description = "Environment (dev, staging, production)"
  type        = string
}

variable "agent_port" {
  description = "Port for agent communication"
  type        = number
}

variable "agent_version" {
  description = "Agent version to install"
  type        = string
}

variable "telemetry_enabled" {
  description = "Enable telemetry for the agent"
  type        = bool
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "admin_cidr" {
  description = "CIDR block for admin SSH access"
  type        = string
}

variable "data_volume_size" {
  description = "Data volume size in GB"
  type        = number
}

variable "vpc_ip_range" {
  description = "VPC IP range for firewall rules"
  type        = string
}

resource "digitalocean_ssh_key" "customer" {
  name       = "${var.project_name}-${var.customer_id}-key"
  public_key = var.ssh_key
}

resource "digitalocean_droplet" "customer" {
  name      = "${var.project_name}-${var.customer_id}-agent"
  region    = var.region
  size      = var.droplet_size
  image     = var.droplet_image
  vpc_uuid  = var.vpc_uuid

  ssh_keys = compact([
    digitalocean_ssh_key.customer.fingerprint,
    var.admin_ssh_key_id != "" ? var.admin_ssh_key_id : null,
  ])

  tags = [
    "customer:${var.customer_id}",
    "environment:${var.environment}",
    "type:agent",
    "managed-by:terraform",
  ]

  user_data = templatefile("${path.module}/../../templates/cloud-init.yaml.tpl", {
    customer_id       = var.customer_id
    agent_port        = var.agent_port
    agent_version     = var.agent_version
    telemetry_enabled = var.telemetry_enabled
    ssh_public_key    = var.ssh_key
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "digitalocean_volume" "customer" {
  name       = "${var.project_name}-${var.customer_id}-data"
  region     = var.region
  size       = var.data_volume_size
  description = "Data volume for customer ${var.customer_id}"

  tags = [
    "customer:${var.customer_id}",
  ]
}

resource "digitalocean_volume_attachment" "customer" {
  droplet_id = digitalocean_droplet.customer.id
  volume_id  = digitalocean_volume.customer.id
}

resource "digitalocean_firewall" "customer" {
  name   = "${var.project_name}-${var.customer_id}-fw"
  droplet_ids = [digitalocean_droplet.customer.id]

  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = [var.admin_cidr]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "80-443"
    source_addresses = ["0.0.0.0/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "${var.agent_port}"
    source_addresses = [var.vpc_ip_range]
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "443"
    destination_addresses  = ["0.0.0.0/0"]
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "53"
    destination_addresses = ["0.0.0.0/0"]
  }
}

output "droplet_id" {
  description = "Droplet ID"
  value       = digitalocean_droplet.customer.id
}

output "droplet_ip" {
  description = "Private IP address"
  value       = digitalocean_droplet.customer.ipv4_address_private
}

output "droplet_public_ip" {
  description = "Public IP address"
  value       = digitalocean_droplet.customer.ipv4_address
  sensitive   = true
}

output "volume_id" {
  description = "Data volume ID"
  value       = digitalocean_volume.customer.id
}

output "firewall_id" {
  description = "Firewall ID"
  value       = digitalocean_firewall.customer.id
}

output "ssh_key_fingerprint" {
  description = "SSH key fingerprint"
  value       = digitalocean_ssh_key.customer.fingerprint
}
