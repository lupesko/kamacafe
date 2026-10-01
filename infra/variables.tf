variable "site_hostname" {
  description = "Canonical public hostname and exact S3 website bucket name."
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])$", var.site_hostname))
    error_message = "site_hostname must be a lowercase DNS hostname."
  }
}

variable "aws_region" {
  description = "AWS region for the website bucket."
  type        = string
  validation {
    condition     = can(regex("^[a-z]{2}(?:-gov)?-[a-z]+-[0-9]+$", var.aws_region))
    error_message = "aws_region must be a valid AWS region name."
  }
}

variable "cloudflare_zone_id" {
  description = "Existing Cloudflare zone identifier."
  type        = string
  validation {
    condition     = can(regex("^[a-f0-9]{32}$", var.cloudflare_zone_id))
    error_message = "cloudflare_zone_id must be a 32-character hexadecimal ID."
  }
}

variable "github_repository" {
  description = "GitHub owner/repository allowed to deploy."
  type        = string
  default     = "lupesko/kamacafe"
  validation {
    condition     = can(regex("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$", var.github_repository))
    error_message = "github_repository must use owner/repository form."
  }
}

variable "github_oidc_provider_arn" {
  description = "ARN of the existing token.actions.githubusercontent.com OIDC provider."
  type        = string
  validation {
    condition     = can(regex("^arn:aws:iam::[0-9]{12}:oidc-provider/token\\.actions\\.githubusercontent\\.com$", var.github_oidc_provider_arn))
    error_message = "github_oidc_provider_arn must reference GitHub Actions' AWS OIDC provider."
  }
}

variable "asset_cache_seconds" {
  description = "Browser and edge TTL for stable image assets."
  type        = number
  default     = 86400
  validation {
    condition     = var.asset_cache_seconds >= 300 && var.asset_cache_seconds <= 2592000
    error_message = "asset_cache_seconds must be between 300 and 2592000."
  }
}

variable "terraform_state_bucket" {
  description = "Pre-created encrypted/versioned Terraform state bucket used in backend configuration."
  type        = string
}

variable "terraform_state_key" {
  description = "Terraform state object key used in backend configuration."
  type        = string
  default     = "kamacafe/production.tfstate"
}

variable "terraform_state_region" {
  description = "Region of the pre-created Terraform state bucket."
  type        = string
}

variable "common_tags" {
  description = "Common AWS resource tags."
  type        = map(string)
  default = {
    Project   = "KamaCafe"
    ManagedBy = "Terraform"
  }
}
