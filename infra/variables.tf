variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
  sensitive   = true
}
