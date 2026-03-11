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

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, production)"
  type        = string
}

resource "digitalocean_vpc" "customer" {
  name           = "${var.project_name}-${var.customer_id}-vpc"
  region         = var.region
  ip_range       = var.vpc_cidr
  description    = "VPC for customer ${var.customer_id}"
}

resource "digitalocean_project" "customer" {
  name         = "${var.project_name}-${var.customer_id}"
  description  = "Project for customer ${var.customer_id}"
  purpose      = "Hosting and infrastructure"
  environment  = var.environment

  resources = [
    digitalocean_vpc.customer.urn,
  ]
}

output "vpc_id" {
  description = "VPC ID"
  value       = digitalocean_vpc.customer.id
}

output "vpc_cidr" {
  description = "VPC CIDR range"
  value       = digitalocean_vpc.customer.ip_range
}

output "project_id" {
  description = "Project ID"
  value       = digitalocean_project.customer.id
}
