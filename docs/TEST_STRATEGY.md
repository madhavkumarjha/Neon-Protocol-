# TEST_STRATEGY.md — Testing & Quality Assurance Strategy

> This document defines the testing methodology, tools, coverage targets, and execution guidelines for Neon Protocol.

---

## 1. Testing Stack & Strategy Overview

Neon Protocol uses a two-tier automated testing strategy:
1. **Unit & Integration Testing:** Vitest for rapid execution of non-visual game logic, wave formulas, entity calculations, and data managers.
2. **End-to-End (E2E) UI Testing:** Playwright for real browser automation, testing visual scene flow, user input, pause state, and high score submission.

```
       / \
      / E2E \       Playwright (Scene Flow, UI, Leaderboard)
     /-------\
    /   UNIT  \     Vitest (Wave Math, Stats, Upgrades, Configs)
   /-----------\
```

---

## 2. Unit Testing Strategy (Vitest)

### Scope
- **Game Math:** Damage formulas, critical hit calculations, distance/collision helpers.
- **Wave System:** Wave spawner timers, difficulty scaling curves, boss wave triggers.
- **Upgrade System:** Stat modifier calculations, stacking passive bonuses, weapon unlock conditions.
- **Data Serialization:** Save data encoding,Local Storage persistence, Supabase payload formatting.

### Directory Structure
```
tests/unit/
├── math.test.ts
├── waveManager.test.ts
├── upgradeSystem.test.ts
├── gameState.test.ts
└── leaderboard.test.ts
```

### Execution Command
```bash
npm run test:unit
```

---

## 3. End-to-End Testing Strategy (Playwright)

### Scope
- **Boot & Audio Unlock:** Verify initial click/tap transitions from Boot Scene to Main Menu.
- **Game Loop:** Verify player movement, weapon auto-firing, HUD score updates, and enemy collision events.
- **Pause & UI Overlays:** Verify pausing freezes game time and settings modal responds correctly.
- **Upgrade Modal:** Verify wave clear modal appears and selecting an upgrade modifies player stats.
- **Game Over & Leaderboard:** Verify player death triggers Game Over screen, score payload is sent to Supabase mock, and high score list updates.

### Viewport Targets
- **Desktop:** 1920x1080 (Chrome, Firefox, WebKit).
- **Mobile Web:** 390x844 (iPhone 13 / iOS Safari simulated), 412x915 (Pixel 7 / Android Chrome simulated).

### Execution Command
```bash
npm run test:e2e
```

---

## 4. Performance & Frame Rate Testing

- **Target Benchmark:** 60 FPS baseline on mid-tier mobile browsers and integrated GPU desktops.
- **Object Pooling:** Projectiles, particle emitters, and enemy sprites MUST use Phaser object pools to prevent GC stuttering.
- **Max Active Entities:** Tested up to 200 concurrent active physics bodies on screen.

---

## 5. Continuous Integration (CI) Setup

Every Pull Request must pass:
1. `npm run lint` (ESLint TypeScript strict checks).
2. `npm run test:unit` (100% pass rate required).
3. `npm run build` (Clean Vite production bundle).
