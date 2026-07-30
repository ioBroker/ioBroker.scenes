# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ioBroker.scenes is an ioBroker adapter that manages scenes (predefined sets of device states). It runs as a daemon and provides both a backend (TypeScript) and an admin UI (React + Vite).

## Build & Development Commands

```bash
# Install all dependencies (root + admin UI)
npm run npm

# Full build (backend + admin GUI)
npm run build

# Backend only (TypeScript compilation)
npm run build:backend

# Admin GUI only (type-check + Vite build + copy to admin/)
npm run build:gui

# Lint backend code
npx eslint

# Run tests
npm test
```

### GUI Build Steps (via `node tasks`)

The `tasks.js` script orchestrates the admin UI build using `@iobroker/build-tools`. Individual steps can be run separately:
- `npm run 0-clean` - Clean admin/ and src-admin/build/
- `npm run 1-npm` - Install src-admin dependencies
- `npm run 3-build` - Build React app with Vite
- `npm run 4-copy` - Copy build output to admin/

## Architecture

### Backend (`src/main.ts`)

Single-file adapter extending `@iobroker/adapter-core`. The `ScenesAdapter` class manages:

- **Scene types:** boolean (simple on/off), number (0-100 value scenes), and virtual groups (aggregate multiple states with min/max/avg/any logic)
- **State flow:** User writes to `scene.0.<name>` with `ack:false` -> adapter activates scene members with optional delays and burst intervals -> adapter sets scene state to `ack:true`
- **Triggers:** Scenes can auto-activate when monitored states match conditions (`==`, `!=`, `<`, `>`, `<=`, `>=`, `update`)
- **Cron scheduling:** Uses `node-schedule` for time-based scene activation
- **Key internal maps:** `scenes` (config), `sceneValue` (current values), `ids` (state-to-scene mapping), `triggers` (trigger-to-scene mapping), `timers` (delayed executions)

### Admin UI (`src-admin/`)

React 18 + Material UI 6 + Vite app built on `@iobroker/adapter-react-v5`:

- `App.tsx` - Main component, extends `GenericApp`, manages scene CRUD operations
- `ScenesList.tsx` - Left panel with tree view, drag-drop reordering, folder management
- `SceneForm.tsx` - Right panel scene configuration editor
- `SceneMembersForm.tsx` - Editor for individual state members within a scene
- `ExportImportDialog.tsx` - JSON import/export
- `EnumsSelector.tsx` - Enum (room/function) selector for bulk member addition

The admin UI has its own `package.json`, `tsconfig.json`, and `eslint.config.mjs` in `src-admin/`.

### Scene Object Structure

Scene IDs follow the pattern `scene.<instance>.<path>.<name>`. Configuration is stored in `obj.native` with:
- `members[]` - Array of state IDs with desired values, delays, and tolerances
- `onTrue` / `onFalse` - Activation configuration (trigger, cron, delay settings)
- `virtualGroup` - Boolean flag for virtual group mode
- `aggregation` - Aggregation function for virtual groups

## TypeScript Configuration

- `tsconfig.json` - Root config for editor/type-checking only (`noEmit: true`), strict mode, target ES2022, module Node16
- `tsconfig.build.json` - Extends root, enables emit, includes only `src/**/*.ts`

## Testing

Tests use Mocha + `@iobroker/legacy-testing` which spins up a real js-controller instance. Tests are integration-level (adapter startup, message handling). Test files are plain JS in `test/`.

## Linting

ESLint uses `@iobroker/eslint-config` (flat config format). Backend lint scope covers only `src/` — the `src-admin/`, `test/`, `build/`, and `admin/` directories are ignored. The admin UI has its own separate ESLint config.

## Release Process

Uses `@alcalzone/release-script`. Version tags trigger CI deploy to npm. The `io-package.json` contains ioBroker-specific metadata and must stay in sync with `package.json` version.

## Internationalization

11 languages supported (en, de, ru, pt, nl, fr, it, es, pl, uk, zh-cn). Translations live in `src-admin/src/i18n/` as per-language JSON files.
