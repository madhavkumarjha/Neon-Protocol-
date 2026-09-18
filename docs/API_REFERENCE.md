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

For V2 dynamic weapon and modifier generation:

#### `POST https://api.groq.com/openai/v1/chat/completions`
**Model:** `llama-3.3-70b-versatile`

**Prompt Spec:** Returns JSON schema describing procedurally generated weapon stats (name, lore, damage, fireRate, projectileColor).
