# v2_AI_FEATURES.md — Version 2 Scope Specification (AI, PWA & Mobile Touch)

> **Target Goal:** Elevate the V1 core survival loop using Groq LLM API for dynamic dynamic weapons and wave mutators, robust PWA (Progressive Web App) offline caching, and enhanced tactile mobile touch controls.

---

## 1. Feature Pillars & Detailed Specs

### Pillar A: PWA & Service Worker Caching Strategy
- **Web App Manifest (`manifest.json`):** Full app metadata, cyberpunk app icons (192px, 512px, maskable), theme color (`#0D0F18`), background color (`#05060A`), and `orientation: landscape`.
- **Caching & Hydration Strategy:**
  - **Cache-First (Cache falling back to Network):** Core Phaser engine bundle (`phaser.min.js`), static game HTML/CSS, sprite atlas textures, and Web Audio SFX files. Ensures 100% offline playability.
  - **Network-First (Network falling back to Local Cache):** Groq LLM dynamic weapon/mutator generations and Supabase leaderboard queries.
  - **Stale-While-Revalidate:** Static config JSON datasets (`enemies.config.ts`, default entity rosters).
- **Service Worker Lifecycle & Cache Busting:**
  - Dynamic cache versioning key: `neon-protocol-v{BUILD_VERSION}`.
  - `activate` event immediately purges stale cache buckets from previous build hashes.
  - Trigger client `SKIP_WAITING` prompt when new Service Worker installation finishes.
- **"Add to Home Screen" Prompt:** Custom UI banner wrapping native browser `beforeinstallprompt` event on Mobile Web (Safari iOS & Android Chrome).

### Pillar B: Enhanced Mobile Touch Controls
- **V1 Baseline Recap:** V1 provided standard virtual dual joysticks (movement + directional aiming).
- **V2 Enhancements:**
  - **Haptic Feedback Integration:** Web Vibration API triggers short tactical pulses (e.g. 15ms tap on dash, 40ms buzz on heavy weapon fire/damage taken).
  - **Customizable Control Layout:** Ergonomic repositioning, joystick sensitivity slider, and touch zone deadzone configuration persisted in `LocalStorage`.
  - **Tactile Dash & Weapon Switch Buttons:** Dedicated touch target overlays with visual CD (cooldown) radial sweep overlays.
  - **Dynamic Aim Lock Assist:** Optional subtle auto-aim magnetizing toward nearest enemy cluster within 15° cone when right joystick is active.

### Pillar C: Groq LLM AI Dynamic Content Generation
- **Procedurally Generated AI Weapons:**
  - Groq LLM API generates flavor text (name, lore), visual accent colors, and base attributes.
- **Dynamic Wave Mutators:**
  - LLM generates procedural wave events (e.g. *"Solar Flare: Enemy speed +25%, visibility radius -40%"*).
- **Adaptive Nemesis System Lite:**
  - Client sends telemetry summary (favorite weapon type, damage dealt ratio) to Groq; API returns tailored boss mutator profiles for upcoming boss waves.

---

## 2. Groq LLM Failure & Fallback Matrix

To guarantee that network latencies, API outages, or invalid AI outputs **never** break the gameplay loop or block run progression, the following multi-tiered fallback matrix is strictly enforced:

| Failure Scenario | Detection Trigger | Recovery / Fallback Action | Impact on Player Experience |
|---|---|---|---|
| **Network Timeout** | Groq API call exceeds **3000ms** | Abort `fetch` request; select pre-authored fallback entry from local `weapons.fallback.ts` pool | Zero frame drop; immediate fallback weapon presented |
| **HTTP Error / API Outage** | Status code `4xx`, `5xx`, or connection error | Switch system to **Offline AI Mode**; draw exclusively from local procedural cache and pre-authored pools | Graceful degradation to offline content pool |
| **Rate Limit Exceeded** | HTTP `429 Too Many Requests` | Throttle remote requests for 10 minutes; serve cached generations from `IndexedDB` / LocalStorage | Seamless transition to cached AI items |
| **Invalid / Malformed JSON** | `JSON.parse()` exception or Zod / TypeScript schema validation failure | Log error to dev console; retry prompt once with strict temperature (0.1). If retry fails, use local fallback item | Zero crash risk; safe fallback item selected |
| **Unbalanced Generated Stats** | Values outside clamped bounds (e.g. `baseDamage > 150`) | Pass raw JSON through **Stat Clamping Layer** before instantiating entity | Balanced gameplay maintained regardless of LLM output |

---

## 3. AI-Generated Content Validation & Clamping Pipeline

All AI content passes through a strict deterministic pipeline prior to engine instantiation:

```
[ Groq LLM Response ]
         │
         ▼
 1. JSON Parse & Structure Validation
         ├─► [ Fail ] ──► Load Pre-authored Fallback Object
         ▼
 2. Schema Type Check (AIGeneratedWeapon interface)
         ├─► [ Fail ] ──► Load Pre-authored Fallback Object
         ▼
 3. Stat Clamping Layer (Sanitizes numeric ranges)
         ├─► Clamps baseDamage  --> [10, 150]
         ├─► Clamps fireRate    --> [100ms, 2000ms]
         ├─► Clamps projectileSpeed --> [300, 1200]
         ▼
 4. Color Palette Sanitizer
         ├─► Validates projectileColor against ART_STYLE_GUIDE palette
         └─► Fallback to fallback hex (#00F0FF) if invalid
         ▼
 5. Cache & Instantiate
         ├─► Persist safe object to local generation cache (IndexedDB)
         └─► Feed as dynamic config into Weapon class
```

---

## 4. Decision Log References

- **Decision #015:** Groq LLM Integration Strategy & Fallback Architecture
- **Decision #016:** Deterministic Validation & Stat Clamping Layer for Procedural Content
- **Decision #017:** PWA Caching Policies, Service Worker Lifecycle & Cache Busting
- **Decision #018:** Enhanced Touch Controls Architecture & Haptic Feedback Integration

