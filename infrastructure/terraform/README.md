# Terraform Infrastructure Modules

This directory contains Terraform modules for deploying the MUTX infrastructure on DigitalOcean.

## Overview

The infrastructure is organized into reusable modules that can be composed to deploy complete environments.

## Modules

| Module | Description |
|--------|-------------|
| [networking](./modules/networking) | VPC and Project management |
| [droplet](./modules/droplet) | Compute droplets with cloud-init |
| [database](./modules/database) | Managed PostgreSQL clusters |
| [redis](./modules/redis) | Managed Redis clusters |
| [loadbalancer](./modules/loadbalancer) | Load balancers for traffic distribution |
| [storage](./modules/storage) | Spaces object storage buckets |
| [dns](./modules/dns) | DNS domain management |
| [vault](./modules/vault) | HashiCorp Vault integration |

## Quick Start

### Prerequisites

- Terraform >= 1.5.0
- DigitalOcean account
- DO API token with appropriate permissions

### Basic Usage

1. Copy the example variables file:

```bash
cp terraform.tfvars.example terraform.tfvars
```

2. Edit `terraform.tfvars` with your configuration:

```hcl
do_token        = "your-digitalocean-token"
project_name    = "mutx"
environment     = "production"
region          = "nyc1"

customers = [
  {
    id       = "customer1"
    vpc_cidr = "10.100.0.0/16"
    ssh_key  = "ssh-rsa AAAAB3..."
  }
]

admin_ssh_key_id = "123456"
admin_cidr       = "your-ip/32"
```

3. Initialize and apply:

```bash
cd environments/production
terraform init -backend-config=backend.hcl
terraform plan
terraform apply
```

## Architecture

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
        │  Droplet  │  │  Droplet  │  │  Droplet  │
        │ (Agent 1) │  │ (Agent 2) │  │ (Agent N) │
        └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
   ┌─────▼─────┐       ┌─────▼─────┐       ┌─────▼─────┐
   │ PostgreSQL │       │   Redis   │       │   Spaces  │
   └───────────┘       └───────────┘       └───────────┘
```

## Using Additional Modules

### Database Module

```hcl
module "database" {
  source = "./modules/database"

  project_name = var.project_name
  customer_id  = "customer1"
  environment  = var.environment
  region       = var.region
  vpc_uuid     = module.networking["customer1"].vpc_id
}
```

### Redis Module

```hcl
module "redis" {
  source = "./modules/redis"

  project_name = var.project_name
  customer_id  = "customer1"
  environment  = var.environment
  region       = var.region
  vpc_uuid     = module.networking["customer1"].vpc_id
}
```

### Load Balancer Module

```hcl
module "loadbalancer" {
  source = "./modules/loadbalancer"

  project_name  = var.project_name
  customer_id   = "customer1"
  environment   = var.environment
  region        = var.region
  vpc_uuid      = module.networking["customer1"].vpc_id
  droplet_ids   = [module.droplet["customer1"].droplet_id]
  http_port     = 80
  https_port    = 443
  agent_port    = 8080
}
```

### Storage Module

```hcl
module "storage" {
  source = "./modules/storage"

  project_name = var.project_name
  customer_id  = "customer1"
  environment  = var.environment
  region       = "nyc3"

  # Optional: Enable CORS for web access
  cors_enabled = true
  cors_origins = ["https://app.example.com"]
}
```

### DNS Module

```hcl
module "dns" {
  source = "./modules/dns"

  project_name = var.project_name
  customer_id  = "customer1"
  environment  = var.environment
  domain_name  = "customer1.example.com"

  a_records = [
    { name = "@", value = "203.0.113.1", ttl = 3600 },
    { name = "api", value = "203.0.113.2", ttl = 3600 },
  ]

  cname_records = [
    { name = "www", value = "@", ttl = 3600 },
  ]

  txt_records = [
    { name = "@", value = "v=spf1 include:_spf.example.com ~all", ttl = 3600 },
  ]
}
```

## Outputs

All modules provide useful outputs that can be consumed by other infrastructure:

- `vpc_id` - VPC UUID for network attachment
- `droplet_ids` - Droplet IDs for load balancer configuration
- `droplet_ips` - Private IP addresses
- `connection_string` - Database connection strings (sensitive)
- `loadbalancer_ip` - Public IP for DNS configuration

## Testing

Run the Terraform validation:

```bash
terraform validate
terraform plan -out=tfplan
```

## Security Considerations

1. **Sensitive Values**: Database passwords and connection strings are marked as sensitive
2. **Network Isolation**: All resources are deployed within VPCs
3. **Firewall Rules**: Database and Redis are restricted to VPC internal traffic
4. **SSH Access**: Only configured admin CIDR can SSH to droplets
5. **Private Networking**: Databases and Redis use private networking only

## Destroying Resources

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will destroy all infrastructure. Make sure you have backups of any persistent data.
