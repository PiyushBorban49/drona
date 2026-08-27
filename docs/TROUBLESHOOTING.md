# 🛠 Troubleshooting Runbook — every bug we actually hit

Each entry: **Symptom → Root cause → Fix → Verify**. If a new failure appears, add it here in the same shape.

---

## 1. `503 Auth service unavailable` on every authenticated call

- **Symptom:** frontend works but every `/user/*` call 503s; no obvious backend error.
- **Root cause:** `backend/.env` missing ⇒ `INSFORGE_URL`/`INSFORGE_API_KEY` defaulted to empty strings; httpx then failed with protocol errors that mapped to generic 503.
- **Fix:** fail-fast `_ensure_configured()` raises an actionable error naming the missing variables; causes logged behind `[auth]`/`[insforge]` prefixes.
- **Verify:** boot backend; banner prints `InsForge : Connected`.

## 2. `/chat` returns 422 for every message

- **Symptom:** `Validation failed → body.user_id: Field required`.
- **Root cause:** schema still REQUIRED legacy `user_id`; the migrated frontend stopped sending it (identity = JWT). Same landmine in voice + scenario models.
- **Fix:** all four request models use `Optional[str]`; routers never read it.
- **Verify:** chat replies 200 without any user_id in payload.

## 3. Console shows `[object Object]`

- **Symptom:** cryptic error toasts on validation failures.
- **Root cause:** FastAPI 422 `detail` is an *array of objects*; client stringified it directly.
- **Fix:** `fetchAPI` formats arrays as readable `loc: msg; …` text.

## 4. Mindmap: the blank-canvas saga 🧠

A five-layer onion — each fix shipped separately:

| Layer | Symptom | Cause | Fix |
|---|---|---|---|
| a | React tree unmounts (white page) | unguarded `data.label.toLowerCase()` on malformed node | defensive coercion in `ExplorerNode` |
| b | Canvas blank though data OK | raw LLM JSON fed to client (ids/positions/edges invalid) | `normalize_mindmap()`: unique ids, numeric positions, edge pruning, type pinning |
| c | Still blank, terminals silent | page **set** error state but never *rendered* it | brutalist red "Mapper Malfunction" panel + Try Again button |
| d | `[mindmap] Expecting value: line 1 column 1` | empty / fenced / prose-wrapped LLM output hit raw `json.loads` | `_extract_json_object()` (outermost `{…}`, fence-stripping regex) + strict-prompt retry |
| e | Canvas blanks only on AI outage | failure path had nowhere to go | deterministic offline fallback map from context sentences; yellow banner marks it |

**Verify:** with AI layer disabled, UI shows navigable 7-node map + banner; logs print `[mindmap] serving OFFLINE FALLBACK layout`.

## 5. `[mindmap] attempt 1/2 failed: model returned an EMPTY response` ×2

- **Symptom:** two clean attempts, both "empty", fallback engaged.
- **Root cause:** default model was `openai/gpt-oss-120b`, a **reasoning model**: analysis lands in a hidden provider field (`additional_kwargs.reasoning`…), leaving `message.content` literally empty.
- **Fix:** `_provider_reasoning()` probes hidden fields and rescues the JSON from them; binds `reasoning_effort=low` for gpt-oss families; default flipped to non-reasoning `llama-3.3-70b-versatile`. Works *because* of entry 4d's extractor on the reasoning buffer.
- **Verify:** logs show `probing hidden reasoning buffer (N chars)` followed by success, or fallback if truly empty.

## 6. Groq `413 Requested 8527 > Limit 8000 TPM` 🚦

- **Symptom:** instant rejection before generation; fallback map shown.
- **Root cause:** Groq bills TPM as **prompt_tokens + max_tokens**. A fixed generous `max_tokens=8192` alone overshot the free-tier 8k floor.
- **Fix:** `_completion_budget(prompt_chars)` computes max_tokens so prompt+completion ≤ 7500 (cap 6000, floor 1024); explicit 413 handler retries once at half budget; non-token errors propagate untouched.
- **Verify:** suite replays the verbatim 413 → retry count 2, halved budget asserted.

## 7. `Module not found: @/context/AuthContext` after fresh clone

- **Symptom:** file exists locally, missing on GitHub pull.
- **Root cause:** legacy blanket ignore rule `frontend/` in root `.gitignore` silently swallowed *new* files while tracked-file edits committed fine.
- **Fix:** rule removed; `.env.example` exception added to frontend/.gitignore; lesson codified — run `git ls-files --others -i` before committing into repos with broad ignores.
- **Bonus artifacts:** stray Windows `%APPDATA%/npm` shim dirs committed the same way were later untracked & gitignored.

## 8. CORS errors when testing on unusual ports

- **Symptom:** browser `TypeError: Failed to fetch`; RF #002 warnings.
- **Root cause:** dev server port not in `CORS_ORIGINS` allow-list.
- **Fix:** add your origin, or better — use the same-origin proxy mode (leave `NEXT_PUBLIC_API_URL` unset) which needs no CORS at all.

## 9. Turbopack / stale-process ghosting

- **Symptom:** fixes already pulled but symptoms persist.
- **Root cause:** old node/python processes + `.next` cache.
- **Protocol:** kill ALL node & python procs → `git log --oneline -1` confirms expected commit → delete `frontend/.next` → restart both servers → hard refresh (Ctrl+Shift+R).

## 10. Authentication quick reference

| Code | Meaning | Remedy |
|---|---|---|
| 401 on `/user/*` | token absent/expired (~15-min TTL is intentional) | re-login via SDK flow |
| 503 w/ actionable text | InsForge env misconfigured | fill `backend/.env` |
| 200 everywhere else | healthy | — |

## 11. Model choice cheat-sheet

| Model | Behaviour | Use when |
|---|---|---|
| `llama-3.3-70b-versatile` *(default)* | direct content output, biggest free-tier headroom | anything structured |
| `openai/gpt-oss-*` | reasoning channel; agent auto-throttles & rescues | need deeper reasoning, accept TPM cost |
