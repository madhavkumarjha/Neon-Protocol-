# .ai/rules.md — Strict Agent Execution & Code Rules

> Mandatory code quality guidelines enforced for all AI tools operating in this workspace.

---

## 1. Code Standards & Typing

- **Strict TypeScript:** No `any`. Use generics or explicit unions.
- **Phaser 3 Scene Isolation:** Scenes manage lifecycle methods (`preload`, `create`, `update`) and delegate logic to system managers.
- **Config-Driven Entities:** Enemy stats, weapon attributes, and upgrade choices MUST be loaded from typed config data structures in `@/config/`.

---

## 2. Directory Scaffolding & Paths

- Game source code belongs strictly under `src/`.
- Assets belong under `assets/`.
- Unit tests belong under `tests/unit/`.
- E2E tests belong under `tests/e2e/`.

---

## 3. Git & Commits

- Commit messages MUST follow conventional commits:
  - `feat(weapons): add laser rifle piercing logic`
  - `fix(spawner): resolve infinite enemy spawn bug on boss wave`
  - `docs(decisions): log decision #015`
