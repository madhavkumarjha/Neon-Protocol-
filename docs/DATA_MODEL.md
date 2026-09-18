# DATA_MODEL.md — Data Schemas

> This document defines the **exact shape of every piece of data** Neon Protocol reads, writes, or persists — config files, runtime entity state, localStorage, and the Supabase leaderboard schema. It implements `docs/ARCHITECTURE.md` Section 5 (data-driven entities) and Section 6 (leaderboard/auth), and mirrors the value tables in `docs/GDD.md` Sections 4–6. If a field isn't defined here, an AI agent should not invent its shape silently — add it here first (per `AGENT.md` Section 2, Rule 3).

---

## 1. Purpose & Scope

Three categories of data exist in this project, and each has different rules:

| Category | Lives where | Mutable at runtime? | Source of truth for values |
|---|---|---|---|
| **Config data** | `src/config/*.config.ts` | No — read-only at runtime | `docs/GDD.md` (design intent) |
| **Runtime state** | In-memory only (Phaser scene / `GameStateManager`) | Yes — changes every frame/wave | This document (shape only, not values) |
| **Persisted data** | `localStorage` + Supabase | Yes — written on specific events | This document |

This document covers **shape** (TypeScript interfaces / schema), not gameplay balance numbers — those live in `docs/GDD.md` and should stay there so there's one place to tune numbers without touching type definitions.

---

## 2. Config Data (Static, Versioned in Source Control)

Per `docs/ARCHITECTURE.md` Section 5, entities are data-driven — one class per entity type, many config objects. These interfaces are what `entities/Enemy.ts`, `entities/Weapon.ts`, and `systems/WaveSystem.ts` consume.

### 2.1 Weapon Config

```typescript
interface WeaponConfig {
  id: string;               // stable identifier, e.g. "pulse_pistol" — never reused, never renamed after ship
  displayName: string;      // e.g. "Pulse Pistol"
  weaponType: "hitscan" | "projectile" | "cone_aoe" | "explosive_aoe";
  baseDamage: number;       // single-target/base value; interpretation depends on weaponType
  pelletsPerShot?: number;  // only for cone_aoe (e.g. Arc Shotgun's 5 pellets — see docs/GDD.md Section 4)
  fireRate: number;         // shots per second
  range: "short" | "short-medium" | "medium" | "medium-long" | "long";
  isStartingWeapon: boolean;
  maxLevel: number;         // how many times this weapon can be leveled up via UpgradeSystem
  levelScaling: {
    damagePerLevel: number;
    fireRatePerLevel: number;
    rangeIncreasePerLevel?: number;
  };
}
```

**Note:** `range` is an enum, not a raw number, at the config level — actual pixel/unit range values are an implementation detail resolved once arena dimensions are locked (`docs/GDD.md` Section 2 flags this as pending `docs/ARCHITECTURE.md`/implementation). Do not hardcode pixel ranges into this config; keep a lookup table in `systems/CombatSystem.ts` instead, so arena re-tuning doesn't require touching weapon data.

### 2.2 Enemy Config

```typescript
interface EnemyConfig {
  id: string;                 // e.g. "drone_swarmer" — stable, never reused
  displayName: string;
  maxHp: number;
  moveSpeed: "stationary" | "slow" | "medium" | "fast";
  contactDamage?: number;     // present if the enemy deals damage on contact
  rangedDamage?: number;      // present if the enemy attacks at range (e.g. Sniper Turret)
  behavior: "chase" | "hold_and_fire" | "swarm";
  isBoss: boolean;
  bossScaling?: {             // only present if isBoss = true
    hpMultiplierPerAppearance: number;  // e.g. 1.5 for the ~50% scaling in docs/GDD.md Section 7
    attackPattern: string[];  // ordered list of attack-pattern identifiers, e.g. ["melee_slam", "ranged_burst"]
  };
}
```

### 2.3 Wave Config

```typescript
interface WaveDefinition {
  waveNumber: number;
  isBossWave: boolean;
  enemyComposition: {
    enemyId: string;   // must match an EnemyConfig.id
    count: number;
  }[];
  clearCondition:
    | { type: "timer"; durationSeconds: number }       // non-boss waves — docs/DECISIONS.md Decision #003
    | { type: "boss_death" };                           // boss waves only (isBossWave: true) — docs/DECISIONS.md Decision #011
}
```

