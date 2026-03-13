---
description: Provision and deploy with Terraform and Ansible on DigitalOcean.
icon: droplet
---

# DigitalOcean Deployment

Production deployment using Terraform and Ansible.

## Prerequisites

* DigitalOcean account
* `doctl` CLI installed
* Terraform >= 1.0
* Ansible >= 2.10

```bash
# Install doctl
brew install doctl

# Install Terraform
brew install terraform

# Install Ansible
brew install ansible
```

## Droplet Provisioning

### 1. Configure DigitalOcean Token

```bash
# Create API token in DigitalOcean console
# Then authenticate
doctl auth init

# Verify connection
doctl account get
```

### 2. Configure Terraform Variables

```bash
cd infrastructure/terraform

# Copy example variables
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
do_token        = "your-digitalocean-token"
project_name    = "mutx"
environment     = "production"
region          = "nyc1"
droplet_size    = "s-4vcpu-8gb"
droplet_image   = "ubuntu-22-04-x64"

customers = [
  {
    id          = "customer-001"
    ssh_key     = "ssh-rsa AAAAB3NzaC1..."
  }
]

admin_ssh_key_id = 12345678
agent_port       = 8080
agent_version    = "1.0.0"
telemetry_enabled = true
data_volume_size = 100
```

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Plan and Apply

```bash
# Preview changes
terraform plan

# Apply (creates droplets)
terraform apply

# Output will show droplet IPs
# Apply complete! Resources: 5 added, 0 changed, 0 destroyed.
```

## SSH Setup

### 1. Connect to Droplet

```bash
# Get droplet IP from Terraform output
terraform output droplet_ips

# SSH in
ssh root@<droplet-ip>
```

### 2. Configure SSH Key

```bash
# Add your SSH key to the agent
ssh-add ~/.ssh/id_rsa

# Test connection
ssh -A root@<droplet-ip>
```

## Ansible Provisioning

### 1. Update Inventory

Edit `infrastructure/ansible/inventory.ini`:

```ini
[agents]
mutx-customer-001-agent ansible_host=<droplet-ip> ansible_user=root

[all:vars]
agent_port=8080
agent_version=1.0.0
```

### 2. Run Provisioning Playbook

```bash
cd infrastructure/ansible

# Install requirements
ansible-galaxy collection install community.docker

# Run provision playbook
ansible-playbook -i inventory.ini playbooks/provision.yml
```

This playbook:

* Installs Docker
* Configures firewall
* Sets up monitoring
* Creates necessary directories

### 3. Deploy Agent

```bash
# Deploy your agent to the droplet
ansible-playbook -i inventory.ini playbooks/deploy-agent.yml \
  -e "customer_id=customer-001" \
  -e "agent_config=@vars/agent-config.yml"
```

## Verify Deployment

### 1. Check Docker Containers

```bash
ssh root@<droplet-ip> docker ps
```

### 2. Check Agent Logs

```bash
ssh root@<droplet-ip> docker logs mutx-agent
```

### 3. Test Agent Endpoint

```bash
curl http://<droplet-ip>:8080/health
```

## Infrastructure Overview

```
┌─────────────────────────────────────────────────────────┐
│                   DigitalOcean VPC                       │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │              mutx-agent Droplet                    │ │
│  │                                                    │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │ │
│  │  │  Docker  │  │  Agent   │  │   Data Volume   │  │ │
│  │  │  Engine  │  │  Runtime │  │   (/data)       │  │ │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Maintenance

### Update Agent

```bash
ansible-playbook -i inventory.ini playbooks/deploy-agent.yml \
  -e "customer_id=customer-001" \
  -e "agent_version=1.1.0"
```

### Scale Droplet

```bash
# Modify droplet size in terraform.tfvars
terraform plan
terraform apply
```

### Destroy Infrastructure

```bash
terraform destroy
```

## Troubleshooting

### SSH Connection Failed

```bash
# Check if SSH key is added
ssh-add -l

# Add if missing
ssh-add ~/.ssh/id_rsa
```

### Docker Not Running

```bash
ssh root@<droplet-ip>
systemctl status docker
systemctl start docker
```

### Agent Not Starting

```bash
# Check logs
ssh root@<droplet-ip> docker logs mutx-agent

# Restart agent
ssh root@<droplet-ip> docker restart mutx-agent
```
