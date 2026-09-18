# RISK_ANALYSIS.md — Technical & Project Risk Matrix

> Identification of technical, design, and workflow risks alongside concrete mitigation strategies for Neon Protocol.

---

## 1. Technical Risk Matrix

| Risk Event | Severity | Likelihood | Impact | Mitigation Strategy |
|---|---|---|---|---|
| **Mobile Browser Performance Drop** (Frame drops on low-end mobile hardware under heavy particle/bullet load) | High | Medium | Unplayable experience on target mobile platforms | Enforce object pooling for all bullets and particles; cap max active on-screen sprites to 200; provide low-VFX toggle in settings. |
| **Web Audio Context Blocked** (Browser policy prevents sound playing until user touch) | Medium | High | Silent first run / broken audio state | Implement explicit "Touch to Start" interaction screen in `BootScene` that handles `soundManager.unlockAudio()`. |
| **Supabase Rate Limiting / Abuse** (Spam score submissions to leaderboard) | Medium | Medium | Polluted high score data | Require client score hash signatures and enforce Supabase Row Level Security (RLS) policies with rate-limiting rules. |
| **Canvas Scaling Stutter on Mobile** | Low | Medium | Misaligned touch joysticks | Use Phaser's `Scale.FIT` mode with auto-centering and dynamic touch coordinate calculation. |

---

## 2. Workflow & AI Delegation Risks

| Risk Event | Severity | Likelihood | Impact | Mitigation Strategy |
|---|---|---|---|---|
| **AI Agent Context Drift** (Agent makes conflicting code choices without checking docs) | High | High | Code debt and architectural inconsistency | Maintain `AGENT.md` as mandatory reading; enforce strict decision logging in `docs/DECISIONS.md`. |
| **Scope Creep** (Adding V2/V3 features into V1 MVP) | High | Medium | Delayed launch | Restrict V1 scope strictly to `docs/versions/v1_MVP_SCOPE.md` (Endless Survival mode only). |
