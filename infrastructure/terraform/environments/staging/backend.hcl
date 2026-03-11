endpoint                    = "nyc3.digitaloceanspaces.com"
region                      = "us-east-1"
bucket                      = "mutx-terraform-state"
key                         = "infrastructure/staging/terraform.tfstate"
skip_credentials_validation = true
skip_metadata_api_check     = true
skip_region_validation      = true
skip_requesting_account_id  = true
