---
name: seo-fundamentals
description: Automate sitemap generation, OpenGraph metadata validation, and core web vitals optimization.
---

## Overview
Ensures the shop remains highly optimized for search engines and generative AI bots.

## Capabilities
- **Metadata Validation**: Automatic checks for OG tags, Twitter cards, and Meta descriptions.
- **Sitemap Generation**: Automated `sitemap.xml` updates based on route discovery.
- **Core Web Vitals**: Performance audits focused on LCP, FID, and CLS.

## Implementation Guidelines
- Every page must have a unique meta description.
- Use `src/app/layout.tsx` for global metadata and page-level overrides.
- Validate sitemaps using search console APIs.
