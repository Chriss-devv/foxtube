---
name: foxtube-recommendation-engine
description: Use when editing FoxTube recommendation logic in /srv/docker/arr/invidious/nginx/yt-actions.js, Para ti, Shorts ranking, localStorage telemetry, YouTube-like algorithm behavior, or Takeout profile integration.
---

# FoxTube Recommendation Engine

Use this skill for FoxTube recommendation and telemetry changes.

## Architecture

FoxTube runs as a browser-side overlay on upstream Invidious. It cannot use real YouTube-scale neural ranking, FAISS/ScaNN, or server-side training unless a custom backend is added. Approximate YouTube with a deterministic two-stage local pipeline:

1. Candidate generation from multiple sources.
2. Multi-objective ranking and post-ranking diversification.

## Candidate Sources

- Related videos from recent/high-engagement watches.
- Latest videos from watched channels.
- Latest videos from subscribed channels with lower default weight.
- Topic searches from long-term profile and current session.
- Fresh regional/global popular fallback.
- Exploration candidates around adjacent interests.

## Ranking Signals

- Watch time and completion rate should beat raw clicks.
- CTR should be smoothed to avoid overfitting low-impression videos.
- Recent session signals should adapt quickly after 3-5 watches/searches.
- Long-term interests should use exponential decay so stale topics fade.
- Repeated channels and repeated topics should be penalized in top slots.
- Explicit negatives like `not interested` and blocked channels should strongly penalize.
- Shorts should be ranked separately using duration, completion, loops, and swipe-away.

## Storage

Use localStorage keys with `ft_` prefix. Keep data bounded by slicing arrays and pruning maps.

Important keys:

- `ft_watch_history`
- `ft_search_history_v1`
- `ft_video_stats_v1`
- `ft_impression_sessions_v1`
- `ft_last_feed_ids_v1`
- `ft_feedback_v2`

## Safety

- `foxtube-profile.json` contains personal Takeout data. Do not expose it more broadly than necessary.
- Escape all user/video text before injecting HTML.
- Keep routes working for anonymous users by falling back to Popular/Trending.

## Validation

- Run `node --check /srv/docker/arr/invidious/nginx/yt-actions.js`.
- Check HTTP routes through `invidious-proxy`.
- Verify `/feed/popular?ft_feed=1`, `/feed/popular`, `/shorts`, `/feed/subscriptions`, `/feed/history`, and `/feed/playlists`.
- Compare behavior before/after using backups when possible.
