# AI_DELEGATION_GUIDE.md — AI Delegation & Multi-Agent Workflows

> Operational guide on how human developers and AI agents (Claude, Cursor, GPT, Antigravity) collaborate effectively on Neon Protocol.

---

## 1. Agent Roles & Capabilities Matrix

| Agent | Target Tasks | Primary Strengths |
|---|---|---|
| **Antigravity** | End-to-end orchestration, system architecture, pair programming, planning, project structuring | Full codebase awareness, artifact planning, multi-tool execution |
| **Claude** | Complex math, system design specs, architectural documentation, refactoring core engines | Deep reasoning, precise adherence to strict type constraints |
| **Cursor** | Inline code completion, UI component drafting, fast iteration on existing files | Immediate contextual editor suggestions |
| **GPT** | Test case generation, placeholder asset generation prompts, documentation audits | Broad synthesis, quick draft generation |

---

## 2. Multi-Agent Workflow Protocol

1. **Planning Phase (Antigravity/Claude):**
   - Review `.ai/context.md` and `docs/DECISIONS.md`.
   - Write/update `implementation_plan.md` artifact detailing proposed changes.

2. **Execution Phase (Antigravity/Cursor):**
   - Implement TypeScript classes and Phaser system modules adhering to `AGENT.md`.
   - Write corresponding Vitest unit tests in `tests/unit/`.

3. **Audit Phase (Claude/GPT):**
   - Run consistency audit against `docs/` files to ensure no design contracts were violated.
   - Run `npm run lint` and `npm run test:unit`.

4. **Handoff Phase:**
   - Update `.ai/context.md` with new progress. Log any new choices in `docs/DECISIONS.md`.

---

## 3. Standard Consistency Audit Routine

Whenever a new feature or structural change is made:
1. Check `docs/ARCHITECTURE.md` to ensure scene/system boundary compliance.
2. Check `docs/DATA_MODEL.md` to ensure config interfaces match.
3. Check `docs/DECISIONS.md` to verify no logged decision was infringed.
4. Verify `README.md` documentation links remain valid.
