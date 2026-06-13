# FoxTube Algorithm Notes

Fecha de actualizacion: 2026-06-09

## Archivos Principales

- JS del overlay: `/srv/docker/arr/invidious/nginx/yt-actions.js`
- CSS principal: `/srv/docker/arr/invidious/default.dracula.css`
- Proxy Nginx: `/srv/docker/arr/invidious/nginx/default.conf`
- Perfil importado de Takeout: `/srv/docker/arr/invidious/nginx/foxtube-profile.json`
- Investigacion base: `/mnt/datos/yt/algoritmo_youtube.md`

## Backups

Backups creados antes del cambio:

- `/srv/docker/arr/invidious/nginx/yt-actions.js.bak-youtube-like-20260610-022809`
- `/srv/docker/arr/invidious/default.dracula.css.bak-youtube-like-20260610-022809`
- `/srv/docker/arr/invidious/nginx/default.conf.bak-youtube-like-20260610-022809`

## Version Actual

- JS/CSS cache buster: `foxrec-v2-youtube-like`
- Skill CSS: `/home/sysadmin/.opencode/skills/foxtube-css-design/SKILL.md`
- Skill algoritmo: `/home/sysadmin/.opencode/skills/foxtube-recommendation-engine/SKILL.md`

## Como Funciona El Algoritmo

FoxTube aproxima el modelo de YouTube con un pipeline local de dos etapas:

1. Generacion de candidatos desde multiples fuentes.
2. Ranking multiobjetivo con diversificacion final.

Fuentes de candidatos:

- Videos relacionados a historial reciente.
- Videos relacionados a historial con mejor engagement.
- Ultimos videos de canales vistos.
- Ultimos videos de subscripciones como fuente secundaria.
- Busquedas por temas fuertes del perfil.
- Busquedas por temas de la sesion actual.
- Exploracion controlada con temas cercanos/populares.

Senales usadas para ranking:

- Watch time.
- Completion rate.
- CTR suavizado.
- Afinidad de canal/autor.
- Afinidad de topicos historicos.
- Afinidad de sesion reciente.
- Frescura del video.
- Popularidad normalizada.
- Fuente del candidato.
- Feedback negativo/positivo.
- Penalizacion por skips, swipe-away, repeticion de canal y repeticion de topico.

## Feedback Local

Cada card puede mostrar acciones:

- `Mas asi`: sube topicos positivos.
- `No me interesa`: penaliza video y topicos.
- `No canal`: bloquea canal/autor.

Datos guardados en `localStorage`:

- `ft_watch_history`
- `ft_search_history_v1`
- `ft_video_stats_v1`
- `ft_impression_sessions_v1`
- `ft_last_feed_ids_v1`
- `ft_feedback_v2`
- `ft_session_profile_v2`

## Reset Manual Del Perfil Local

Desde la consola del navegador en `yourdomain.example`:

```js
[
  'ft_watch_history',
  'ft_search_history_v1',
  'ft_video_stats_v1',
  'ft_impression_sessions_v1',
  'ft_last_feed_ids_v1',
  'ft_feedback_v2',
  'ft_session_profile_v2'
].forEach(k => localStorage.removeItem(k));
```

## Seguridad Del Perfil

`/foxtube-profile.json` ahora bloquea requests sin `Referer` esperado y anade `X-Robots-Tag: noindex, nofollow, noarchive`.

Esto es endurecimiento basico, no autenticacion fuerte. Si se requiere privacidad real, mover el perfil fuera del frontend publico o servirlo desde un backend autenticado.

## Validacion

Comandos usados:

```bash
node --check /srv/docker/arr/invidious/nginx/yt-actions.js
docker exec invidious-proxy nginx -t
docker exec invidious-proxy nginx -s reload
docker restart invidious
curl -I http://127.0.0.1:3003/js/yt-actions.js?v=foxrec-v2-youtube-like
curl -I http://127.0.0.1:3003/css/default.css?ft=foxrec-v2-youtube-like
curl -I http://127.0.0.1:3003/feed/popular?ft_feed=1
curl -I http://127.0.0.1:3003/shorts
```

Estado observado:

- `invidious`: `running healthy`
- JS: sintaxis OK.
- Nginx: test OK con warnings existentes de MIME duplicado.
- CSS actualizado servido con `Content-Length: 95820`.
- JS actualizado servido con `Content-Length: 123964`.

## Ajustes Futuros

Si recomienda cosas irrelevantes:

- Bajar peso de exploracion en `scoreVideo`.
- Subir penalizacion de `feedbackPenalty`.
- Subir umbral de `candidateMatchesProfile`.
- Reducir queries genericas de exploracion.

Si recomienda siempre lo mismo:

- Subir porcentaje de exploracion.
- Relajar limites de `candidateMatchesProfile` para `explore`.
- Aumentar penalizacion por `topicCount` y `authorCount` en `diversify`.

Si se queda sin videos:

- Bajar umbral de overlap en `candidateMatchesProfile`.
- Aumentar `sample` de queries o canales.
- Usar mas `subscription-latest` como fallback.
