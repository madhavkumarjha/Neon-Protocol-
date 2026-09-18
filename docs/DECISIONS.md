# DECISIONS.md — Architecture & Design Decision Log

> This document records every major product, technical, and architectural decision made for Neon Protocol.
> Each decision logs the context, choices considered, rationale, and consequences. **No decision logged here may be overridden without a formal update to this document.**

---

## Decision Index

| ID | Title | Date | Status |
|---|---|---|---|
| #001 | Endless Survival Mode as V1 Core Loop | 2026-09-01 | Accepted |
| #002 | Supabase Leaderboard with Anonymous `device_id` | 2026-09-02 | Accepted |
| #003 | Mobile-First Responsive Controls from V1 | 2026-09-03 | Accepted |
| #004 | Data-Driven Entity Architecture | 2026-09-04 | Accepted |
| #005 | Lightweight Custom State Manager Over External State Library | 2026-09-05 | Accepted |
| #006 | Choice of Phaser 3 Engine and Vite Build Tool | 2026-09-06 | Accepted |
| #007 | Vitest for Unit Testing & Playwright for E2E | 2026-09-07 | Accepted |
| #008 | P1 Web Audio Handling & Audio Context Unlocking | 2026-09-08 | Accepted |
| #009 | Exponential XP Formula and Wave Scaling Curves | 2026-09-09 | Accepted |
| #010 | V1 Entity Roster Lock (5 Weapons, 4 Enemies, 1 Boss) | 2026-09-10 | Accepted |
| #011 | Wave Completion Triggered Immediately on Boss Death | 2026-09-12 | Accepted |
| #012 | Reduced EMP Weapon Self-Damage | 2026-09-14 | Accepted |
| #013 | LocalStorage Device Identifier Persistence for Leaderboard | 2026-09-16 | Accepted |
| #014 | Desktop Fire Mode Locked to Auto-Fire Only | 2026-09-17 | Accepted |

---

## Detailed Decision Logs

### Decision #001: Endless Survival Mode as V1 Core Loop
- **Status:** Accepted
- **Context:** Deciding the initial gameplay scope for V1.
- **Choices:** (A) Scripted campaign mode with stages, (B) Endless survival mode, (C) Co-op multiplayer.
- **Rationale:** Endless survival allows maximum replayability with minimum static asset production, fitting an AI-assisted solo/small team workflow.
- **Consequences:** Campaign is deferred to V3; multiplayer deferred to V4.

### Decision #002: Supabase Leaderboard with Anonymous `device_id`
- **Status:** Accepted
- **Context:** Storing global high scores without requiring user registration.
- **Rationale:** Low friction for players. An anonymous `device_id` generated on first run and stored in LocalStorage lets players submit scores immediately.

### Decision #003: Mobile-First Responsive Controls from V1
- **Status:** Accepted
- **Context:** Supporting desktop mouse/keyboard and mobile touch overlays simultaneously.
- **Rationale:** Virtual dual-joysticks adapt seamlessly across mobile web and desktop.

### Decision #004: Data-Driven Entity Architecture
- **Status:** Accepted
- **Context:** Defining how entities (weapons, enemies, upgrades) are structured.
- **Rationale:** Storing stats in typed TypeScript config files (`weaponConfig.ts`, `enemyConfig.ts`) enables rapid iteration without touching core rendering logic.

### Decision #005: Lightweight Custom State Manager Over External State Library
- **Status:** Accepted
- **Context:** Managing global game state (score, current wave, player stats).
- **Rationale:** Avoid external overhead (Redux/Zustand). A custom `GameStateManager` with Phaser event emitters is clean, fast, and lightweight.

### Decision #006: Choice of Phaser 3 Engine and Vite Build Tool
- **Status:** Accepted
- **Rationale:** Phaser 3 provides robust 2D WebGL rendering and arcade physics. Vite delivers instant HMR during development and lean production builds.

### Decision #007: Vitest for Unit Testing & Playwright for E2E
- **Status:** Accepted
- **Rationale:** Vitest integrates natively with Vite for high-speed unit tests. Playwright ensures real browser validation across desktop and mobile viewports.

### Decision #008: P1 Web Audio Handling & Audio Context Unlocking
- **Status:** Accepted
- **Rationale:** Web browsers block audio playback until user interaction. Web Audio context must be unlocked on first touch/click in the Boot/Menu scene.

### Decision #009: Exponential XP Formula and Wave Scaling Curves
- **Status:** Accepted
- **Rationale:** Keeps game pace engaging. XP required per level grows exponentially (`XP = 100 * (1.25 ^ level)`), matching escalating wave difficulty.

### Decision #010: V1 Entity Roster Lock (5 Weapons, 4 Enemies, 1 Boss)
- **Status:** Accepted
- **Rationale:** Limits V1 scope to 5 weapons (Plasma Pistol, Arc Shotgun, Laser Rifle, EMP Grenade, Pulse Blade), 4 enemy types (Scout, Enforcer, Hacker, Drone), and 1 Boss (Cyber Overlord).

### Decision #011: Wave Completion Triggered Immediately on Boss Death
- **Status:** Accepted
- **Rationale:** Defeating a boss immediately clears the wave and awards the upgrade prompt, avoiding anticlimactic clean-up of remaining minions.

### Decision #012: Reduced EMP Weapon Self-Damage
- **Status:** Accepted
- **Rationale:** Full self-damage proved frustrating in playtesting; capping self-damage at 15% prevents accidental suicide while retaining tactical trade-offs.

### Decision #013: LocalStorage Device Identifier Persistence for Leaderboard
- **Status:** Accepted
- **Rationale:** Ensures player high scores remain tied to their device browser without requiring account creation.

### Decision #014: Desktop Fire Mode Locked to Auto-Fire Only
- **Status:** Accepted
- **Rationale:** Streamlines desktop twin-stick controls so mouse position determines aim while auto-fire triggers continuously, creating feature parity with mobile touch.
