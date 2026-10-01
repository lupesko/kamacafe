output "s3_website_endpoint" {
  description = "Public S3 website origin endpoint."
  value       = aws_s3_bucket_website_configuration.site.website_endpoint
}

output "canonical_https_url" {
  description = "Canonical Cloudflare-served public URL."
  value       = "https://${var.site_hostname}"
}

output "bucket_name" {
  description = "Static website bucket name."
  value       = aws_s3_bucket.site.id
}

output "deployment_role_arn" {
  description = "Least-privilege GitHub Actions site deployment role."
  value       = aws_iam_role.deploy.arn
}
