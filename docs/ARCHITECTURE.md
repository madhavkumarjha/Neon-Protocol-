# ARCHITECTURE.md — Technical Blueprint

> This document answers **HOW** Neon Protocol is built, technically. It implements the locked core loop (`docs/DECISIONS.md` Decision #001) and the V1 feature list (`docs/PRD.md` Section 5, `docs/GDD.md`). It also resolves the open technical questions flagged in `docs/PRD.md` Section 8 (leaderboard backend, auth). Scope here is **V1 architecture only** — V2 (AI/Groq integration), V3 (Campaign), and V4 (multiplayer/platform) architecture is noted separately at the end for traceability, but is NOT to be built now, per `AGENT.md` Section 2, Rule 7.

---

## 1. Purpose & Scope

This is the technical source of truth for module boundaries, data flow, folder structure, and infrastructure decisions. Per `AGENT.md` Section 7 (Document Authority), this document — along with `docs/DATA_MODEL.md` and `docs/API_REFERENCE.md` — governs **how to build it technically**. If code and this document disagree, that's a bug: either the code is wrong, or this document is stale and needs updating (log the correction in `docs/DECISIONS.md` if it's a non-trivial change).

---

## 2. High-Level System Diagram (V1)

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser Client                       │
│                                                               │
│  ┌───────────────┐   ┌───────────────┐   ┌────────────────┐  │
│  │  Phaser 3      │   │  Game Systems  │   │  UI Layer      │  │
│  │  Scene Manager │──▶│  (Wave, Spawn, │──▶│  (HUD, Menus,  │  │
│  │  (Boot, Menu,  │   │  Upgrade,      │   │  Run-End,      │  │
│  │  Game, UI)     │◀──│  Combat)       │◀──│  Settings)     │  │
│  └───────────────┘   └───────────────┘   └────────────────┘  │
│         │                     │                    │          │
│         └─────────────┬───────┴────────────────────┘          │
│                        ▼                                     │
│              ┌───────────────────┐                           │
│              │  Config / Data     │  (weapons.json,           │
│              │  Layer (static)    │   enemies.json,           │
│              │                    │   waves.json)             │
│              └───────────────────┘                           │
│                        │                                     │
│                        ▼                                     │
│              ┌───────────────────┐                           │
│              │  LocalStorage      │  (settings, device ID,    │
│              │  (client-side)     │   cached last score)      │
│              └───────────────────┘                           │
└─────────────────────────────┬─────────────────────────────────┘
                               │ HTTPS (score submit / fetch only)
                               ▼
                  ┌─────────────────────────┐
                  │  Leaderboard Backend     │
                  │  (Supabase — see Sec. 6) │
                  └─────────────────────────┘
