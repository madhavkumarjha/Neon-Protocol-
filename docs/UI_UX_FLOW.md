# UI_UX_FLOW.md — UI Layout, Screen Flows & Touch Control Specs

> Complete specification of user interface layouts, screen flow transitions, HUD elements, and touch controls for Neon Protocol.

---

## 1. Screen Flow Diagram

```
[ Boot Scene ] --(Assets Loaded & Click/Tap to Unlock Audio)--> [ Main Menu Scene ]
                                                                        |
                                                                  (Press Start)
                                                                        v
+-----------------------------------------------------------------------------------+
|                                  [ Game Scene ]                                   |
|                                                                                   |
|  HUD Overlay (HP, XP, Score, Wave) <--> Dual Virtual Joysticks (Mobile Touch)     |
|                                                                                   |
|     +--> (ESC / Pause Btn) ---------> [ Pause Modal ]                             |
|     |                                       |                                     |
|     +--> (Wave Cleared) ------------> [ Upgrade Choice Modal ]                    |
|     |                                       |                                     |
|     +--> (Player HP == 0) ----------> [ Game Over Scene ]                        |
|                                             |                                     |
|                                    (Submit Score to Supabase)                     |
|                                             v                                     |
|                                   [ Leaderboard Scene ]                           |
+-----------------------------------------------------------------------------------+
```

---

## 2. In-Game HUD Layout Specs

- **Top-Left Header:** Player Health Bar (Neon Magenta fill `#FF007F`), XP Bar (Neon Cyan fill `#00F0FF`), Current Level Indicator.
- **Top-Center Header:** Wave Counter (`WAVE 05`), Wave Timer, Active Enemy Count.
- **Top-Right Header:** Current Score counter, Kill Counter.
- **Bottom-Left Overlay (Mobile Only):** Virtual Left Joystick (Movement). Dynamic thumb region, opacity 0.6.
- **Bottom-Right Overlay (Mobile Only):** Virtual Right Joystick (Aiming/Auto-Fire directional indicator) + Dash Button.

---

## 3. Screen Orientation & Responsiveness

- **Supported Orientations:** Mobile Landscape (primary) and Desktop Widescreen (16:9 / 19.5:9).
- **Orientation Lock Notice:** On portrait mobile viewports, display a full-screen prompt: `"Please rotate your device to landscape to fight."`
