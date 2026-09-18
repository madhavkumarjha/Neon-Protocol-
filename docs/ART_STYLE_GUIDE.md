# ART_STYLE_GUIDE.md — Visual Aesthetic & Audio Style Guide

> Visual design system, color tokens, typography, visual effects (VFX), and audio guidelines for Neon Protocol.

---

## 1. Visual Direction & Aesthetic

Neon Protocol adopts a high-contrast **Dark Cyberpunk / Synthwave** visual language. Dark obsidian-blue void backgrounds provide high readability for glowing neon vectors, glowing particle trails, and dynamic lighting.

---

## 2. Color Palette Tokens

| Token Name | Hex Code | Usage |
|---|---|---|
| `BG_DARK` | `#0D0F18` | Deep arena background |
| `GRID_LINE` | `#1A1D2E` | Subtle background grid lines |
| `NEON_CYAN` | `#00F0FF` | Player color, XP drops, Plasma projectiles, UI primary |
| `NEON_MAGENTA` | `#FF007F` | Player Health, enemy attacks, boss health bar |
| `NEON_GOLD` | `#FFD700` | Rare upgrades, High scores, Boss spawn alerts |
| `NEON_GREEN` | `#39FF14` | Shield boost, health pickups |
| `TEXT_PRIMARY` | `#F0F4F8` | Primary UI labels |

---

## 3. Visual Effects (VFX) & Juice Guidelines

1. **Hit Flashes:** When an enemy takes damage, flash white (`#FFFFFF`) tint for `50ms`.
2. **Screen Shake:**
   - Minor (Player hit): `duration: 100ms, intensity: 0.005`.
   - Major (Explosion / Boss death): `duration: 350ms, intensity: 0.02`.
3. **Particle Emitters:**
   - **Plasma Trail:** Cyan circle particles, scale `1.0 -> 0.0`, lifespan `150ms`.
   - **Explosion Burst:** 16-24 magenta/gold particles, speed `150-300 px/s`, lifespan `400ms`.

---

## 4. Typography

- **Header / Futuristic Display Font:** `Orbitron` or `Outfit` (Google Fonts), uppercase with slight letter spacing.
- **Body / Numerical Data Font:** `Inter` or `JetBrains Mono` for crisp readability at small sizes.