**Note:** `clearCondition.type` is a closed union of exactly two variants, each tied to a specific wave kind:
- `"timer"` — used for all non-boss waves, locked per `docs/DECISIONS.md` Decision #003. Do not add `"kill_quota"` speculatively; if playtesting reverses this decision, that's a `docs/DECISIONS.md`-logged change, and this schema gets updated at the same time, not ahead of it.
- `"boss_death"` — used exclusively for boss waves (`isBossWave: true`), per `docs/DECISIONS.md` Decision #011. No `durationSeconds` applies — there is no timer running during a boss wave at all; `WaveSystem` ends the wave solely via a boss-death listener.

A `WaveDefinition` with `isBossWave: true` must use `{ type: "boss_death" }`; a `WaveDefinition` with `isBossWave: false` must use `{ type: "timer", durationSeconds }`. This pairing should be validated (per `docs/ARCHITECTURE.md` Section 11's config-validation testing note) rather than assumed.

Waves beyond the explicitly-authored roster (per `docs/GDD.md` Section 6, "Beyond wave 20+, scaling becomes count/HP/multiplier based") are **generated procedurally from the last authored `WaveDefinition`**, not hand-authored forever — exact generation formula is an implementation detail for `systems/WaveSystem.ts`, not a data schema concern.

### 2.4 Upgrade Config

```typescript
interface UpgradeConfig {
  id: string;
  category: "weapon_level" | "new_weapon" | "stat_boost";
  displayName: string;
  description: string;
  // For category = "weapon_level": which weapon this levels up (resolved at offer-time, not fixed here)
  // For category = "new_weapon": which weaponId this grants
  // For category = "stat_boost": which stat + magnitude
  targetWeaponId?: string;
  statType?: "max_hp" | "move_speed" | "damage_multiplier" | "pickup_radius";
  magnitude?: number;
}
```

**Eligibility filtering** (don't offer a new weapon at max weapons held, don't offer to level a weapon the player lacks — per `docs/GDD.md` Section 8) is `UpgradeSystem` logic, not part of this data shape.

---

## 3. Runtime State (In-Memory Only — Not Persisted)

Defines the shape `GameStateManager` (per `docs/ARCHITECTURE.md` Section 8) holds during a run. This resets completely on death — none of it is saved.

```typescript
interface RunState {
  currentWave: number;
  elapsedTimeSeconds: number;
  player: {
    currentHp: number;
    maxHp: number;              // base + stat_boost upgrades applied
    moveSpeed: number;
    damageMultiplier: number;
    ownedWeapons: {
      weaponId: string;
      currentLevel: number;
    }[];
  };
  score: number;
  kills: number;
}
```

`RunState` is the single object passed to the run-end screen (`docs/GDD.md` Section 1) — it should contain everything that screen needs to display (waves survived, kills, time, score) without the UI layer reaching back into other systems.

---

## 4. Persisted Data — localStorage (Client-Side, Per-Device)

Per `docs/ARCHITECTURE.md` Section 6 and Section 8, `services/StorageService.ts` is the only module allowed to read/write these keys directly.

```typescript
interface LocalStorageSchema {
  "np_device_id": string;          // UUID, generated once on first launch, never regenerated
  "np_settings": {
    masterVolume: number;          // 0.0–1.0
    sfxVolume: number;
    musicVolume: number;
    // NOTE: no controlScheme field — V1 desktop is auto-fire only, per
    // docs/DECISIONS.md Decision #014. The field was removed rather than
    // kept optional-and-unused; re-add if click-to-fire ships in V1.1+/V2.
  };
  "np_last_score_cache": {
    score: number;
    waveReached: number;
    timestamp: string;             // ISO 8601
  } | null;
  "np_pending_score_submission": {  // queued retry — see docs/ARCHITECTURE.md Section 6 failure handling
    deviceId: string;
    displayName: string;
    score: number;
    waveReached: number;
    createdAt: string;
  } | null;
}
```

**Collision rule for `np_pending_score_submission`:** per `docs/DECISIONS.md` Decision #013, if a new failed submission would overwrite an existing queued one, `StorageService` must compare scores first and **keep whichever is higher** (most recent wins on a tie) — never a blind last-write-wins overwrite.

**Rules:**
- Key names are prefixed `np_` to avoid collisions with any third-party script sharing the same origin.
- `np_pending_score_submission` is cleared only on confirmed successful submission — a failed retry leaves it in place for the next launch attempt.
- No gameplay balance data (weapon levels, upgrade choices, etc.) is ever persisted here — per Section 3, that's run-scoped and intentionally lost on death. V1 has no "meta-progression" system; if one gets added later, that's a new `docs/DECISIONS.md` entry and a schema addition here, not an assumption.

---

## 5. Persisted Data — Supabase (`scores` table)

Implements `docs/ARCHITECTURE.md` Section 6.

```sql
create table scores (
  id           uuid primary key default gen_random_uuid(),
  device_id    uuid not null,
  display_name text not null check (char_length(display_name) between 1 and 20),
  score        integer not null check (score >= 0),
  wave_reached integer not null check (wave_reached >= 0),
  created_at   timestamptz not null default now()
);

-- Row-level security: insert-only from the client, no update/delete
alter table scores enable row level security;

create policy "anyone can insert their own score"
  on scores for insert
  with check (true);

create policy "anyone can read scores"
  on scores for select
  using (true);

-- No update or delete policy is defined — this makes those operations
-- impossible from the client by default (RLS denies anything without
-- an explicit policy), which enforces the append-only leaderboard model.
```

**Notes:**
- `device_id` is **not** a foreign key to any `users`/`auth` table — per `docs/ARCHITECTURE.md` Section 6, there is no account system in V1. It's a plain UUID column used only to let a device recognize/update its own display name in future versions if needed.
- No `updated_at` — rows are immutable once inserted, matching the insert-only RLS policy.
- Leaderboard *queries* (top N, "my rank") are plain `select` calls with `order by score desc limit N` — no stored procedures needed for V1's simple query pattern.

---

## 6. Versioning & Migration Notes

- **Config data (Section 2):** Since `id` fields are stable strings (not array indices), reordering entries in a config file is always safe. **Renaming or removing an `id` that's referenced elsewhere (e.g., in a `WaveDefinition.enemyComposition`) is a breaking change** — grep for the id across all config files before renaming one.
- **localStorage (Section 4):** No formal migration system in V1 (not worth the complexity for a handful of keys). If a key's shape changes, `StorageService` should defensively handle a missing/malformed value (treat as "not set") rather than throwing — never assume a returning player's localStorage matches the latest schema exactly.
- **Supabase (Section 5):** Schema changes after any real score data exists require a proper migration (Supabase migration file), not a manual table edit — this is a general good-practice note, not a V1-specific mechanism to build now.

---

## 7. Out of Scope for This Document (V2+ Data — Noted for Traceability Only)

Per `AGENT.md` Section 2, Rule 7:

- **V2:** Shape of AI-generated (Groq) weapon variants — will likely extend `WeaponConfig` with a `generatedBy: "ai"` flag and provenance metadata, but the exact shape is deferred to `docs/versions/v2_AI_FEATURES.md` and `docs/API_REFERENCE.md` (neither written yet). Do not add speculative AI-related fields to `WeaponConfig` now.
- **V3:** Codex/lore entry data shape, campaign chapter/progress save data — deferred to `docs/versions/v3_CAMPAIGN.md`. Note: this will be the **first** persisted meta-progression data in the project (campaign progress must survive between sessions) — a bigger localStorage/backend decision than anything in V1, and should get its own `docs/DECISIONS.md` entry when designed.
- **V4:** Real account system replacing `device_id`-only identity, multiplayer session/state sync shape, cross-platform save sync — deferred to `docs/versions/v4_PLATFORM.md`.

---

## 8. Summary of Decisions Made in This Document

For `docs/DECISIONS.md` logging (per `AGENT.md` Section 2, Rule 6) — these are schema-level commitments, not just restatements of earlier decisions:

1. Config entities are keyed by stable string `id`, never array index — locked to prevent silent breakage when reordering or when V2 adds AI-generated entries (`docs/DECISIONS.md` Decision #006).
2. `WaveDefinition.clearCondition.type` is a closed union of exactly two variants: `"timer"` for non-boss waves (`docs/DECISIONS.md` Decision #003) and `"boss_death"` for boss waves, which run no timer at all (`docs/DECISIONS.md` Decision #011). `"kill_quota"` remains intentionally not forward-declared.
3. No meta-progression / save data exists in V1 — `RunState` is fully ephemeral. First persisted meta-progression is expected in V3 (Campaign) — see `docs/versions/v3_CAMPAIGN.md` Section 4.
4. Supabase `scores` table is insert-only via RLS — no client-side update/delete capability, by design, not by omission (`docs/DECISIONS.md` Decision #002).
5. `np_pending_score_submission` uses a keep-highest-score collision rule, not last-write-wins, when a second failed submission would overwrite a queued one (`docs/DECISIONS.md` Decision #013).
6. `np_settings` has no `controlScheme` field — V1 desktop is auto-fire only, matching mobile, with no in-game toggle (`docs/DECISIONS.md` Decision #014).
