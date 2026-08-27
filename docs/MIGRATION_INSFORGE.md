# 🔄 The InsForge Migration — MongoDB & Clerk → InsForge

This is the full story of how Dronacharya moved **all** state, identity and media onto InsForge, and why legacy stacks were removed entirely rather than wrapped.

---

## 1. Why migrate?

| Before | After | Why it matters |
|---|---|---|
| MongoDB Atlas (MONGODB_URI) | InsForge Postgres 16 | one SQL database for relational stats **and** vectors; RLS for free |
| sentence-transformers locally | InsForge AI gateway embeddings | no torch in the image → multi-GB smaller deploys |
| Clerk auth (@clerk/nextjs + svix) | InsForge Auth sessions | one vendor for users, data, storage — one invoice surface |
| Local disk videos | `videos` / `keyframes` buckets with public URLs | containers become ephemeral-safe |

The mandate was explicit: *MongoDB must be completely gone* — no adapter shims. Final grep state across the repo: **zero** `pymongo`/`MONGODB_URI`/`@clerk` outside of this doc.

---

## 2. Backend changes (commit `6a077a5`)

### New files
- **`app/services/insforge_client.py`** — single httpx gateway to the project: token introspection, signup/signin, records CRUD with PostgREST-style filters, RPC calls, `embed_texts` via AI gateway, direct + presigned uploads, public URL builder.
- **`app/services/auth.py`** — FastAPI dependencies `get_current_user` / `get_optional_user`; HTTPBearer scheme; introspection cache TTL = min(300 s, jwt exp).
- **`app/services/storage_service.py`** — upload_video/upload_keyframe/delete_media mapped to the buckets.

### Rewritten
- `user_service.py` — now pure Postgres on `public.user_stats`: ensure-row-on-first-touch, atomic XP awarding with level math (`level = floor(sqrt(xp)/10)+1`), streak update via date diff, study-hour accumulation, capped continue-learning list.
- `vector_store.py` — embed through gateway; insert into `workspace_embeddings`; semantic search via RPC `match_workspace_chunks` with an unfiltered fallback branch when workspace filter returns nothing.
- `routers/user.py` — identity from JWT only; added `GET /user/stats` and streak heartbeat `POST /user/activity/ping`.
- `config.py` — dropped MONGODB_*, added INSFORGE_URL/API_KEY(/ANON), EMBEDDING_MODEL, bucket names.
- Deleted: `mongo_client.py`; trimmed requirements (pymongo, dnspython, sentence-transformers…).

### Schema applied to the live project
`migrations/20260827063338_migrate-drona-to-insforge.sql`

```sql
CREATE TABLE public.user_stats (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    xp integer NOT NULL DEFAULT 0,
    level  integer NOT NULL DEFAULT 1,
    streak_days integer NOT NULL DEFAULT 0,
    last_active_date date,
    total_hours numeric(8,2) NOT NULL DEFAULT 0,
    items_for_later jsonb NOT NULL DEFAULT '[]',
    continue_learning jsonb NOT NULL DEFAULT '[]',
    updated_at timestamptz …            -- trigger maintained
);
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
-- owner-only policy + updated_at trigger
-- match_workspace_chunks(query_embedding vector(1536), match_count int)
--   ORDER BY embedding <=> $1 LIMIT k     (cosine)
```

Buckets `videos`, `keyframes` created in the same phase.

**Verification:** 15-check live E2E suite (`scripts/e2e_services_test.py`) — introspection incl. garbage-token rejection, XP→level math, streak logic, hours accounting, FK enforcement, pgvector ingest + top-k retrieval, keyframe upload→GET→delete. Plus a real-HTTP boot suite asserting 401 vs 200 flows.

---

## 3. Frontend changes (commit `ce1e225`)

- **`lib/insforge.ts`** — SDK singleton + `getAccessToken()/getAuthHeaders()` with cold-load rehydration through the refresh-cookie flow.
- **`context/AuthContext.tsx`** — replaces ClerkProvider: `{isLoaded,isSignedIn,user}` shape preserved so page code stayed minimal; listens to `onAuthStateChange`.
- **`AuthClient.tsx`** — rewritten on `insforge.auth.*`: password signup branches on the project's `requireEmailVerification` setting → inline 6-digit code input + resend; OAuth buttons (google/github) use PKCE redirect back to `/dashboard`.
- Dashboard/profile pages converted from server components that queried Mongo directly into client components fed by the FastAPI user-stats endpoints (one extra heartbeat call preserves visit-streak parity).
- Quiz/chat/video/settings/header components swap Clerk hooks; all fetches centralised on the Bearer-attaching `fetchAPI`; file uploads included.
- **Deleted**: `lib/mongodb.ts`, `lib/user_service.ts`, `app/sso-callback/`; deps `mongodb`, `@clerk/nextjs`, `svix` removed from package.json & lockfile.

## 4. Post-migration hardening (commits 7044d35 → 15065ac)

The migration surfaced a series of production-grade bugs, each fixed at the root:

1. **Fail-fast env contract** — empty `INSFORGE_URL` used to yield cryptic httpx errors → actionable error naming the missing variable + `[auth]`-prefixed cause logging.
2. **Schema honesty** — stale required `user_id` in four request models blocked every `/chat` with 422 although no router reads it → optionalized.
3. **Mindmap resilience saga** — see [TROUBLESHOOTING.md](TROUBLESHOOTING.md#mindmap-the-blank-canvas-saga) for the full chain: normalize layer → render boundary → JSON extractor → reasoning-model rescue → TPM adaptive budgets.
4. **Model default flip** — `GROQ_MODEL` default is now non-reasoning `llama-3.3-70b-versatile`; gpt-oss remains opt-in and gets automatic throttling/recovery treatment.

## 5. Testing assets born during migration

| Script | Purpose |
|---|---|
| `scripts/e2e_services_test.py` | 15 live checks against real InsForge project |
| `scripts/http_boot_test.py` | boots uvicorn over real HTTP, asserts auth gate behaviour |
| `scripts/refresh_test_token.py` | toggles email-verification policy, re-auths test user, saves fresh token (~15-min TTL workaround) |
| `scripts/test_mindmap_normalizer.py` | 30 unit checks on the mindmap agent's whole failure surface |

Test user lives at `scripts/.test_user.json` (gitignored).
