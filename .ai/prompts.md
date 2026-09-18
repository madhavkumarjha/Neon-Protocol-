# .ai/prompts.md — Standardized AI Operational Prompts

> Reusable prompts for session continuation, consistency audits, and feature implementations.

---

## 1. Consistency Audit Prompt

```text
Perform a consistency audit across all documents in `docs/` and `.ai/context.md`.
Verify that:
1. All file paths referenced in README.md match the actual directory layout.
2. No open items in `.ai/context.md` conflict with locked entries in `docs/DECISIONS.md`.
3. All code interfaces in `docs/DATA_MODEL.md` align with `docs/ARCHITECTURE.md`.
```

---

## 2. Session Continuation Prompt

```text
Read `.ai/context.md` and `AGENT.md`.
Summarize current phase, completed tasks, and current open items.
Wait for human instruction on which open task to address next.
```
