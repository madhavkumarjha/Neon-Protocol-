# v2_AI_FEATURES.md — Version 2 Scope Specification (Groq AI & Desktop Polish)

> **Target Goal:** Elevate the V1 core survival loop using Groq LLM API for dynamic weapons, procedural wave mutators, and Nemesis Lite boss encounters, plus desktop visual and audio polish (per Decision #020). Mobile touch controls and PWA (former Pillars A & B) have been dropped.

---

## 1. Feature Pillar: Groq LLM AI Dynamic Content Generation

### Procedurally Generated AI Weapons
- Groq LLM API generates weapon flavor text (name, lore), visual accent colors, archetype behavior, and base attributes.
- Integrated into the upgrade modal alongside standard upgrades when leveling up or clearing waves.

### Dynamic Wave Mutators
- LLM generates procedural wave events (e.g. *"Solar Flare: Enemy speed +25%, visibility radius -40%"*, *"Overload: +20% player damage, +20% enemy health"*).
- Applied at the start of selected waves with visual warning banners.

### Adaptive Nemesis System Lite
- Client sends run telemetry summary (favorite weapon, damage dealt ratio, waves cleared) to Groq.
- API returns tailored boss mutator profiles for upcoming boss waves (e.g. Wave 5, 10), dynamically countering player build tendencies.

---

## 2. Groq LLM Failure & Fallback Matrix

To guarantee that network latencies, API outages, or invalid AI outputs **never** break the gameplay loop or block run progression, the following multi-tiered fallback matrix is strictly enforced:

| Failure Scenario | Detection Trigger | Recovery / Fallback Action | Impact on Player Experience |
|---|---|---|---|
| **Network Timeout** | Groq API call exceeds **3000ms** | Abort `fetch` request; select pre-authored fallback entry from local `weapons.fallback.ts` pool | Zero frame drop; immediate fallback weapon presented |
| **HTTP Error / API Outage** | Status code `4xx`, `5xx`, or connection error | Switch system to **Offline AI Mode**; draw exclusively from local procedural cache and pre-authored pools | Graceful degradation to offline content pool |
| **Rate Limit Exceeded** | HTTP `429 Too Many Requests` | Throttle remote requests for 10 minutes; serve cached generations from LocalStorage / memory | Seamless transition to cached AI items |
| **Invalid / Malformed JSON** | `JSON.parse()` exception or TypeScript schema validation failure | Log error to dev console; retry prompt once with strict temperature (0.1). If retry fails, use local fallback item | Zero crash risk; safe fallback item selected |
| **Unbalanced Generated Stats** | Values outside clamped bounds (e.g. `baseDamage > 150`) | Pass raw JSON through **Stat Clamping Layer** before instantiating entity | Balanced gameplay maintained regardless of LLM output |

---

## 3. AI-Generated Content Validation & Clamping Pipeline

All AI content passes through a strict deterministic pipeline prior to engine instantiation:

```
[ Groq LLM Response / Proxy Response ]
                 │
                 ▼
 1. JSON Parse & Structure Validation
                 ├─► [ Fail ] ──► Load Pre-authored Fallback Object
                 ▼
 2. Schema Type Check (AIGeneratedWeapon / Mutator interface)
                 ├─► [ Fail ] ──► Load Pre-authored Fallback Object
                 ▼
 3. Stat Clamping Layer (Sanitizes numeric ranges)
                 ├─► Clamps baseDamage      --> [10, 150]
                 ├─► Clamps fireRate        --> [0.5, 10.0] rounds/sec
                 ├─► Clamps projectileSpeed --> [300, 1400] px/s
                 ▼
 4. Color Palette Sanitizer
                 ├─► Validates projectileColor against ART_STYLE_GUIDE palette
                 └─► Fallback to fallback hex (#00F0FF) if invalid
                 ▼
 5. Cache & Instantiate
                 ├─► Persist safe object to local generation cache (LocalStorage)
                 └─► Feed as dynamic config into Weapon class
```

---

## 4. Decision Log References

- **Decision #015:** Groq LLM Integration Strategy & Fallback Architecture
- **Decision #016:** Deterministic Validation & Stat Clamping Layer for Procedural Content
- **Decision #020:** Drop Mobile Scope Entirely; V2 Desktop-Only + Groq AI (supersedes #017, #018; amends #019)
