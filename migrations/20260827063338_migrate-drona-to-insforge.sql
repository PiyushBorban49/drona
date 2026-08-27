-- Migration: migrate Dronacharya v3 from MongoDB to InsForge-native Postgres
--
-- 1. public.user_stats — per-user gamification data previously stored in the
--    MongoDB "users" collection (xp, level, streak, hoursLearned, continueLearning).
--    Keyed by InsForge Auth users.
-- 2. RPC match_workspace_chunks — cosine similarity search over
--    public.workspace_embeddings (pgvector, 1536-dim embeddings from the
--    InsForge AI gateway: openai/text-embedding-3-small).
-- 3. Replace IVFFlat index (built on an empty table) with HNSW.

-- ── 1. User stats ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp                INTEGER NOT NULL DEFAULT 0,
  level             INTEGER NOT NULL DEFAULT 1,
  streak            INTEGER NOT NULL DEFAULT 0,
  hours_learned     DOUBLE PRECISION NOT NULL DEFAULT 0,
  continue_learning JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own stats"
ON public.user_stats FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "users can insert own stats"
ON public.user_stats FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "users can update own stats"
ON public.user_stats FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE ON public.user_stats TO authenticated;

-- keep updated_at fresh on every UPDATE
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_stats_touch_updated_at ON public.user_stats;
CREATE TRIGGER user_stats_touch_updated_at
BEFORE UPDATE ON public.user_stats
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── 2. Vector similarity search RPC ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.match_workspace_chunks(
  query_embedding vector(1536),
  match_count INT DEFAULT 5,
  filter_workspace_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  id          BIGINT,
  workspace_id TEXT,
  text        TEXT,
  metadata    JSONB,
  similarity  DOUBLE PRECISION
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT e.id,
         e.workspace_id,
         e.text,
         e.metadata,
         1 - (e.embedding <=> query_embedding) AS similarity
  FROM public.workspace_embeddings e
  WHERE (filter_workspace_id IS NULL OR e.workspace_id = filter_workspace_id)
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.match_workspace_chunks(vector(1536), INT, TEXT) TO anon, authenticated;

-- ── 3. Vector index upgrade ──────────────────────────────────────────────
DROP INDEX IF EXISTS public.workspace_embeddings_embedding_idx;
CREATE INDEX IF NOT EXISTS workspace_embeddings_embedding_hnsw_idx
ON public.workspace_embeddings USING hnsw (embedding vector_cosine_ops);
