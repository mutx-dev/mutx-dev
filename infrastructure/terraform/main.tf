terraform {
  required_version = ">= 1.5.0"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }

  # Backend config is environment-scoped via -backend-config files
  # (see terraform/environments/*/backend.hcl)
  backend "s3" {}
}

provider "digitalocean" {
  token = var.do_token
}

module "networking" {
  source = "./modules/networking"

  for_each = { for customer in var.customers : customer.id => customer }

  customer_id  = each.value.id
  project_name = var.project_name
  region       = var.region
  vpc_cidr     = each.value.vpc_cidr
  environment  = var.environment
}

module "droplet" {
  source = "./modules/droplet"

  for_each = { for customer in var.customers : customer.id => customer }

  customer_id       = each.value.id
  region            = var.region
  droplet_size      = var.droplet_size
  droplet_image     = var.droplet_image
  vpc_uuid          = module.networking[each.value.id].vpc_id
  ssh_key           = each.value.ssh_key
  admin_ssh_key_id  = var.admin_ssh_key_id
  environment       = var.environment
  agent_port        = var.agent_port
  agent_version     = var.agent_version
  telemetry_enabled = var.telemetry_enabled
  project_name      = var.project_name
  admin_cidr        = var.admin_cidr
  data_volume_size  = var.data_volume_size
  vpc_ip_range      = module.networking[each.value.id].vpc_cidr
}

module "vault" {
  source = "./modules/vault"

  customer_id = length(var.customers) > 0 ? var.customers[0].id : ""
}

output "vpc_ids" {
  description = "VPC IDs for each customer"
  value       = { for key, mod in module.networking : key => mod.vpc_id }
}

output "vpc_cidrs" {
  description = "VPC CIDR ranges for each customer"
  value       = { for key, mod in module.networking : key => mod.vpc_cidr }
}

output "droplet_ids" {
  description = "Droplet IDs for each customer"
  value       = { for key, mod in module.droplet : key => mod.droplet_id }
}

output "droplet_ips" {
  description = "Private IP addresses for each customer droplet"
  value       = { for key, mod in module.droplet : key => mod.droplet_ip }
}

output "droplet_public_ips" {
  description = "Public IP addresses for each customer droplet"
  value       = { for key, mod in module.droplet : key => mod.droplet_public_ip }
  sensitive   = true
}

output "connection_info" {
  description = "Connection information for each customer"
  value = {
    for key, mod in module.droplet : key => {
      host       = mod.droplet_public_ip
      private_ip = mod.droplet_ip
      port       = 22
      user       = "root"
    }
  }
  sensitive = true
}

output "volume_ids" {
  description = "Volume IDs for each customer"
  value       = { for key, mod in module.droplet : key => mod.volume_id }
}

output "firewall_ids" {
  description = "Firewall IDs for each customer"
  value       = { for key, mod in module.droplet : key => mod.firewall_id }
}

output "project_ids" {
  description = "Project IDs for each customer"
  value       = { for key, mod in module.networking : key => mod.project_id }
}
