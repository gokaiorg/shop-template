---
name: gcp-cloud-run
description: Automate deployments, manage environment variables, and monitor service logs on Google Cloud.
---

## Overview
Automates the lifecycle of Cloud Run services using GCP SDKs and Developer Connect.

## Capabilities
- **Deployment Automation**: Trigger builds and deployments through Cloud Build.
- **Env Management**: Sync environment variables between local, CI, and Cloud Run.
- **Monitoring**: Quick access to logs and service health metrics.

## Best Practices
- Use Developer Connect for GitHub integration.
- Ensure Cloud Build Service Account has required IAM roles (e.g., "Developer Connect Read-only Access").
- Always use `.env.example` as a template for new deployments.
