# GDD.md — Game Design Document

> Detailed gameplay design, core mechanics, balance values, weapon stats, enemy archetypes, and progression systems for Neon Protocol.

---

## 1. Executive Summary & Core Loop

Neon Protocol is a fast-paced 2D cyberpunk top-down endless survival shooter. Players pilot an augmented cybernetic agent fighting through escalating waves of corporate security drones, rogue AI constructs, and mechanized bosses in a neon-lit futuristic arena.

```
+------------------+     Wave Cleared     +-------------------+
|  Fight Wave of   | -------------------> | Pick Upgrade /    |
|   Enemies & XP   |                      | Unlock Weapon     |
+------------------+                      +-------------------+
         ^                                          |
         |              Start Next Wave             |
         +------------------------------------------+
```

---

## 2. Controls & Movement Mechanics

- **Movement:** 360-degree omnidirectional movement via WASD / Left Touch Virtual Joystick. Speed: 250 px/s base.
- **Aiming & Firing:** 360-degree pointer aim via Mouse / Right Touch Virtual Joystick. Firing is set to **Auto-Fire** (per Decision #014).
- **Dash / Dodge Roll:** Spacebar / Touch Dash Button. Brief invulnerability window (0.2s), 2.5s cooldown.

---

## 3. Weapon Roster (V1 Locked - Decision #010)

| Weapon Name | Type | Damage | Fire Rate | Range | Special Behavior |
|---|---|---|---|---|---|
| **Plasma Pistol** | Starter Single-Shot | 20 base | 3.5 rds/sec | Medium | High precision, slight knockback |
| **Arc Shotgun** | Spread | 12 x 5 pellets | 1.2 rds/sec | Short | Wide cone, strong knockback |
| **Laser Rifle** | Beam / Piercing | 45 continuous | 6.0 ticks/sec | Long | Penetrates through up to 3 enemies |
| **EMP Grenade** | AoE Area Damage | 80 AoE | 0.8 rds/sec | Medium | Stuns enemies for 1.5s; self-damage capped at 15% |
| **Pulse Blade** | Melee Arc | 110 Arc | 1.8 attacks/sec | Close | Clears incoming enemy projectiles in arc |

---

## 4. Enemy Archetypes (V1 Locked - Decision #010)

1. **Scout Drone (Fodder):** Fast (280 px/s), low health (30 HP), melee ramming attack (10 dmg). Spawns in large packs.
2. **Enforcer Mech (Tank):** Slow (120 px/s), high health (250 HP), heavy armor, fires burst plasma rounds (25 dmg).
3. **Hacker Sentinel (Disruptor):** Medium speed (180 px/s), 100 HP, casts an EMP field that slows player movement speed by 30%.
4. **Hunter Drone (Assassin):** High speed (320 px/s), 75 HP, cloaks periodically, deals high single-target strike damage (40 dmg).
5. **Cyber Overlord (V1 Boss):** Appears every 5th wave. 2000 HP (scales per wave). Phase 1: Heavy laser sweep; Phase 2: Drone minion spawn + rocket barrage.

---

## 5. Wave Scaling & Upgrades

- **XP Formula:** Required XP for Level `N` = `100 * (1.25 ^ (N - 1))`.
- **Wave Composition:** Enemy count per wave = `8 + (Wave * 3)`. Enemy health scales +10% per wave.
- **Upgrade Selection:** At wave completion, player chooses 1 of 3 randomized upgrades:
  - *Damage Boost (+15% all weapons)*
  - *Fire Rate Overclock (+20% attack speed)*
  - *Cybernetic Armor (+25 Max HP + 5 HP regen/sec)*
  - *Move Speed Augment (+15% move speed)*
  - *Weapon Unlock / Evolution*
