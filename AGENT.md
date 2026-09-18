# AGENT.md — Master AI Rulebook for Neon Protocol

> **This is the primary directive document for all AI agents (Claude, Cursor, GPT, Antigravity) contributing to Neon Protocol.**
> Every AI agent working on this codebase MUST read and strictly enforce the rules set forth in this document before writing any code or making architectural changes.

---

## 1. Project Philosophy & Core Directives

1. **Documentation-First Development:**
   - No code or architectural feature may be written based on assumptions.
   - Always check the relevant spec in `docs/` before implementing any feature.
   - If a decision is not documented in `docs/DECISIONS.md`, flag it for human review rather than guessing.

2. **Strict TypeScript Standards:**
   - Strict mode is enabled in `tsconfig.json`.
   - Never use `any` or loose typing. All entities, configs, and event payloads must have explicit interfaces or types (see `docs/DATA_MODEL.md`).
   - Function signatures must explicitly define parameter types and return types.

3. **Phaser 3 Architecture:**
   - Follow data-driven entity creation principles (`docs/ARCHITECTURE.md`).
   - Decouple scenes, managers, and entities.
   - Game logic belongs in specialized systems (`WaveManager`, `SpawnerSystem`, `UpgradeSystem`), NOT bloat inside Phaser `Scene` classes.
   - Use `EventBus` for cross-component communication.

4. **Testing Obligation:**
   - Every system or utility module written MUST include corresponding Vitest unit tests in `tests/unit/`.
   - Critical user flows (menu navigation, game start, pause, game over, leaderboard) must pass Playwright E2E tests in `tests/e2e/`.

---

## 2. Session Handoff & State Protocol

At the start of every session:
1. Read `.ai/context.md` for current version state, active phase, and unresolved open items.
2. Read `docs/DECISIONS.md` to verify locked architectural and gameplay decisions.

At the end of every session that changes project state:
1. Update `.ai/context.md` with completed items, in-progress work, and any new decisions logged.
2. Log any major architectural or mechanics choices as a new decision entry in `docs/DECISIONS.md`.

---

## 3. Code Style & Conventions

- **File Naming:** `PascalCase` for classes and Phaser scenes (e.g., `GameScene.ts`, `WaveManager.ts`); `camelCase` for utilities and configs (e.g., `mathUtils.ts`, `weaponConfig.ts`).
- **Imports:** Group external imports first, internal modules second, type imports third. Use standard path aliases (`@/systems/...`, `@/entities/...`).
- **Immutability:** Do not mutate shared global state directly. State updates must be routed through explicit manager methods or state handlers.

---

## 4. Conflict Resolution & When Stuck

If instructions in a prompt conflict with `docs/`:
1. `docs/DECISIONS.md` is authoritative for architectural/design choices.
2. `docs/ARCHITECTURE.md` and `docs/PRODUCT_SPEC.md` are authoritative for technical execution.
3. If genuine ambiguity exists, pause and ask the human project owner for clarification.
