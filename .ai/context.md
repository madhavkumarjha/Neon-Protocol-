# .ai/context.md — Current Project State

> This is the **first file any AI agent should read** at the start of a session, per `AGENT.md` Section 4's "when stuck" flow and `README.md` Section 6's recommended reading order (it's step 8, read *after* the rest of the doc kit, but it's the one that changes most often and should be re-checked every session even if the rest of the kit hasn't). Unlike every other document in this kit, **this file is expected to go stale quickly and should be updated at the end of any session that changes project state** — it is a snapshot, not a spec.

---

## Current Version

**V2 (Groq AI & Desktop Polish)** — per `docs/MASTER_ROADMAP.md` Section 3 & Decision #020.

## Current Phase

**V2 Complete (Desktop Web + Groq AI):** V1 bug fixes hardened, Groq AI dynamic generation and fallback matrix operational, desktop testing in progress.

## Completed

- Full documentation foundation (20 planning docs + 3 `.ai/` operational files).
- Project Scaffolding: Vite, TypeScript (strict), Phaser 3, Vitest setup (`package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`).
- Data-driven configs (`weapons.config.ts`, `enemies.config.ts`, `waves.config.ts`, `weapons.fallback.ts`).
- Services layer (`StorageService.ts`, `LeaderboardService.ts`, `AudioService.ts`, `GroqService.ts`).
- Core Systems & EventBus (`EventBus.ts`, `GameStateManager.ts`, `WaveSystem.ts`, `SpawnSystem.ts`, `UpgradeSystem.ts`, `ContentValidator.ts`).
- Core Entities (`Player.ts`, `Enemy.ts` with telegraphed boss laser, `Weapon.ts` with melee cleave, `Projectile.ts` with range lifetime & EMP self-damage).
- Phaser 3 Scenes (`BootScene.ts`, `MenuScene.ts`, `GameScene.ts`, `UIScene.ts` with mutator/nemesis banners).
- Main entry point (`src/main.ts`).
- Vitest automated unit tests (53 passing tests across 7 suites in `tests/unit/`).
- Critical V1 Fixes:
  - EventBus listener accumulation & iteration safety.
  - Enemy speed multiplier scaling soft-capped at 1.5x.
  - Player stationary dash direction fix.
  - XP curve math formula synced to `100 * (1.25^level)` per Decision #009.
  - `SpawnSystem.ts` extracted and modularized out of `GameScene.ts`.
  - EMP Grenade AoE shockwave explosion damage added, with capped 15% self-damage and lifetime expiration blast.
  - Web Audio API `AudioService.ts` synthesized SFX (laser, slash, dash, boss laser, explosion, level-up) and ambient darksynth BGM.
  - Pulse Blade melee arc/cleave with visual slashing effect (no stuck projectile).
  - Projectile lifetime dynamically derived from weapon range / speed.
  - Titan Armor stat bonus fixed to prevent double-healing (matches +25 Max HP & +15 heal).
  - Hacker Sentinel slow aura implemented (slows player moveSpeed by 30% within 180px with disruptor tint).
  - Cyber Overlord boss laser telegraphed with 0.5s warning line before dealing damage.
  - Auto-aim lock radius dynamically scaled to equipped weapon range (tunable `AUTO_AIM_CONFIG`).
  - Physics body enable/disable toggled on spawn/die to prevent phantom overlap collisions.
  - Local leaderboard stores real best wave and kills for 'You (Local)'.
  - Launch files created: `.env.example`, `supabase/schema.sql` (RLS + constraints), `playwright.config.ts`.
- Decision #020: Mobile touch controls & PWA dropped; V2 re-scoped to Groq AI + desktop polish; desktop overlay added for touch/mobile screens.
- Groq AI dynamic generation:
  - Vercel serverless proxy `/api/generate` with rate limiting and 3000ms timeout cap.
  - `ContentValidator.ts` deterministic validation, stat clamping, and palette sanitization.
  - `GroqService.ts` multi-tiered fallback matrix (timeout, 5xx, 429 10-min throttle, temp 0.1 retry, local generation cache).
  - Dynamic AI weapon variants in upgrade modal, procedural wave mutators, and Nemesis Lite boss telemetry profiles.

## In Progress

V2 Desktop Polish & Live Validation.

## Blocked

Nothing is architecturally blocked.

## Open Items Awaiting Human Decision

1. **Tutorial/FTUE presence** — flagged in `docs/RISK_ANALYSIS.md` Section 5. Blocks: onboarding/first-run UI work.
2. **Screen orientation lock (mobile)** — RESOLVED: Desktop-only per Decision #020. Mobile overlay displays "Desktop only".
3. **Bug tracking tool** — flagged in `docs/TEST_STRATEGY.md` Section 8. Blocks: nothing code-related; just needed before testing workflow is fully operational.
4. **Upgrade-choice presentation on boss-wave clears** (separate screen vs. combined indicator) — flagged in `docs/UI_UX_FLOW.md` Section 6. Blocks: Upgrade Choice screen implementation for boss waves specifically.
5. **Display name persistence across runs** — flagged in `docs/UI_UX_FLOW.md` Section 3.8 as a recommended-but-unlocked addition. Blocks: nothing if the simpler "always ask" behavior is used as a starting default.

## Last Decision Logged

**Decision #020** — Drop Mobile Scope Entirely; V2 Desktop-Only + Groq AI (`docs/DECISIONS.md`). Supersedes #017 and #018; amends #019. V1.1 is removed from roadmap. V2 focuses strictly on Groq dynamic content (weapons, mutators, Nemesis Lite) and desktop polish.

## Session Handoff Notes

- If context runs out mid-session, use `.ai/prompts.md`'s continuation prompt (once written) or reconstruct from this file plus `docs/DECISIONS.md`.
- A prior handoff already happened once in this project's history: `docs/ARCHITECTURE.md` and `docs/DATA_MODEL.md` were written in a separate session from `README.md` through `GDD.md`, then reconciled — flagged decisions from that session (`docs/ARCHITECTURE.md`'s own "flag for DECISIONS.md" notes) were correctly caught and formally logged as Decisions #002–#009 in a later session. This worked because `docs/DECISIONS.md` and this file both stayed current — keep doing that.
- A second consistency audit (using the `.ai/prompts.md` "Consistency Audit" prompt) caught 9 stale references left behind after Decisions #010–#014 landed: `README.md` (3 lines — stale core-loop description, stale "directional" folder note, stale "document 1 of kit" status), `MASTER_ROADMAP.md` (3 lines — `v3_MULTIPLAYER.md` reference, stale next-milestone note, stale leaderboard-backend-TBD note), `PRD.md` Section 8 (3 open questions that were already resolved), `DATA_MODEL.md` Section 8 (summary list not updated for Decisions #011/#013/#014), `ARCHITECTURE.md` Section 4 (`GameStateManager.ts` missing from the folder listing despite Decision #005 flagging it), and `PRODUCT_SPEC.md` (4 edge cases + Section 15's summary, all referencing already-resolved open items as if still open). All fixed. Lesson worth repeating: a decision landing in `docs/DECISIONS.md` is only half the job — every document its "Consequences" section names has to actually get the follow-up edit, and that's the exact kind of thing that's easy to intend and then skip.

---

## How to Update This File

At the end of any session where project state changed (a document written, a decision logged, implementation started on something), update:
- **Current Phase** — if it changed.
- **Completed** — append what just got finished.
- **In Progress** — reflect what's actively being worked on, remove what's now Completed.
- **Blocked** — add anything genuinely stuck, with why.
- **Open Items Awaiting Human Decision** — remove items once resolved (they should be logged in `docs/DECISIONS.md` instead, not just deleted from here silently).
- **Last Decision Logged** — bump to whatever the newest `docs/DECISIONS.md` entry is.

This file should always be short enough to read in under a minute — if it's growing long, that's a sign completed/stale content needs trimming, not a sign to keep appending indefinitely.
