---
name: nextjs-best-practices
description: Enforce clean code standards for Next.js 14+ App Router, including Server Components and optimized routing.
---

## Overview
Standards for building performant and maintainable Next.js applications using the App Router.

## Core Rules
1. **Server Components**: Prefer Server Components for data fetching to reduce bundle size.
2. **Optimized Images**: Use the `next/image` component for all assets.
3. **Route Handlers**: Keep API logic separate from UI in the `app/api` directory.
4. **Zustand State**: Use Zustand for client-side state only when necessary.

## Checklists
- [ ] No 'use client' where not needed.
- [ ] Proper error/loading boundaries implemented.
- [ ] Middleware handles auth and localization correctly.
