# Bible Champions

Editable source for **Bible Champions**, an Expo/React Native Bible-themed game project originally maintained in Replit.

**Original editable project:** [Bible Champions in Replit](https://replit.com/@danbonds007/Bible-Champions)

## Repository layout

- `artifacts/mobile/` — Expo SDK 54 / React Native 0.81.5 mobile app, routes, assets and gameplay UI.
- `artifacts/api-server/` — server component.
- `lib/` — shared TypeScript packages.
- `scripts/` — project scripts.
- `pnpm-workspace.yaml` and `pnpm-lock.yaml` — workspace and reproducible dependency versions.

## Local setup and checks

Requirements: Node.js compatible with the project's dependency stack, pnpm compatible with lockfile version 9, and any environment configuration referenced by the server or mobile app. Do **not** commit credentials or signing files.

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run build
```

The development script for the mobile app expects Replit-specific environment variables; local Expo development outside Replit may require appropriate configuration. A successful JavaScript build does not establish that a signed Play Store Android bundle can be released.

## Android releases

The repo's current `artifacts/mobile/app.json` does not itself establish a production Android package identifier or signing configuration. Before preparing a new Google Play release, confirm the existing Play Console package ID, Expo/EAS project identity, signing credentials, version code, and native dependency compatibility. Do not create a new package identity or replace existing store credentials.

## Backups and safety

This repository is an editable project snapshot. Verify and sync Replit changes before treating it as the current source of truth. Keep secrets, `.env` files, signing keystores, local credentials, `node_modules`, and generated Android bundles out of Git. No Android release has been generated or published as part of this documentation update.
