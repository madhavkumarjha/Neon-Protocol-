# PRD.md — Product Requirements Document

> This document answers **WHY** we're building Neon Protocol and **WHAT** the product needs to do. It does not cover *how* (see `docs/ARCHITECTURE.md`) or exact mechanic numbers (see `docs/GDD.md`). If a feature isn't listed here or in `docs/PRODUCT_SPEC.md`, it is not in scope — do not build it without updating this document first.

---

## 1. Product Vision

Neon Protocol is a fast, replayable 2D cyberpunk top-down shooter, playable in the browser and eventually on mobile, built around a tight **endless survival core loop** that is enhanced over time by AI-driven dynamic content (Groq LLM) and later expanded into a scripted campaign and multiplayer.

**Vision statement:**
> "A game you can pick up for 5 minutes or lose an hour to — where every run feels a little different, and the world keeps expanding underneath you without ever getting bloated."

The product is being built **documentation-first and AI-delegated**: every major decision is recorded, and AI agents (Claude, Cursor, GPT) do the bulk of implementation work under a fixed rule set (`AGENT.md`), which requires requirements to be unambiguous *before* work starts. This PRD exists to remove ambiguity, not to be an aspirational wishlist.

---

## 2. Problem Statement

**The problem for players:**
Most browser/mobile arcade shooters fall into one of two traps:
- **Too shallow:** fun for 10 minutes, no reason to come back (no progression, no variety).
- **Too demanding:** require large time investment (scripted campaigns, cutscenes) that doesn't fit short mobile/web play sessions.

Players who enjoy fast, skill-based arcade shooters with progression (Vampire Survivors, Brotato, Archero-style audiences) want short sessions that still feel like they're building toward something — without committing to a 20-hour campaign up front.

**The problem for the solo/small dev team building this:**
Building a fully scripted, narrative-heavy game from day one is not feasible for a small AI-assisted team — content production (levels, story, bosses) doesn't scale the way systems and procedural content do. A **survival-first, systems-driven MVP** is the only version of this game that can realistically ship on a short timeline and still be good.

---

## 3. Target Audience

**Primary audience:**
- Players aged ~16–35 who play browser/mobile arcade and roguelite games in short sessions (5–20 minutes).
- Fans of the "survivors-like" genre (Vampire Survivors, Brotato, Halls of Torment) who also like cyberpunk aesthetics.
- Players motivated by **score chasing, leaderboards, and build variety**, not narrative.

**Secondary audience (from V3 onward):**
- Players who want a bit more structure — light story/lore and boss-focused progression — once Campaign Mode ships. This group cares about codex-style lore, not full narrative, per the locked decision in `docs/DECISIONS.md`.

