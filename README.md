# Neon Protocol

> A 2D cyberpunk top-down shooter, built for desktop web.

---

## 1. What This Project Is

Neon Protocol is a 2D top-down shooter set in a neon-soaked cyberpunk world. The player fights through escalating waves of enemies, unlocks weapons and upgrades, and survives as long as possible. V1 ships Endless Survival Mode only; Campaign Mode (scripted chapters) arrives in V3 — see `docs/DECISIONS.md` Decision #001.

The project is being built with an AI-assisted workflow: multiple AI agents (Claude, Cursor, GPT) contribute code and content under a shared set of rules defined in `AGENT.md`. This README, along with the rest of `docs/`, exists so that **any contributor — human or AI — can understand the project without re-asking questions that have already been answered.**

**One-line pitch:** A fast, replayable, AI-enhanced cyberpunk shooter that starts as a tight single-player MVP and grows into a live, multiplayer platform.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Game engine | Phaser 3 | 2D engine, built-in physics, WebGL arcade rendering |
| Language | TypeScript (strict mode) | No `any` type allowed — see `.ai/rules.md` |
| Build tool | Vite | Fast dev server, optimized production builds |
| Testing | Vitest (unit), Playwright (E2E) | See `docs/TEST_STRATEGY.md` |
| AI/LLM (V2+) | Groq API (`llama-3.3-70b-versatile`) | Dynamic content generation via `/api/generate` serverless proxy |
| Target platforms | Desktop Web | WASD + 360° Mouse Aim + Auto-Fire (Decision #020) |

Reasons behind each choice are logged individually in `docs/DECISIONS.md` — this README only summarizes the *what*, not the *why*.

---

## 3. Quick Setup

```bash
# Clone the repo
git clone <repo-url>
cd neon-protocol

# Install dependencies
npm install

# Run local dev server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

**Requirements:**
- Node.js 18+
- npm 9+

---

## 4. Deployment (Vercel)

Neon Protocol deploys to [Vercel](https://vercel.com):

1. **Connect Repository:** Import the repository into your Vercel dashboard.
2. **Framework Preset:** Vite (Build command: `npm run build`, Output directory: `dist`).
3. **Environment Variables:** Configure the following in Project Settings -> Environment Variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous public key.
   - `GROQ_API_KEY`: Server-side Groq Cloud API key for the `/api/generate` serverless proxy.
4. **Deploy:** Hit Deploy. Vercel automatically builds the client bundle and mounts `/api/generate` as a serverless endpoint.

---

## 5. Folder Structure

```
📦 neon-protocol/
│
├── 📄 README.md                → You are here
├── 📄 AGENT.md                 → Master rulebook for AI agents
│
├── 📂 src/                     → Game source code (TypeScript)
│   ├── scenes/                 → Phaser scenes (Boot, Menu, Game, UI, etc.)
│   ├── entities/                → Player, enemies, weapons, projectiles
│   ├── systems/                  → Wave system, upgrade system, spawner
│   ├── config/                   → Data-driven configs (enemies, weapons, waves)
│   └── utils/                    → Shared helper functions
│
├── 📂 assets/                  → Sprites, audio, fonts
│
├── 📂 docs/                    → All project documentation (see below)
│   └── 📂 versions/            → Per-version scope docs (v1, v2, v3, v4)
│
└── 📂 .ai/                     → Context, rules, and prompts for AI agents
```

*(Exact `src/` structure is locked in `docs/ARCHITECTURE.md` Section 4 — the tree above is directional; that document is authoritative.)*

---

## 6. Documentation Map

This project is documentation-first. Before writing code or asking an AI agent to build something, check the relevant doc below.

| Document | Purpose |
|---|---|
| `AGENT.md` | Rules AI agents must follow |
| `docs/PRD.md` | Why we're building this, for whom, success metrics |
| `docs/PRODUCT_SPEC.md` | Feature-by-feature detailed spec |
| `docs/GDD.md` | Core game mechanics, balance, enemy/weapon design |
| `docs/ARCHITECTURE.md` | Technical system design |
| `docs/DATA_MODEL.md` | Data schemas (save files, configs) |
| `docs/API_REFERENCE.md` | Internal + external API contracts |
| `docs/MASTER_ROADMAP.md` | V1 → V4 full plan |
| `docs/DECISIONS.md` | Log of every major decision and why it was made |
| `docs/AI_DELEGATION_GUIDE.md` | Which AI handles which kind of task |
| `docs/TEST_STRATEGY.md` | How the project is tested |
| `docs/UI_UX_FLOW.md` | Screens, navigation, controls |
| `docs/ART_STYLE_GUIDE.md` | Visual identity |
| `docs/MONETIZATION.md` | Revenue strategy |
| `docs/RISK_ANALYSIS.md` | Known risks and mitigations |
| `docs/versions/v1_MVP_SCOPE.md` | Exact V1 scope |
| `.ai/context.md` | Current project state (updated regularly) |
| `.ai/rules.md` | Coding standards |
| `.ai/prompts.md` | Ready-made prompts for common tasks |

**Status:** All 23 documents in this kit are complete and authoritative — the full list above, plus `docs/versions/v1_MVP_SCOPE.md` through `v4_PLATFORM.md` and the three `.ai/` files. See `.ai/context.md` for current project phase and any open items awaiting a human decision before implementation begins.

---

## 7. Recommended Reading Order (For Anyone New)

1. `README.md` — what the project is
2. `docs/PRD.md` — why we're building it
3. `docs/GDD.md` — how the game works
4. `docs/ARCHITECTURE.md` — how the tech is structured
5. `docs/MASTER_ROADMAP.md` — where it's going
6. `AGENT.md` — how AI agents should help
7. `docs/DECISIONS.md` — what decisions have been made and why
8. `.ai/context.md` — what's happening right now

---

## 8. Project Status

- **Current version target:** V1 (MVP)
- **Current phase:** Documentation foundation 100% complete; ready for V1 implementation
- **Code status:** Ready to begin implementation — full architectural and design spec complete.

This section should be kept in sync with `.ai/context.md`, which is the more granular, frequently-updated source of truth on current sprint status.