```

**Key principle:** V1 is a **client-heavy, server-light** architecture. Almost everything — game logic, state, rendering — runs entirely in the browser. The only network dependency is a thin leaderboard read/write. This keeps V1 cheap to host, simple to build, and resilient (the game is fully playable offline; only leaderboard submission needs connectivity).

---

## 3. Tech Stack (Rationale)

`README.md` Section 2 lists the *what*. This section adds the *why*, specifically for architecture-relevant choices not already logged as a decision.

| Layer | Choice | Architectural Reasoning |
|---|---|---|
| Engine | Phaser 3 | Scene-based structure maps cleanly onto Boot → Menu → Game → UI flow. Built-in Arcade Physics is sufficient for top-down collision (no need for a heavier physics engine like Matter.js in V1). |
| Language | TypeScript (strict) | Enforced by `AGENT.md` Section 3. Strict mode catches config/data-shape mistakes at compile time — important since weapons/enemies/waves are data-driven (Section 4). |
| Build tool | Vite | Fast HMR during AI-assisted iteration; simple static-site output that deploys to any static host (no server-side rendering needed for a client-heavy game). |
| Backend (V1) | Supabase (Postgres + auto-REST) | See Section 6 — resolves PRD's open leaderboard/auth question with the lightest option that still gives a real global leaderboard. |
| Hosting | Static host (Vercel/Netlify/Cloudflare Pages — final pick not architecturally significant, low-risk choice) | Client-heavy architecture means the entire game ships as static assets; only the Supabase project is a separate hosted piece. |

---

## 4. Folder Structure (LOCKED)

This finalizes the "directional" structure sketched in `README.md` Section 4.

```
📦 neon-protocol/
│
├── 📄 README.md
├── 📄 AGENT.md
│
├── 📂 src/
│   ├── main.ts                    → Entry point, Phaser game config
│   │
│   ├── 📂 scenes/                 → One file per Phaser scene
│   │   ├── BootScene.ts           → Asset preload
│   │   ├── MenuScene.ts           → Main menu
│   │   ├── GameScene.ts           → Core gameplay loop
│   │   └── UIScene.ts             → HUD, overlays (runs parallel to GameScene)
│   │
│   ├── 📂 entities/                → Player, enemies, weapons, projectiles
│   │   ├── Player.ts
│   │   ├── Enemy.ts               → Base class; specific types via config, not subclassing (see Section 5)
│   │   ├── Weapon.ts
│   │   └── Projectile.ts
│   │
│   ├── 📂 systems/                  → Stateless-ish logic managers, one responsibility each
│   │   ├── WaveSystem.ts          → Wave sequencing, escalation (per `docs/GDD.md` Section 6)
│   │   ├── SpawnSystem.ts         → Turns wave data into actual entity spawns
│   │   ├── UpgradeSystem.ts       → Upgrade offer/selection logic (per `docs/GDD.md` Section 8)
│   │   ├── CombatSystem.ts        → Damage resolution, hit detection glue
│   │   └── GameStateManager.ts    → Single source of truth for run-scoped `RunState`; no external state library (`docs/DECISIONS.md` Decision #005)
│   │
│   ├── 📂 config/                    → Data-driven definitions (see Section 5)
│   │   ├── weapons.config.ts      → Mirrors `docs/GDD.md` Section 4 table
│   │   ├── enemies.config.ts      → Mirrors `docs/GDD.md` Section 5 table
│   │   └── waves.config.ts        → Mirrors `docs/GDD.md` Section 6 escalation model
│   │
│   ├── 📂 services/                  → External I/O boundary (new in this document)
│   │   ├── LeaderboardService.ts  → Wraps Supabase calls; see Section 6
│   │   └── StorageService.ts      → Wraps localStorage (settings, device ID)
│   │
│   └── 📂 utils/                     → Shared helpers (math, formatting)
│
├── 📂 assets/                      → Sprites, audio, fonts
│
├── 📂 docs/                        → Documentation (this file's home)
│   └── 📂 versions/
│
└── 📂 .ai/                         → AI agent context, rules, prompts
```

**Rule for AI agents (per `AGENT.md` Section 2, Rule 1):** This structure is now locked. Adding a new top-level folder under `src/`, or moving a responsibility across the `entities/` vs `systems/` boundary, counts as a core architecture change — propose it and log it in `docs/DECISIONS.md` before doing it.

---

## 5. Module Responsibilities & Data-Driven Design

**Core principle: entities are data-driven, not subclassed.** There is one `Enemy.ts` class, not `DroneSwarmer.ts`, `Enforcer.ts`, `SniperTurret.ts`, `Brute.ts` as separate classes. Each enemy *type* is a config object (`enemies.config.ts`) consumed by the single `Enemy` class. Same pattern for `Weapon.ts` and the weapon roster.

**Why this matters architecturally:**
- Matches `docs/GDD.md`'s own framing of weapons/enemies as **tables of values**, not bespoke behaviors — the data model should mirror the design model.
- Directly supports V2 (per `docs/MASTER_ROADMAP.md` Section 3): AI-generated weapon variants (Groq LLM) become **new config objects fed into the existing `Weapon` class**, not new code. This is the single biggest reason this pattern is locked now — building V1 with subclassed entities would require an architecture rewrite before V2 could start.
- Keeps `docs/GDD.md`'s balance-tuning process (Section 10) directly actionable: a numbers-only tuning pass is a config-file edit, not a code change.

| Layer | Responsibility | Does NOT do |
|---|---|---|
| `entities/` | Represent a single instance in the game world; hold runtime state (current HP, position) | Decide *when* to spawn, *what* wave it belongs to, or *which* upgrade unlocked it |
| `systems/` | Orchestrate entities over time (spawn timing, wave sequencing, upgrade offers) | Hold long-term persistent state (that's `services/`) or render anything directly |
| `config/` | Static, versionable data — the "numbers" from `docs/GDD.md` | Contain logic or behavior — config files should be pure data, not functions |
| `services/` | Boundary to anything outside the browser sandbox (network, storage) | Contain gameplay logic — a service call failing should never crash a run (see Section 6) |

---

## 6. Backend Architecture — Leaderboard & Auth (RESOLVES PRD Section 8 Open Questions)

`docs/PRD.md` Section 8 left two questions open: leaderboard backend approach, and whether V1 needs an auth system. This section locks both.

### Decision: Supabase + anonymous device identity

- **Leaderboard backend:** Supabase (hosted Postgres + auto-generated REST API). Chosen over a fully custom backend because it requires no server code to maintain — a single `scores` table (`id`, `device_id`, `name`, `score`, `wave_reached`, `created_at`) with row-level security rules is sufficient for V1's read/write pattern (submit score, fetch top N).
- **Auth:** **No real account system in V1.** Each client generates a random UUID on first launch, stored in `localStorage` via `StorageService`, and used as `device_id`. This satisfies the leaderboard's need for *some* identity without building login, password reset, email verification, or any of the account-system surface area PRD explicitly wants to avoid pre-retention-validation (see `docs/PRD.md` Section 6 — monetization/accounts are deferred).
- **Player-chosen display name:** Player enters a short display name (stored alongside the score submission, not tied to an account) — enough for a readable leaderboard without requiring identity infrastructure.

### Reasoning
- Meets the PRD KPI "Leaderboard participation ≥ 15%" (Section 4), which requires a **shared/global** leaderboard — a purely local (device-only) leaderboard would not satisfy this metric, since there'd be nothing to compare against.
- Avoids building or maintaining custom backend infrastructure for a V1 whose core hypothesis (the loop is fun) hasn't been validated yet — consistent with `docs/DECISIONS.md` Decision #001's "risk reduction" reasoning applied to infra, not just game design.
- Anonymous device-ID identity avoids the auth-system cost PRD flagged as an open risk, while still being upgradeable later — V4's "cross-platform save/progress sync" (`docs/MASTER_ROADMAP.md` Section 5) can layer real accounts on top of this device-ID system without a rewrite, since `LeaderboardService` is already an isolated boundary (Section 5).

### Failure handling (required, not optional)
`LeaderboardService` calls must **never block or crash a run**. If the Supabase call fails (network down, timeout, rate limit):
- The run-end screen still shows the player's own score.
- The score is queued in `localStorage` and retried on next launch (simple retry, not a full offline-sync engine).
- The leaderboard view shows a "couldn't load leaderboard" state rather than an error screen.

### ⚠️ Flag for `docs/DECISIONS.md`
This is a **non-trivial decision** per `AGENT.md` Section 2, Rule 6 (it resolves an explicitly-flagged PRD open question and picks a specific vendor/dependency). It should be logged as **Decision #002** in `docs/DECISIONS.md`, replacing the current placeholder. I have not edited `DECISIONS.md` myself — recommend doing that as the very next small step so the append-only log stays authoritative, per that document's own Rule 3.

---

## 7. Wave-Clear Condition (RESOLVES GDD Section 6 Open Item)

`docs/GDD.md` Section 6 left the wave-clear condition open between timer-based and kill-quota-based, recommending timer-based. From an architecture standpoint:

- **Timer-based is also the simpler system to implement and test.** It requires only a countdown tied to `WaveSystem`, with no dependency on tracking exact kill counts against spawn counts (which gets complicated once enemies can flee, despawn, or be affected by future AI-driven spawn logic in V2).
- **Locking this as timer-based** for V1 implementation. If playtesting shows it feels passive (per `docs/GDD.md`'s own caveat), switching to kill-quota is a `WaveSystem` change, not a full architecture change — low cost to reverse if needed.

### ⚠️ Flag for `docs/DECISIONS.md`
This should also be logged — either folded into Decision #002 above, or as its own **Decision #003** — since `docs/GDD.md` explicitly said "confirm and log once tested." Architecturally I'm locking it for *implementation purposes* now (so `WaveSystem` has one clear spec to build against), but the formal confirm-after-playtesting step GDD asked for still applies.

**Update:** Logged as `docs/DECISIONS.md` Decision #003. Note the exception carved out since this section was written: **boss waves do not use the timer at all** — per `docs/DECISIONS.md` Decision #011, a boss wave ends only when the boss dies. The timer-based rule above applies to non-boss waves only.

---

## 8. State Management

- **No external state library** (Redux, Zustand, etc.) in V1. Phaser's own scene data + a single `GameStateManager` (in `systems/`, not listed above — add when implementation starts) holds current-run state (HP, score, wave number, active upgrades).
- **Rationale:** V1's state shape is small and mostly single-scene (`GameScene`). Introducing a state library now is complexity ahead of need — per `AGENT.md` Section 2, Rule 4, this also avoids adding a dependency that isn't yet justified. Revisit only if V2's AI Director (`docs/MASTER_ROADMAP.md` Section 3) needs cross-scene reactive state that outgrows this approach — and log that as a decision if/when it happens.
- **Persisted state (survives a browser refresh):** settings (audio volume, controls), device ID, last-known score cache. Everything else is run-scoped and resets on death.

---

## 9. Performance Targets

| Target | Value | Why |
|---|---|---|
| Frame rate | 60 FPS sustained on mid-tier mobile browsers | Twin-stick shooters feel bad below 60fps; this is a genre-defining bar, not a nice-to-have |
| Max concurrent entities | ~150 (enemies + projectiles combined) at peak wave density | Baseline hypothesis for V1's fixed 4-enemy roster; revisit if boss waves or upgrade stacking push higher |
| Initial load time | < 3 seconds on average mobile connection | Matches PRD's "5-minute pickup" design intent (Section 1 vision) — a slow load undermines the whole pitch |
| Leaderboard call latency budget | Non-blocking; UI must not wait on it to show run results | Per Section 6 failure handling — network should never gate the core loop |

These are **hypotheses to validate**, same status as `docs/GDD.md`'s balance numbers — concrete enough to build against, expected to be tuned once real devices are tested.

---

## 10. Build & Deployment

- **Environments:** local dev (`npm run dev`), production build (`npm run build` → static output).
- **Deployment target:** any static host capable of serving a Vite build (specific vendor choice is low-risk/reversible, not architecturally locked here).
- **Environment variables:** Supabase URL + anon key are the only secrets-adjacent config needed for V1 — anon key is safe for client exposure by Supabase's own row-level-security design, but RLS policies must restrict writes to insert-only on the `scores` table (no update/delete from the client).

---

## 11. Testing Architecture (Pointer)

Full detail belongs in `docs/TEST_STRATEGY.md` (not yet written). Architecturally relevant note: the data-driven design in Section 5 makes **config validation** a first-class test category — a malformed `weapons.config.ts` entry should fail a test, not surface as a runtime bug during a run.

---

## 12. Out of Scope for This Document (V2+ Architecture — Noted for Traceability Only)

Per `AGENT.md` Section 2, Rule 7 (respect version boundaries), the following are **not designed here**:

- **V2:** Groq LLM integration architecture (API contract, caching/fallback design per `docs/MASTER_ROADMAP.md` Section 3) — belongs in `docs/API_REFERENCE.md` and `docs/versions/v2_AI_FEATURES.md` (not yet written). Note: Section 5's data-driven entity design is intentionally built now to make this easier later — that is the one deliberate piece of forward-compatibility in this document, not scope creep.
- **V3:** Campaign/chapter data structure, codex/lore storage format — belongs in `docs/versions/v3_CAMPAIGN.md` (not yet written).
- **V4:** Multiplayer networking model, real account/auth system replacing the anonymous device-ID approach, native mobile packaging — belongs in `docs/versions/v4_PLATFORM.md` (not yet written).

Do not pull architecture from these sections into V1 implementation.

---

## 13. Summary of Decisions Made in This Document

For quick reference — these need formal `docs/DECISIONS.md` entries (see flags in Sections 6 and 7):

1. Leaderboard backend = Supabase; Auth = anonymous device-ID, no accounts in V1.
2. Wave-clear condition = timer-based, locked for V1 implementation (pending playtest confirmation per `docs/GDD.md`).
3. Entities are data-driven (config + single class), not subclassed per enemy/weapon type — done specifically to de-risk V2.
4. No external state-management library in V1.
