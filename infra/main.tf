terraform {
  required_version = ">= 1.5"
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
    railway = {
      source  = "terraform-community-providers/railway"
      version = "~> 0.1"
    }
  }
}

# Vercel deployment for dashboard
resource "vercel_project" "dashboard" {
  name      = "roadsos-dashboard"
  framework = "nextjs"
}
