variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "mutx"
}

variable "environment" {
  description = "Environment (dev, staging, production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "environment must be one of: dev, staging, production."
  }
}

variable "customers" {
  description = "List of customer configurations"
  type = list(object({
    id       = string
    vpc_cidr = string
    ssh_key  = string
  }))
  default = []

  validation {
    condition     = alltrue([for c in var.customers : can(cidrhost(c.vpc_cidr, 0))])
    error_message = "Each customer.vpc_cidr must be a valid CIDR block."
  }

  validation {
    condition     = length(distinct([for c in var.customers : c.id])) == length(var.customers)
    error_message = "Each customer.id must be unique."
  }
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc1"
}

variable "droplet_size" {
  description = "Droplet size (bare-metal slug)"
  type        = string
  default     = "m3.xlarge.x86"
}

variable "droplet_image" {
  description = "Droplet image ID or slug"
  type        = string
  default     = "ubuntu-22-04-x64"
}

variable "data_volume_size" {
  description = "Data volume size in GB"
  type        = number
  default     = 100

  validation {
    condition     = var.data_volume_size >= 10
    error_message = "data_volume_size must be at least 10 GB."
  }
}

variable "agent_port" {
  description = "Port for agent communication"
  type        = number
  default     = 8080

  validation {
    condition     = var.agent_port > 0 && var.agent_port < 65536
    error_message = "agent_port must be between 1 and 65535."
  }
}

variable "agent_version" {
  description = "Agent version to install"
  type        = string
  default     = "latest"
}

variable "telemetry_enabled" {
  description = "Enable telemetry for the agent"
  type        = bool
  default     = false
}

variable "admin_cidr" {
  description = "CIDR block for admin SSH access"
  type        = string
  default     = "0.0.0.0/0"

  validation {
    condition     = can(cidrhost(var.admin_cidr, 0))
    error_message = "admin_cidr must be a valid CIDR block."
  }
}

variable "admin_ssh_key_id" {
  description = "DigitalOcean SSH key ID for admin access"
  type        = string
  default     = ""
}

variable "ssh_public_key" {
  description = "SSH public key for cloud-init user"
  type        = string
  default     = ""
}
