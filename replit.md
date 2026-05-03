# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

---

## Project: Bible Champions (Mobile App)

### Overview
React Native / Expo mobile Bible trivia app with single-player quiz mode and real-time head-to-head battle mode.

### Key Artifacts
- `artifacts/mobile` — Expo Router v6 mobile app (`@workspace/mobile`)
- `artifacts/api-server` — Express 5 API server with WebSocket battle handler (`@workspace/api-server`)

### Architecture
- **Tab layout**: 4 tabs — Home, Play, Battle, Profile (`app/(tabs)/_layout.tsx`)
- **Stack screens**: quiz, results, battle-waiting, battle-quiz, battle-results (all `fullScreenModal`)
- **Battle**: WebSocket server at `/api/battle/ws`; `BattleContext` (`context/BattleContext.tsx`) wraps the app in `app/_layout.tsx`
- **Game state**: `GameContext` (`context/GameContext.tsx`) with AsyncStorage persistence
- **Questions**: 70+ questions across 7 categories in `constants/questions.ts`

### Theme (Light Blue Sky)
- Background: `#C5E8FF` (sky blue)
- Cards: `rgba(255,255,255,0.88)` (frosted white)
- Text: `#1E3A5F` (dark navy)
- Primary/accent: `#F5A623` (gold/orange)
- Colors defined in: `constants/colors.ts`

### ScreenBackground Component
- `components/ScreenBackground.tsx` — absolute-fill layer with fluffy white clouds + large semi-transparent white cross
- Added to all 9 screens: index, play, profile, battle, quiz, results, battle-waiting, battle-quiz, battle-results

### Checkpoint
- Last saved: commit `cfaebcc9` — "Update app to a light blue sky theme with clouds"

### Conversation Notes (session — May 3, 2026)
- Completed full light blue sky theme migration (dark navy → sky blue)
- Added `ScreenBackground` to all 9 screens (imports + JSX insertion)
- Updated `app.json`: splash `backgroundColor`, android/web `backgroundColor`, `userInterfaceStyle` → all set to `#C5E8FF` / `light`
- User asked to save this conversation thread for future reference
