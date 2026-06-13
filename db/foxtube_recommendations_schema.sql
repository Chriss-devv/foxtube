-- FoxTube recommendations/shorts production schema blueprint
-- Apply only if FoxTube moves from the current nginx-overlay prototype into a real backend service.
-- Current deployed build stores telemetry client-side in localStorage because upstream Invidious
-- is running from quay.io/invidious/invidious:master without a custom backend image.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS foxtube_video_events (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'impression', 'click', 'watch_progress', 'complete', 'loop', 'swipe_away', 'search'
  )),
  source TEXT,
  watch_seconds INTEGER DEFAULT 0,
  progress_ratio NUMERIC(5,4),
  query TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_foxtube_events_user_created
  ON foxtube_video_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_foxtube_events_video_type_created
  ON foxtube_video_events (video_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_foxtube_events_query_trgm
  ON foxtube_video_events USING gin (query gin_trgm_ops);

CREATE TABLE IF NOT EXISTS foxtube_video_features (
  video_id TEXT PRIMARY KEY,
  title TEXT,
  author TEXT,
  length_seconds INTEGER,
  view_count BIGINT DEFAULT 0,
  published_at TIMESTAMPTZ,
  topic_tokens TEXT[] DEFAULT '{}',
  is_short BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_foxtube_features_short_views
  ON foxtube_video_features (is_short, view_count DESC);

CREATE INDEX IF NOT EXISTS idx_foxtube_features_topics
  ON foxtube_video_features USING gin (topic_tokens);

CREATE TABLE IF NOT EXISTS foxtube_user_video_stats (
  user_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  watch_seconds INTEGER NOT NULL DEFAULT 0,
  completions INTEGER NOT NULL DEFAULT 0,
  loops INTEGER NOT NULL DEFAULT 0,
  swipes INTEGER NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_foxtube_user_stats_rank
  ON foxtube_user_video_stats (user_id, last_seen_at DESC, clicks DESC, watch_seconds DESC);

CREATE MATERIALIZED VIEW IF NOT EXISTS foxtube_global_video_stats AS
SELECT
  video_id,
  count(*) FILTER (WHERE event_type = 'impression') AS impressions,
  count(*) FILTER (WHERE event_type = 'click') AS clicks,
  sum(watch_seconds) AS watch_seconds,
  count(*) FILTER (WHERE event_type = 'complete') AS completions,
  count(*) FILTER (WHERE event_type = 'loop') AS loops,
  count(*) FILTER (WHERE event_type = 'swipe_away') AS swipes,
  max(created_at) AS updated_at
FROM foxtube_video_events
GROUP BY video_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_foxtube_global_stats_video
  ON foxtube_global_video_stats (video_id);
