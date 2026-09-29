# API_REFERENCE.md — Internal & External API Specifications

> Technical specification of internal game system contracts and external API integration endpoints.

---

## 1. Internal EventBus API

The internal game systems communicate using a typed Phaser EventBus singleton (`@/systems/EventBus.ts`).

### Core Events

```typescript
export type GameEvents = {
  'player:damaged': { currentHp: number; maxHp: number; damage: number };
  'player:died': { finalScore: number; waveSurvived: number; kills: number };
  'wave:started': { waveNumber: number; totalEnemies: number };
  'wave:cleared': { waveNumber: number };
  'upgrade:selected': { upgradeId: string };
  'score:updated': { currentScore: number; multiplier: number };
};
```

---

## 2. Internal System Contracts

### `GameStateManager`
Manages active run data and global player stats.
```typescript
export interface IGameStateManager {
  getScore(): number;
  addScore(points: number): void;
  getCurrentWave(): number;
  nextWave(): void;
  resetRun(): void;
  getRunStats(): RunStatsPayload;
}
```

### `WaveManager`
Controls wave spawning timing and enemy pool generation.
```typescript
export interface IWaveManager {
  startWave(waveNum: number): void;
  onEnemyKilled(enemyId: string): void;
  isWaveComplete(): boolean;
}
```

---

## 3. External API — Supabase Leaderboard (V1)

Leaderboard services interface with Supabase REST API using an anonymous `device_id`.

### Endpoints

#### `POST /rest/v1/scores`
Submits a completed run score.

**Headers:**
- `apikey`: `<SUPABASE_ANON_KEY>`
- `Content-Type`: `application/json`

**Body Payload:**
```json
{
  "device_id": "anon-uuid-v4-string",
  "display_name": "CyberSamurai",
  "score": 45200,
  "wave": 14,
  "kills": 382,
  "survival_time_seconds": 412
}
```

#### `GET /rest/v1/scores?select=*&order=score.desc&limit=50`
Retrieves top 50 high scores for global leaderboard view.

---

## 4. External API — Groq LLM Generation (V2 Scope)

For V2 dynamic weapon, mutator, and enemy profile generation:

#### `POST https://api.groq.com/openai/v1/chat/completions`
**Model:** `llama-3.3-70b-versatile`
**Timeout:** `3000ms` strict cap

**Request Payload:**
```json
{
  "model": "llama-3.3-70b-versatile",
  "messages": [
    {
      "role": "system",
      "content": "You are an AI weapon designer for a cyberpunk top-down shooter. Respond ONLY with valid JSON adhering strictly to the requested schema. Do not include markdown code block formatting."
    },
    {
      "role": "user",
      "content": "Generate a unique rare tier energy weapon."
    }
  ],
  "temperature": 0.7,
  "response_format": { "type": "json_object" }
}
```

#### TypeScript Schema Contract (`AIGeneratedWeapon`)

```typescript
export interface AIGeneratedWeapon {
  /** Unique ID slug prefixed with ai_ (e.g., "ai_void_lance") */
  id: string;
  /** Display name in cyberpunk aesthetic */
  displayName: string;
  /** 1-2 sentence flavor lore text */
  lore: string;
  /** Archetype firing behavior */
  weaponType: "hitscan" | "projectile" | "cone_aoe" | "explosive_aoe";
  /** Raw base damage before clamping layer */
  baseDamage: number;
  /** Firing delay in milliseconds between shots */
  fireRate: number;
  /** Projectile travel velocity in pixels/sec */
  projectileSpeed: number;
  /** Hex color string for visual render FX */
  projectileColor: string;
  /** Provenance metadata flag */
  generatedBy: "ai";
  provenance: {
    model: string;
    promptVersion: string;
    generatedAt: string; // ISO 8601 timestamp
  };
}
```

#### Stat Clamping Boundary Ranges (Validation Pipeline)

To protect balance and avoid LLM stat hallucinations, raw outputs from Groq must be passed through the engine's clamping sanitizer:

| Field | Minimum Clamped Bound | Maximum Clamped Bound | Default Fallback |
|---|---|---|---|
| `baseDamage` | `10` | `150` | `35` |
| `fireRate` | `100ms` | `2000ms` | `350ms` |
| `projectileSpeed` | `300 px/s` | `1400 px/s` | `600 px/s` |
| `projectileColor` | Valid hex string | Checked against `ART_STYLE_GUIDE.md` | `#00F0FF` (Cyan) |

