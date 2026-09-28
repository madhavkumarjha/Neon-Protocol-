# .ai/context.md — Current Project State

> This is the **first file any AI agent should read** at the start of a session, per `AGENT.md` Section 4's "when stuck" flow and `README.md` Section 6's recommended reading order (it's step 8, read *after* the rest of the doc kit, but it's the one that changes most often and should be re-checked every session even if the rest of the kit hasn't). Unlike every other document in this kit, **this file is expected to go stale quickly and should be updated at the end of any session that changes project state** — it is a snapshot, not a spec.

---

## Current Version

**V1 (MVP)** — per `docs/MASTER_ROADMAP.md` Section 2.

## Current Phase

**V1 Stabilization & Gap Closure in progress.** Core bug fixes (EventBus accumulation, enemy speed scaling, stationary dash) completed and verified via unit tests.

## Completed

- Full documentation foundation (20 planning docs + 3 `.ai/` operational files).
- Project Scaffolding: Vite, TypeScript (strict), Phaser 3, Vitest setup (`package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`).
- Data-driven configs (`weapons.config.ts`, `enemies.config.ts`, `waves.config.ts`).
- Services layer (`StorageService.ts`, `LeaderboardService.ts`).
- Core Systems & EventBus (`EventBus.ts` with safe iteration & context unregister, `GameStateManager.ts`, `WaveSystem.ts`, `UpgradeSystem.ts`).
- Core Entities (`Player.ts` with decoupled invulnerability and stationary dash, `Enemy.ts` with stored speed multiplier, `Weapon.ts`, `Projectile.ts`).
- Phaser 3 Scenes (`BootScene.ts`, `MenuScene.ts`, `GameScene.ts`, `UIScene.ts`).
- Main entry point (`src/main.ts`).
- Vitest automated unit tests (12 passing tests in `tests/unit/` including `eventBus.test.ts`, `gameState.test.ts`, `waveMath.test.ts`).
- Critical V1 Fixes: EventBus listener accumulation & iteration safety, Enemy speed multiplier scaling soft-capped at 1.5x, Player stationary dash direction fix.

## In Progress

V1 Hardening & Gap Closure:
- SpawnSystem extraction & modularization.
- Audio (SFX & Synthwave soundtrack generation/loading).
- Mobile Touch Controls (Virtual Joystick + Dash button abstraction).
- Supabase Leaderboard live backend connection & RLS security.
- Weapon & Boss mechanics completeness (EMP AoE, Pulse Blade, Cyber Overlord attack patterns).

## Blocked

Nothing is architecturally blocked. The open items below are **not** blockers to *starting* implementation generally (per `docs/RISK_ANALYSIS.md` Section 4.2's decision-fatigue mitigation — each open item blocks only its specific feature) — but each should be resolved before its specific feature is built.

## Open Items Awaiting Human Decision

Carried forward from across the doc kit — check this list before starting work on any related feature, since building against a guess here is exactly the failure mode this whole documentation system exists to prevent:

1. **Tutorial/FTUE presence** — flagged in `docs/RISK_ANALYSIS.md` Section 5. Blocks: onboarding/first-run UI work.
2. **Screen orientation lock (mobile)** — flagged in `docs/TEST_STRATEGY.md` Section 9 and `docs/UI_UX_FLOW.md` Section 6. Blocks: mobile UI layout implementation.
3. **Bug tracking tool** — flagged in `docs/TEST_STRATEGY.md` Section 8. Blocks: nothing code-related; just needed before testing workflow is fully operational.
4. **Upgrade-choice presentation on boss-wave clears** (separate screen vs. combined indicator) — flagged in `docs/UI_UX_FLOW.md` Section 6. Blocks: Upgrade Choice screen implementation for boss waves specifically.
5. **Display name persistence across runs** — flagged in `docs/UI_UX_FLOW.md` Section 3.8 as a recommended-but-unlocked addition. Blocks: nothing if the simpler "always ask" behavior is used as a starting default.

## Last Decision Logged

**Decision #014** — Desktop fire mode locked to auto-fire only (`docs/DECISIONS.md`). See that document for the full log; decisions #011 and #012 were revised from their originally-drafted form based on the project owner's explicit choices (boss-death-only wave end instead of a hybrid; reduced instead of full EMP self-damage) — worth knowing this history if either topic comes up again, since the "Alternatives Considered" sections in those entries preserve what was proposed and rejected, and why.

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
