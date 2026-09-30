# PRODUCT_SPEC.md — Detailed Feature Specification

> This document answers **HOW each feature should behave**, at a level detailed enough to implement and test against — one step more granular than `docs/PRD.md` (which says *what* to build and *why*) and `docs/GDD.md` (which says *what the numbers/mechanics are*). Every feature below maps to a P0/P1 item in `docs/PRD.md` Section 5. If an AI agent is implementing a feature and its acceptance criteria aren't covered here, that's a gap to flag, not a gap to guess through (per `AGENT.md` Section 2, Rule 3).

---

## 1. How to Read This Document

Each feature has:
- **Priority** — inherited directly from `docs/PRD.md` Section 5 (P0 = ships or the game doesn't ship; P1 = strongly desired, game can ship without it under time pressure).
- **Description** — one paragraph, plain language.
- **Acceptance criteria** — testable, checkbox-style statements. If every box is checked, the feature is "done" per this spec.
- **Edge cases** — situations that aren't the happy path but must still behave correctly.
- **Dependencies** — which other features/systems/documents this relies on.

Numbers referenced (damage, HP, wave timing, etc.) are **not redefined here** — they're pulled from `docs/GDD.md` by reference, so a balance tuning pass never requires touching this document.

---

## 2. Feature: Core Arena Gameplay

**Priority:** P0

**Description:** The player controls a character in a single closed arena, moving freely and aiming/attacking independently of movement direction (twin-stick style). This is the foundational feel of the entire game — every other feature sits on top of this.

**Acceptance criteria:**
- [ ] Player can move in 8 directions (or full analog, depending on input method) at the speed defined in `docs/GDD.md` Section 3.
- [ ] Player's aim direction is independent of movement direction (desktop: mouse position; mobile: see Section 8 of this document).
- [ ] Player cannot move outside the arena bounds defined in `docs/GDD.md` Section 2 — hard collision at walls, no clipping.
- [ ] Player collides with enemies per `docs/GDD.md` Section 5 contact-damage values; collision does not let the player pass through an enemy.
- [ ] Movement and aiming both feel responsive at the 60 FPS target (`docs/ARCHITECTURE.md` Section 9) — no perceptible input lag under normal load (~150 concurrent entities).

**Edge cases:**
- Player pinned against a wall by multiple enemies: must still be able to attempt to move (input is never silently dropped, even if movement is blocked by collision).
- Extremely high entity count (peak wave density): movement/aim input must not degrade in responsiveness before frame rate does — if performance has to degrade, it should degrade visually (fewer particle effects) before it degrades input responsiveness.

**Dependencies:** `docs/GDD.md` Section 2 (arena), Section 3 (player stats); `docs/ARCHITECTURE.md` Section 9 (performance targets).

---

## 3. Feature: Wave System

**Priority:** P0

**Description:** Enemies spawn in escalating waves, each timer-cleared (per `docs/DECISIONS.md` Decision #003), with composition and difficulty increasing over time per `docs/GDD.md` Section 6.

**Acceptance criteria:**
- [ ] A wave begins immediately after the previous wave's timer expires and the player has made (or skipped, if design allows — see edge case below) their upgrade choice.
- [ ] Enemy composition for waves 1–20 (or however many are authored) matches `docs/GDD.md` Section 6's escalation model; waves beyond the authored roster are generated procedurally per the same section.
- [ ] Every 5th wave is a boss wave (`isBossWave: true`), replacing normal composition with a Boss Unit plus light supporting spawn, per `docs/GDD.md` Section 7.
- [ ] Current wave number is visible in the HUD at all times during a run (ties to Section 8 of this document, Basic UI).
- [ ] Wave timer duration matches the value in the corresponding `WaveDefinition.clearCondition.durationSeconds` (`docs/DATA_MODEL.md` Section 2.3) — not hardcoded per-wave in game code.

**Edge cases:**
- Player dies mid-wave: wave timer/spawn logic must stop cleanly — no orphaned spawns continuing after run-end state begins (see Section 6 of this document).
- All enemies in a wave are killed before the timer expires: current design (timer-based, not kill-quota) means the wave does **not** end early — this is intentional per `docs/DECISIONS.md` Decision #003, not a bug. Player simply has "downtime" until the timer ends; this should be monitored during playtesting since it's the exact risk that decision flagged.
- Boss wave: there is no timer running at all — the wave ends immediately and only when the boss dies, per `docs/DECISIONS.md` Decision #011. A boss `WaveDefinition` uses `clearCondition: { type: "boss_death" }`, never `"timer"` (`docs/DATA_MODEL.md` Section 2.3). Accepted tradeoff: this carries a soft-lock risk if a player cannot reach/damage the boss — tracked in `docs/RISK_ANALYSIS.md` Section 2.3, with a documented fallback (reintroducing a timer as a hybrid) if playtesting shows it's a real problem.

**Dependencies:** `docs/GDD.md` Section 6 (wave system), Section 7 (boss design); `docs/DATA_MODEL.md` Section 2.3 (`WaveDefinition`); `docs/API_REFERENCE.md` Section 2.1 (`WaveSystem`), 2.2 (`SpawnSystem`).

---

## 4. Feature: Weapon System

**Priority:** P0

**Description:** The player fights using one or more weapons from the roster in `docs/GDD.md` Section 4, each with distinct behavior (hitscan, projectile, cone AoE, explosive AoE).

**Acceptance criteria:**
- [ ] Player starts every run with exactly the `isStartingWeapon: true` weapon from `weapons.config.ts` (`docs/DATA_MODEL.md` Section 2.1).
- [ ] Each weapon type (`hitscan`, `projectile`, `cone_aoe`, `explosive_aoe`) behaves distinctly per its `weaponType`, matching the design role described in `docs/GDD.md` Section 4's table.
- [ ] Weapon damage/fire-rate/range are read entirely from `WeaponConfig` — no hardcoded per-weapon values in game logic (per `docs/ARCHITECTURE.md` Section 5's data-driven principle).
- [ ] Player can hold up to the max weapons value from `docs/GDD.md` Section 3 simultaneously, each firing independently (auto-fire, per Section 8 of this document).
- [ ] Weapon damage resolution goes through `CombatSystem.resolveHit()` (`docs/API_REFERENCE.md` Section 2.4), applying `RunState.player.damageMultiplier`.

**Edge cases:**
- Player at max weapons held and offered a "new weapon" upgrade: per `docs/DATA_MODEL.md` Section 2.4, `UpgradeSystem` should filter this option out entirely rather than offering it and having it fail/do nothing on selection.
- `explosive_aoe` weapon (EMP Launcher) fired at very close range: player takes ~50% (reduced) splash damage if caught in the blast radius — locked per `docs/DECISIONS.md` Decision #012. `CombatSystem` must apply a distinct, lower multiplier to the player than to enemies for this weapon specifically.

**Dependencies:** `docs/GDD.md` Section 4 (weapon roster); `docs/DATA_MODEL.md` Section 2.1 (`WeaponConfig`); `docs/API_REFERENCE.md` Section 2.4 (`CombatSystem`).

---

## 5. Feature: Upgrade System

**Priority:** P0

**Description:** After every wave clear, the player chooses 1 of 3 offered upgrades, driving build variety across a run.

**Acceptance criteria:**
- [ ] Exactly 3 upgrade choices are presented after every non-boss wave clear, sourced from `UpgradeSystem.getUpgradeChoices()` (`docs/API_REFERENCE.md` Section 2.3).
- [ ] Boss wave clears grant a **guaranteed** upgrade choice in addition to (or replacing, per `docs/GDD.md` Section 7 — "grants a guaranteed upgrade choice") the normal offer, making boss waves feel more rewarding.
- [ ] Ineligible upgrades are filtered out before presentation (max-weapons-held blocking `new_weapon`; owning-zero-of-a-weapon blocking `weapon_level` for that weapon) — player should never see an upgrade option that would do nothing if picked.
- [ ] Selecting an upgrade updates `RunState` via `UpgradeSystem.applyUpgrade()` and the effect is visible/felt immediately in the next wave (e.g., a damage boost applies to the very next shot fired).
- [ ] Upgrade choice screen pauses wave/enemy activity while the player decides (no time pressure on this decision, since it's a build-defining moment, not a reflex moment).

**Edge cases:**
- Fewer than 3 eligible upgrades exist (e.g., player owns every weapon at max level and has taken every stat boost — unlikely in V1's small roster, but possible late in a very long run): system should offer as many as are eligible rather than crashing or duplicating identical options; if this is reachable, flag it as a real V1 edge case rather than a "won't happen" assumption, since `docs/GDD.md`'s difficulty curve (Section 9) explicitly anticipates runs reaching wave 20+.

**Dependencies:** `docs/GDD.md` Section 8 (upgrade system); `docs/DATA_MODEL.md` Section 2.4 (`UpgradeConfig`); `docs/API_REFERENCE.md` Section 2.3 (`UpgradeSystem`).

---

## 6. Feature: Boss Encounters

**Priority:** P0

**Description:** Every 5th wave features a scaling Boss Unit ("Warden Unit," per `docs/GDD.md` Section 7) with a readable two-phase attack pattern.

**Acceptance criteria:**
- [ ] Boss spawns with HP scaled per `EnemyConfig.bossScaling.hpMultiplierPerAppearance` based on how many times this boss id has appeared in the run so far (`docs/API_REFERENCE.md` Section 2.2 `spawnBoss()`).
- [ ] Boss alternates between its two attack patterns (`bossScaling.attackPattern`, e.g. `["melee_slam", "ranged_burst"]`) in a readable, telegraphed way — per `docs/GDD.md` Section 7's design intent that this be a "readable pattern to learn and counter," not a random-feeling damage check.
- [ ] Boss death immediately ends the boss wave (see edge case flagged in Section 3 of this document — pending human confirmation).
- [ ] A visually/audibly distinct indicator marks the boss as a boss (HP bar, name, entrance effect) — a boss should never be mistakable for a regular enemy at a glance.

**Edge cases:**
- First-ever boss appearance (wave 5) vs. a much-later appearance (wave 30, its 6th appearance): HP scaling compounds per `docs/GDD.md` Section 7 ("~+50% at each subsequent boss wave") — confirm this compounds multiplicatively (300 → 450 → 675 → ...) rather than additively (300 → 450 → 600 → ...), since `docs/GDD.md` says "multiplicatively" in Section 7 but this should be double-checked against `docs/DATA_MODEL.md`'s field name (`hpMultiplierPerAppearance`, which implies multiplicative) before implementation to avoid a silent mismatch.

**Dependencies:** `docs/GDD.md` Section 7 (boss design); `docs/DATA_MODEL.md` Section 2.2 (`bossScaling`); `docs/API_REFERENCE.md` Section 2.2 (`spawnBoss()`).

---

## 7. Feature: Death / Run-End State

**Priority:** P0

**Description:** When player HP reaches 0, the run ends immediately and a results screen shows performance summary.

**Acceptance criteria:**
- [ ] Player HP reaching 0 immediately halts all gameplay systems (wave timer, spawning, input) — no lingering enemy attacks or spawns after death.
- [ ] Run-end screen displays, at minimum: waves survived, kills, time survived, and final score — sourced directly from `RunState` (`docs/DATA_MODEL.md` Section 3), which is explicitly designed to contain "everything that screen needs... without the UI layer reaching back into other systems" (`docs/DATA_MODEL.md` Section 3).
- [ ] Run-end screen shows the player's own score **even if** the leaderboard submission fails or is still in flight (`docs/ARCHITECTURE.md` Section 6 failure handling; `docs/API_REFERENCE.md` Section 5 error handling conventions) — the player's own result is never gated on network success.
- [ ] From the run-end screen, the player can start a new run in one tap/click (supports the "one more run" retention loop from `docs/PRD.md` Section 1).

**Edge cases:**
- Player dies at the exact moment a wave timer expires or a boss dies: death takes priority — no upgrade-choice screen or wave-clear state should appear after death, even if triggered in the same frame.
- Leaderboard submission is slow (not failed, just slow): run-end screen must not block/spinner-wait on it — show the score immediately, submission happens in the background per `docs/API_REFERENCE.md` Section 3.1's async, non-blocking `submitScore()`.

**Dependencies:** `docs/DATA_MODEL.md` Section 3 (`RunState`); `docs/API_REFERENCE.md` Section 3.1 (`LeaderboardService`), Section 5 (error handling).

---

## 8. Feature: Score & Leaderboard

**Priority:** P0

**Description:** Runs produce a score, submitted to a global leaderboard (Supabase-backed, anonymous device identity per `docs/DECISIONS.md` Decision #002), with graceful offline/failure handling.

**Acceptance criteria:**
- [ ] Score calculation (waves survived + kills + time, per `docs/PRD.md` Section 5 P0 list) is computed and stored in `RunState.score` throughout the run, not just at the end.
- [ ] On run end, `LeaderboardService.submitScore()` is called with `deviceId` (from `StorageService.getOrCreateDeviceId()`), a player-entered `displayName`, `score`, and `waveReached`.
- [ ] Player is prompted for a display name — validated client-side to match the Supabase check constraint (`docs/DATA_MODEL.md` Section 5: 1–20 characters) before submission is attempted.
- [ ] Leaderboard view calls `LeaderboardService.getTopScores()` and renders either the entries or an "couldn't load leaderboard" state based on the returned `status` field — never a raw error or blank screen.
- [ ] On next app launch, `LeaderboardService.retryPendingSubmission()` is called once, attempting to flush any `np_pending_score_submission` left from a previous failed attempt.

**Edge cases:**
- Player enters a display name with leading/trailing whitespace or exceeding 20 characters: client-side validation/trimming must happen before hitting the Supabase check constraint, so the player gets an immediate, friendly correction rather than a failed network call.
- Player submits two runs in a row before the first submission's retry logic resolves: `StorageService` must compare scores before overwriting `np_pending_score_submission` and keep whichever is higher (most recent wins on a tie) — never a blind last-write-wins overwrite, per `docs/DECISIONS.md` Decision #013.

**Dependencies:** `docs/DATA_MODEL.md` Sections 4–5; `docs/API_REFERENCE.md` Section 3.1 (`LeaderboardService`), Section 4 (Supabase contract); `docs/DECISIONS.md` Decisions #002, #013.

---

## 9. Feature: Basic UI

**Priority:** P0

**Description:** Minimum viable UI surface: main menu, in-run HUD, pause, settings (at least audio), run-end screen, leaderboard view.

**Acceptance criteria:**
- [ ] **Main menu:** Start Run, Leaderboard, Settings entry points, all reachable within one tap/click from launch.
- [ ] **In-run HUD:** current HP, current wave number, current score, all updating live without noticeable lag (ties to Section 2's performance requirement).
- [ ] **Pause:** available on desktop (key press) and mobile (UI button); pausing stops the wave timer and all entity movement/spawning; does not count against the player.
- [ ] **Settings:** at minimum, master/SFX/music volume sliders persisted via `StorageService` (`np_settings`, `docs/DATA_MODEL.md` Section 4).
- [ ] **Run-end screen:** per Section 7 of this document.
- [ ] **Leaderboard view:** per Section 8 of this document, reachable from main menu and from the run-end screen.
- [ ] All UI screens are usable at common mobile viewport widths (no element requiring a viewport wider than a typical phone screen) per the mobile-responsive requirement in `docs/PRD.md` Section 5 P0 list.

**Edge cases:**
- Player pauses mid-boss-attack-telegraph: the telegraphed attack must resume correctly on unpause, not skip or double-fire — pause must genuinely freeze all system clocks (`WaveSystem` timer, `CombatSystem` cooldowns), not just hide the screen.

**Dependencies:** All other P0 features (this is the presentation layer over them); `docs/DATA_MODEL.md` Section 4 (`np_settings`).

---

## 10. Feature: Mobile-Responsive Controls (V1.1 Scope — Deferred per Decision #019)

**Priority:** P1 (Deferred to V1.1)

**Description:** Touch controls (virtual joystick + auto-fire overlay) deferred to V1.1 per Decision #019. V1 is locked to Desktop Web (WASD movement + Mouse 360° Cursor Aiming + Auto-fire).

**Acceptance criteria:**
- [ ] On touch-capable devices, a virtual joystick (left side of screen, per `docs/GDD.md` Section 3) controls movement.
- [ ] Auto-fire targets the nearest or otherwise sensibly-targeted enemy on mobile — no second touch control required for aiming (per `docs/GDD.md` Section 3's stated mobile UX rationale).
- [ ] Desktop input (WASD/arrows + mouse) and mobile input (joystick + auto-fire) are both fully functional without a build-time platform flag — input method should be detected/adaptive, not a separate build.
- [ ] Touch targets (buttons, joystick zone) meet a reasonable minimum size for thumb interaction — no UI element requiring precision smaller than a typical adult thumb can reliably hit.

**Edge cases:**
- Device with both touch and mouse/keyboard available (e.g., touchscreen laptop): input method should follow whichever the player is actually using in the moment, not lock to whichever was detected first at launch, if reasonably feasible — flag as a nice-to-have refinement if it proves complex, not a P0 blocker in itself.
- **Desktop fire mode:** auto-fire only, matching mobile — locked per `docs/DECISIONS.md` Decision #014. No click-to-fire, no control-scheme toggle in Settings; `np_settings` has no `controlScheme` field (`docs/DATA_MODEL.md` Section 4).

**Dependencies:** `docs/GDD.md` Section 3 (controls); `docs/DECISIONS.md` Decision #014.

---

## 11. Feature: Basic Audio (P1)

**Priority:** P1 — desired, not a launch blocker.

**Description:** SFX for core actions (shooting, hits, upgrades, death) and background music, even if placeholder-quality at launch.

**Acceptance criteria:**
- [ ] SFX plays for: weapon fire (per weapon type — distinct sounds are a nice-to-have, not required for P1), enemy hit, enemy death, player hit, upgrade selection, boss spawn, run end.
- [ ] Background music plays during gameplay, distinct (even if subtly) during boss waves to reinforce the tension spike.
- [ ] All audio respects the volume settings from Section 9 (Basic UI) — muting one channel doesn't affect others.

**Edge cases:**
- Very high enemy-death frequency (large wave clears): overlapping SFX shouldn't create audio distortion/clipping — some form of sound-instance capping or pooling is expected, exact approach is an implementation detail.

**Dependencies:** `docs/DATA_MODEL.md` Section 4 (`np_settings` volume fields).

---

## 12. Feature: Visual Feedback / Juice (P1)

**Priority:** P1 — desired, not a launch blocker, but flagged in `docs/PRD.md` Section 5 as important to the cyberpunk genre feel.

**Description:** Hit flashes, screen shake, and similar feedback effects that make combat feel impactful.

**Acceptance criteria:**
- [ ] Enemies flash/react visibly on taking damage.
- [ ] Boss attacks (melee slam especially, per `docs/GDD.md` Section 7) have a clear telegraph and impact effect, reinforcing the "readable pattern" design goal from Section 6 of this document.
- [ ] Screen shake (or equivalent feedback) on significant events (boss slam landing, player taking heavy damage) — intensity tunable/capped so it doesn't impair readability at high entity counts.

**Edge cases:**
- Accessibility: screen shake should be toggleable off in Settings for players sensitive to it — not explicitly required by `docs/PRD.md` but a reasonable minimum bar; flagging as a recommended addition to Section 9's settings scope rather than assuming it's out of scope entirely.

**Dependencies:** Section 9 (Basic UI, for the settings toggle suggested above).

---

## 13. Feature: Settings Persistence (P1)

**Priority:** P1

**Description:** Volume and control settings persist across sessions via `localStorage`.

**Acceptance criteria:**
- [ ] Settings changes are written to `np_settings` immediately on change (not just on app close), so a crash/refresh doesn't lose them.
- [ ] On launch, settings are read via `StorageService.get("np_settings")`; if `null` (first launch or corrupted data), sensible defaults are applied rather than erroring.

**Edge cases:**
- Corrupted/partial `np_settings` object (e.g., missing `musicVolume` after a future schema addition): per `docs/DATA_MODEL.md` Section 6, this should be handled defensively (missing fields default rather than crash), not assumed to always be well-formed.

**Dependencies:** `docs/DATA_MODEL.md` Section 4 (`np_settings`), Section 6 (migration notes).

---

## 14. Out of Scope for This Document (V2+ Features — Noted for Traceability Only)

Per `AGENT.md` Section 2, Rule 7 — not specified here, belongs to future version-scope docs when written:

- **V2:** Dynamic weapon forge UI/UX, procedural wave indicators, AI Director-driven difficulty feedback — `docs/versions/v2_AI_FEATURES.md`.
- **V3:** Campaign chapter select UI, codex/lore screen, chapter-specific boss encounters — `docs/versions/v3_CAMPAIGN.md`.
- **V4:** Multiplayer lobby/matchmaking UI, co-op HUD adjustments, social/friends UI — `docs/versions/v4_PLATFORM.md`.

---

## 15. Summary of Open Items Raised in This Document

The four open items originally raised here (boss-wave end condition, EMP self-damage, leaderboard collision handling, desktop fire mode) are all resolved — see `docs/DECISIONS.md` Decisions #011–#014, and Sections 3, 4, 8, and 10 above, which have been updated to reflect the locked behavior rather than flag it as open.

No open items remain from this document specifically. For open items raised elsewhere in the doc kit (tutorial/FTUE, screen orientation, bug tracking tool, boss-wave upgrade-choice presentation, display-name persistence), see `.ai/context.md`'s "Open Items Awaiting Human Decision" list, which is the current single source of truth for outstanding decisions across the whole kit.
