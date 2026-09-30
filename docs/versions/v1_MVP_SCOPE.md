# v1_MVP_SCOPE.md — Version 1 Scope Specification

> **Target Goal:** Deliver a tight, highly playable 2D cyberpunk endless survival arcade shooter for web and mobile browsers.

---

## 1. V1 Deliverables Checklist

- [x] Full documentation foundation (`README.md`, `AGENT.md`, `docs/` kit).
- [x] Phaser 3 + TypeScript + Vite project scaffolding (`package.json`, `vite.config.ts`, `main.ts`).
- [x] Core Arena Gameplay Scene with 60 FPS target (`GameScene.ts`).
- [x] WASD Mouse/Auto-fire Desktop Controls (`Player.ts`, `UIScene.ts`). (Mobile Touch Overlay deferred to V1.1 per Decision #019).
- [x] 5 Weapons (Plasma Pistol, Arc Shotgun, Laser Rifle, EMP Grenade, Pulse Blade) (`weapons.config.ts`, `Weapon.ts`).
- [x] 4 Enemy Types (Scout, Enforcer, Hacker, Drone) + 1 Boss (Cyber Overlord) (`enemies.config.ts`, `Enemy.ts`).
- [x] Wave Spawner with escalating difficulty curves (`WaveSystem.ts`, `waves.config.ts`).
- [x] Between-wave 3-Choice Upgrade Modal (`UpgradeSystem.ts`, `UIScene.ts`).
- [x] Global Leaderboard connected to Supabase/Fallback Storage using anonymous `device_id` (`LeaderboardService.ts`).
- [ ] Synthesized Web Audio SFX / Music Generator & Playwright E2E Test Suite.

---

## 2. Non-Goals for V1

- No scripted story campaign.
- No LLM / AI dynamic content.
- No co-op or PvP multiplayer.
- No monetization or microtransactions.
