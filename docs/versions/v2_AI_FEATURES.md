# v2_AI_FEATURES.md — Version 2 Scope Specification (AI, PWA & Mobile Touch)

> **Target Goal:** Enhance the V1 core survival loop using Groq LLM API for dynamic content, PWA (Progressive Web App) offline installation capability, and enhanced mobile touch controls.

---

## 1. Planned V2 Feature Pillars

### Pillar A: PWA (Progressive Web App) Integration
- **Web App Manifest (`manifest.json`):** Full app metadata, cyberpunk app icons, theme colors (`#0D0F18`), and landscape orientation lock.
- **Service Worker Offline Caching:** Cache core Phaser bundles, HTML, and audio assets for seamless offline playability.
- **"Add to Home Screen" Prompt:** Native browser installation prompt on mobile (iOS Safari & Android Chrome).

### Pillar B: Mobile Virtual Touch Controls
- **Dual Virtual Joysticks Overlay:**
  - Left Virtual Joystick: 360-degree smooth movement control.
  - Right Virtual Joystick: Directional aiming & auto-fire direction indicator.
- **Mobile Touch Dash Button:** Dedicated tactile touch button for Spacebar dash action.

### Pillar C: Groq LLM AI Dynamic Content
- **Procedurally Generated AI Weapons:**
  - Groq LLM API generates dynamic weapon names, cyberpunk lore flavor text, and randomized balanced stat matrices.
- **Dynamic Wave Mutators:**
  - LLM generates unique wave events (e.g., *"Solar Flare: Projectile speeds doubled, visibility reduced"*).
- **Adaptive Nemesis System Lite:**
  - AI tracks player playstyle (e.g., favors shotgun vs sniper) and adapts enemy spawn compositions accordingly.
