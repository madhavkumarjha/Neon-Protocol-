# UI_UX_FLOW.md — UI Layout, Screen Flows & Controls

> Complete specification of user interface layouts, screen flow transitions, HUD elements, and controls for Neon Protocol.

---

## 1. Screen Flow Diagram

```
[ Boot Scene ] --(Assets Loaded & Click to Unlock Audio)--> [ Main Menu Scene ]
                                                                    |
                                                              (Press Start)
                                                                    v
+-------------------------------------------------------------------------------+
|                                [ Game Scene ]                                 |
|                                                                               |
|  HUD Overlay (HP, XP, Score, Wave) <--> Desktop Controls (WASD + Mouse Aim)   |
|                                                                               |
|     +--> (ESC / Pause) -------------> [ Pause Modal ]                         |
|     |                                       |                                 |
|     +--> (Wave Cleared) ------------> [ Upgrade Choice Modal ]                |
|     |                                       |                                 |
|     +--> (Player HP == 0) ----------> [ Game Over Scene ]                    |
|                                             |                                 |
|                                    (Submit Score to Supabase)                 |
|                                             v                                 |
|                                   [ Leaderboard Scene ]                       |
+-------------------------------------------------------------------------------+
```

---

## 2. In-Game HUD Layout Specs

- **Top-Left Header:** Player Health Bar (Neon Magenta fill `#FF007F`), XP Bar (Neon Cyan fill `#00F0FF`), Current Level Indicator.
- **Top-Center Header:** Wave Counter (`WAVE 05`), Wave Timer, Active Enemy Count.
- **Top-Right Header:** Current Score counter, Kill Counter.
- **Controls Reminder (Desktop):** Bottom indicator: `WASD: Move | MOUSE: Aim | AUTO-FIRE: On | SHIFT: Dash | ESC: Pause`.

---

## 3. Screen Orientation & Platform Handling (Resolved)

- **Platform Target:** Desktop Web only (Decision #020).
- **Supported Viewports:** Widescreen desktop browsers (16:9 / 16:10 / ultrawide).
- **Mobile / Small Screen Policy:** Displays a responsive HTML overlay:
  `"DESKTOP ONLY — Neon Protocol requires keyboard movement (WASD) and precision cursor aiming. Please open on a computer."`
  Touch gameplay is not supported.
