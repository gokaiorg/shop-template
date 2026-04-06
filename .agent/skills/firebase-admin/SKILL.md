---
name: firebase-admin
description: Manage Firestore data synchronization, user authentication, and database backups.
---

## Overview
This skill provides tools and processes for managing Firebase services via the `firebase-admin` SDK.

## Capabilities
- **Firestore Sync**: Synchronize local data structures with Firestore collections.
- **Auth Management**: Programmatically manage users, custom claims, and session tokens.
- **Backups**: Procedures for exporting and importing Firestore data.

## Scripts & Tools
- `scripts/sync-firestore.ts`: Handles data migration and synchronization.
- `scripts/backup-db.ts`: Triggers Firestore export to GCS.

## Best Practices
- Always use service accounts with the least privilege principle.
- Validate all data using Zod before pushing to Firestore.
- Document any schema changes in Firestore documentation.