**Not the target audience (explicitly out of scope for V1–V2):**
- Players looking for a story-driven, cinematic single-player game.
- Hardcore competitive PvP players (multiplayer isn't scoped until V4).

---

## 4. Success Metrics (KPIs)

These are the metrics the team will actually look at to judge whether the product is working. They should be revisited once real usage data exists — treat V1 numbers as hypotheses, not commitments.

| Metric | V1 Target (hypothesis) | Why it matters |
|---|---|---|
| Day-1 retention | ≥ 25% | Tells us if the core loop is fun on first touch |
| Day-7 retention | ≥ 8% | Tells us if there's a reason to come back without new content yet |
| Average session length | 5–12 minutes | Confirms the game fits the "short session" design intent |
| Average runs per session | ≥ 2 | Signals "one more run" pull, the core hook of the genre |
| Leaderboard participation | ≥ 15% of players submit a score | Validates that score-chasing is actually motivating |
| Crash-free session rate | ≥ 99% | Baseline quality bar, especially on mobile browsers |

V2+ will add metrics around AI-generated content engagement (e.g., % of runs where a dynamically generated weapon is used), and V3 will add campaign completion rate. Those are **not** V1 metrics and should not be tracked as blockers for V1 launch.

---

## 5. Core Features (MVP — V1 Scope)

Per the locked core-loop decision (`docs/DECISIONS.md`), **V1 ships Endless Survival Mode only.** No campaign, no scripted stages, no multiplayer, no AI-generated content — those are explicitly V2+.

### Must-have (P0) — the game does not ship without these:
1. **Core arena gameplay** — player movement (twin-stick style: move + aim/shoot independently), collision, basic enemy AI.
2. **Wave system** — endless waves of enemies, escalating difficulty over time.
3. **Weapon system** — a small set of distinct weapons (exact count/stats defined in `docs/GDD.md`).
4. **Upgrade system** — player picks upgrades between waves (build variety is the core replayability driver).
5. **Boss encounters** — periodic tougher enemies at fixed wave intervals.
6. **Death/run-end state** — clear "run over" screen with results (waves survived, kills, time).
7. **Score & leaderboard** — local and/or global leaderboard so runs feel comparable and shareable.
8. **Basic UI** — main menu, in-run HUD, pause, settings (audio at minimum), run-end screen.
9. **Mobile-responsive controls** — touch controls that work alongside desktop mouse/keyboard, since mobile is a target platform from V1.

### Should-have (P1) — strongly desired, but the game can ship without them if timeline is tight:
- Basic audio (SFX + music), even if placeholder-quality.
- Simple visual feedback/juice (hit flashes, screen shake) — cyberpunk games live and die on feel.
- A minimal settings persistence (volume, controls) via local storage.

### Explicitly deferred (not P2 — just not V1 at all):
- Anything under Section 6 (Out of Scope).

---

## 6. Out of Scope (for V1 — and why)

| Feature | Deferred to | Reason |
|---|---|---|
| Scripted campaign / levels | V3 | Locked decision — content production doesn't scale for a small team at launch |
| Story / dialogue / cutscenes | V3 (as minimal codex-style lore only — never full narrative) | Locked decision — see `docs/DECISIONS.md` |
| Groq LLM / AI-generated content | V2 | Needs a stable, tested core loop to build dynamic content on top of |
| Multiplayer (co-op, PvP) | V4 | Requires networking infrastructure not justified until the core game is validated |
| Mobile native apps (Android/iOS packaging) | V4 | V1 targets mobile *browsers*, not app-store apps |
| Cosmetics / battle pass / monetization systems | Post-V1 (see `docs/MONETIZATION.md`) | Monetize only after retention is validated — don't build revenue systems for a game nobody's retained in yet |
| Seasonal content | V4 | Requires a live-ops pipeline that doesn't exist yet |

If an AI agent or contributor is asked to build anything in this table before its listed version, flag it — this table is the canonical scope boundary.

---

## 7. User Stories

Written from the player's perspective, in priority order matching Section 5.

**Core loop:**
- As a player, I want to move and aim independently so combat feels responsive and skill-based.
- As a player, I want enemies to keep coming in escalating waves so the game naturally builds tension.
- As a player, I want to choose between upgrade options after surviving a wave so each run feels different based on my choices.
- As a player, I want to occasionally face a tougher boss enemy so there are clear tension spikes to work toward.
- As a player, I want a clear "you died" screen showing how well I did, so I feel a sense of closure and want to try again.

**Retention / replayability:**
- As a player, I want to see my score on a leaderboard so I have a reason to beat my own (or others') best run.
- As a player, I want each run's upgrade choices to meaningfully change how I play, so replaying doesn't feel identical every time.

**Accessibility / platform:**
- As a mobile player, I want touch controls that feel as responsive as desktop controls, so I'm not a second-class player.
- As a player, I want to adjust audio settings, so I can play in different environments (e.g., muted in public).

**Future (V2+, documented here for traceability, not for V1 build):**
- As a returning player, I want to occasionally see a weapon or enemy I've never seen before, so the game feels alive even without manual content updates (→ V2, AI-generated content).
- As a player who's mastered Endless Mode, I want a structured campaign with bosses and light lore, so I have a different kind of challenge to pursue (→ V3).

---

## 8. Open Questions / Risks to Track

The three questions originally raised here are all resolved:

- **Exact weapon/enemy roster:** locked at 5 weapons, 4 enemies, 1 boss archetype — `docs/DECISIONS.md` Decision #010, `docs/GDD.md` Sections 4–5.
- **Leaderboard backend approach:** Supabase, insert-only, anonymous identity — `docs/DECISIONS.md` Decision #002, `docs/DATA_MODEL.md` Section 5.
- **Account/auth system:** none in V1, anonymous `device_id` only — `docs/DECISIONS.md` Decision #002.

For current open items (unrelated to these three, raised elsewhere in the doc kit — tutorial/FTUE, screen orientation, etc.), see `.ai/context.md`'s "Open Items Awaiting Human Decision" list, the single source of truth for outstanding decisions across the kit. Full risk tracking (distinct from open decisions) lives in `docs/RISK_ANALYSIS.md`.
