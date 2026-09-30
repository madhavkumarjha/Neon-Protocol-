# MASTER_ROADMAP.md — V1 → V4 Full Plan

> This is the single source of truth for **what ships in which version.** If a feature request doesn't map to a version below, it needs to be placed here (and cross-checked against `docs/PRD.md` Section 6 "Out of Scope") before any AI agent or contributor builds it. Detailed per-version scope lives in `docs/versions/`; this document is the high-level map that ties them together.

---

## 0. Guiding Principle

**Ship the smallest version that's actually fun, validate it, then expand.**

The core loop is locked (see `docs/DECISIONS.md`): Hybrid model — V1 is Endless Survival only, Campaign Mode arrives in V3 (before multiplayer), and narrative stays minimal/codex-style forever unless a future decision explicitly changes that. This roadmap exists to prevent scope creep across versions — each version has a **hard boundary**, and pulling a later-version feature earlier requires updating this document first, not just doing it because it seems easy.

---

## 1. Version Overview

| Version | Codename | Focus | Depends On |
|---|---|---|---|
| V1 | MVP | Endless Survival Desktop core loop | Nothing — this is the foundation |
| V1.1 | Mobile Touch | Touch virtual joystick & mobile controls | V1 Desktop stable |
| V2 | AI Features | Groq LLM-driven dynamic content | V1 & V1.1 stable and validated |
| V3 | Campaign | Scripted chapters, bosses, minimal lore | V1 core loop; V2 not strictly required but likely shipped by now |
| V4 | Platform | Multiplayer, mobile apps, live-ops | V1–V3 all shipped; audience validated |

Versions are **sequential and additive** — nothing in a later version replaces or contradicts an earlier one. Endless Mode from V1 remains playable through V4.

---

## 2. V1 — MVP (Target: Month 1–2)

**Goal:** Ship a genuinely replayable Endless Survival shooter. Validate the core loop before investing in anything else.

**In scope:**
- Core arena gameplay (movement, aim/shoot, collision)
- Endless wave system with escalating difficulty
- Small, distinct weapon roster (count locked in `docs/GDD.md`)
- Upgrade system (choices between waves)
- Periodic boss encounters
- Death/run-end screen with results
- Score + leaderboard (global, Supabase-backed, anonymous `device_id` identity — locked per `docs/DECISIONS.md` Decision #002)
- Basic UI: menu, HUD, pause, settings
- Mobile-responsive touch controls alongside desktop controls
- Launch on **web**

**Explicitly NOT in V1:** AI-generated content, campaign/scripted levels, story/dialogue beyond minimal flavor text if any, multiplayer, native mobile apps, monetization systems.

**Definition of done:** See `docs/versions/v1_MVP_SCOPE.md` for the exhaustive checklist.

---

## 3. V2 — AI Features, PWA & Mobile Touch (Target: Month 3–4)

**Goal:** Layer AI-driven dynamic content on top of the validated Endless Mode core loop, add PWA (Progressive Web App) offline installation support, and provide enhanced mobile virtual touch controls.

**In scope:**
- **PWA (Progressive Web App) Support:** `manifest.json`, Service Worker offline asset caching, and mobile home screen installation.
- **Enhanced Mobile Touch Controls:** Dual virtual joysticks (movement + directional aim) for iOS Safari & Android Chrome.
- **Groq LLM integration:** AI-generated dynamic weapon variants, procedural wave event mutators, and adaptive nemesis system (see `docs/versions/v2_AI_FEATURES.md`).
- **Caching + fallback logic:** Ensures the game remains 100% playable offline or if LLM API calls delay.

**Explicitly NOT in V2:** Campaign mode, multiplayer, any AI-generated *narrative* content (lore stays minimal/codex-style and is not the AI's job to generate freely — see locked decision).

**Definition of done:** See `docs/versions/v2_AI_FEATURES.md`.

---

## 4. V3 — Campaign (Target: Month 5–6)

**Goal:** Add structured, scripted content for players who've engaged with Endless Mode and want a different kind of challenge — without turning this into a narrative-heavy game.

**In scope:**
- Scripted chapters (count and structure defined in `docs/versions/v3_CAMPAIGN.md`)
- Unique bosses per chapter
- Minimal lore delivered codex-style (unlockable text entries, not cutscenes or dialogue trees)
- Endless Mode remains fully available and unchanged

**Explicitly NOT in V3:** Full narrative/dialogue systems, multiplayer (Campaign ships *before* multiplayer per the locked decision), seasonal content.

**Definition of done:** See the V3 version-scope document once written.

> **Naming note:** The original document kit template listed `v3_MULTIPLAYER.md`, but per the locked core-loop decision, **V3 is Campaign, not Multiplayer.** Multiplayer is V4. `docs/versions/v3_CAMPAIGN.md` reflects the corrected naming; multiplayer content lives in `docs/versions/v4_PLATFORM.md` instead.

---

## 5. V4 — Platform (Target: Month 7–12)

**Goal:** Turn a validated single-player game into a platform — multiplayer, native mobile presence, and ongoing live content.

**In scope:**
- Multiplayer: co-op Endless Mode, PvP arena
- Leaderboards expanded for multiplayer contexts
- Social features (friends, sharing runs/scores)
- Native mobile apps (Android/iOS packaging) — V1–V3 targeted mobile *browsers*; V4 adds actual app-store presence
- Cross-platform save/progress sync
- Seasonal content pipeline
- Possible esports/competitive mode (exploratory, not committed)

**Explicitly NOT assumed:** None of V4 is guaranteed to ship exactly as listed — this is the furthest-out version and most likely to shift based on what's learned from V1–V3. Treat this section as directional, not locked.

**Definition of done:** See `docs/versions/v4_PLATFORM.md`.

---

## 6. Cross-Version Rules

1. **No version skips ahead.** V2 work doesn't start until V1 is stable (not necessarily "perfect," but playable end-to-end and tested per `docs/TEST_STRATEGY.md`).
2. **Every version boundary violation gets flagged**, not silently allowed. If implementing a V1 feature naturally suggests a V2/V3 feature, note it in `docs/DECISIONS.md` or `.ai/context.md` — don't build it early just because it's tempting.
3. **This roadmap is versioned itself.** Any change to scope, timeline, or version boundaries should be logged as a decision in `docs/DECISIONS.md`, with this document updated to match — the roadmap should never silently drift from what `DECISIONS.md` says was actually decided.
4. **Timelines are estimates, not commitments.** "Month 1–2" etc. are planning targets as of the roadmap's last update, not promises — update them as reality clarifies rather than pretending they're fixed.

---

## 7. Current Status

- **Active version:** V1 (MVP) — Code implementation, stabilization, and core bug fixes in progress.
- **Next milestone:** Complete V1 hardening (Audio, Mobile touch controls, Weapon/Boss mechanics completeness, Supabase backend integration). Refer to `.ai/context.md` for sprint-level progress tracking.

This section should stay in sync with `.ai/context.md`, which tracks status at a finer grain (sprint-level, not version-level).
