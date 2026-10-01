locals {
  bucket_arn = "arn:aws:s3:::${var.site_hostname}"
}

resource "aws_s3_bucket" "site" {
  bucket = var.site_hostname
  tags   = var.common_tags
}

resource "aws_s3_bucket_versioning" "site" {
  bucket = aws_s3_bucket.site.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "site" {
  bucket = aws_s3_bucket.site.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_ownership_controls" "site" {
  bucket = aws_s3_bucket.site.id
  rule { object_ownership = "BucketOwnerEnforced" }
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_website_configuration" "site" {
  bucket = aws_s3_bucket.site.id
  index_document { suffix = "index.html" }
  error_document { key = "index.html" }
}

data "aws_iam_policy_document" "public_read" {
  statement {
    sid       = "PublicReadOnly"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${local.bucket_arn}/*"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
  }
}

resource "aws_s3_bucket_policy" "public_read" {
  bucket     = aws_s3_bucket.site.id
  policy     = data.aws_iam_policy_document.public_read.json
  depends_on = [aws_s3_bucket_public_access_block.site]
}

data "aws_iam_policy_document" "github_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [var.github_oidc_provider_arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repository}:ref:refs/heads/main", "repo:${var.github_repository}:environment:production"]
    }
  }
}

resource "aws_iam_role" "deploy" {
  name               = "kamacafe-static-site-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_assume.json
  tags               = var.common_tags
}

data "aws_iam_policy_document" "deploy" {
  statement {
    sid       = "ReadBucketMetadata"
    actions   = ["s3:GetBucketLocation", "s3:ListBucket"]
    resources = [local.bucket_arn]
  }
  statement {
    sid       = "ManageSiteObjects"
    actions   = ["s3:DeleteObject", "s3:GetObject", "s3:PutObject"]
    resources = ["${local.bucket_arn}/*"]
  }
}

resource "aws_iam_role_policy" "deploy" {
  name   = "kamacafe-static-site-objects"
  role   = aws_iam_role.deploy.id
  policy = data.aws_iam_policy_document.deploy.json
}

resource "cloudflare_dns_record" "site" {
  zone_id = var.cloudflare_zone_id
  name    = var.site_hostname
  type    = "CNAME"
  content = aws_s3_bucket_website_configuration.site.website_endpoint
  proxied = true
  ttl     = 1
  comment = "KamaCafe public S3 website origin"
}

resource "cloudflare_ruleset" "site_ssl" {
  zone_id     = var.cloudflare_zone_id
  name        = "KamaCafe origin encryption"
  description = "Use Flexible mode only for the public S3 website hostname."
  kind        = "zone"
  phase       = "http_config_settings"
  rules = [{
    ref               = "kamacafe_flexible_ssl"
    action            = "set_config"
    expression        = "(http.host eq \"${var.site_hostname}\")"
    description       = "S3 website endpoints accept HTTP only"
    enabled           = true
    action_parameters = { ssl = "flexible" }
  }]
}

resource "cloudflare_ruleset" "https_redirect" {
  zone_id     = var.cloudflare_zone_id
  name        = "KamaCafe HTTPS redirect"
  description = "Redirect HTTP requests for the site hostname to HTTPS."
  kind        = "zone"
  phase       = "http_request_dynamic_redirect"
  rules = [{
    ref         = "kamacafe_https_redirect"
    action      = "redirect"
    expression  = "(http.host eq \"${var.site_hostname}\" and http.request.scheme eq \"http\")"
    description = "Canonical HTTPS"
    enabled     = true
    action_parameters = {
      from_value = {
        status_code           = 301
        preserve_query_string = true
        target_url            = { expression = "concat(\"https://\", http.host, http.request.uri.path)" }
      }
    }
  }]
}

resource "cloudflare_ruleset" "cache" {
  zone_id     = var.cloudflare_zone_id
  name        = "KamaCafe cache policy"
  description = "Honor the deployment's no-cache entry document and finite/immutable asset headers."
  kind        = "zone"
  phase       = "http_request_cache_settings"
  rules = [
    {
      ref               = "kamacafe_entry_revalidate"
      action            = "set_cache_settings"
      expression        = "(http.host eq \"${var.site_hostname}\" and http.request.uri.path in {\"/\" \"/index.html\"})"
      description       = "Do not edge-cache the entry document"
      enabled           = true
      action_parameters = { cache = false }
    },
    {
      ref         = "kamacafe_immutable_assets"
      action      = "set_cache_settings"
      expression  = "(http.host eq \"${var.site_hostname}\" and starts_with(http.request.uri.path, \"/assets/\"))"
      description = "Cache content-hashed Vite assets for one year"
      enabled     = true
      action_parameters = {
        cache       = true
        browser_ttl = { mode = "override_origin", default = 31536000 }
        edge_ttl    = { mode = "override_origin", default = 31536000 }
      }
    },
    {
      ref         = "kamacafe_stable_images"
      action      = "set_cache_settings"
      expression  = "(http.host eq \"${var.site_hostname}\" and starts_with(http.request.uri.path, \"/images/\"))"
      description = "Cache stable image paths for a finite interval"
      enabled     = true
      action_parameters = {
        cache       = true
        browser_ttl = { mode = "override_origin", default = var.asset_cache_seconds }
        edge_ttl    = { mode = "override_origin", default = var.asset_cache_seconds }
      }
    }
  ]
}
