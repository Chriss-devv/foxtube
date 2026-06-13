# 🦊 FoxTube

Un frontend de YouTube **autohospedado, privado y responsivo**, construido como una capa de personalización sobre [Invidious](https://github.com/iv-org/invidious).

FoxTube no toca el código fuente de Invidious: lo envuelve con un proxy Nginx que inyecta un overlay de CSS + JavaScript. Eso añade una identidad visual propia (tema oscuro "Dracula"), un motor de recomendaciones tipo YouTube que corre en el navegador, Shorts, y una experiencia móvil cuidada — todo sobre la imagen oficial `quay.io/invidious/invidious:master` sin forks ni builds personalizados.

> ⚠️ Proyecto personal / educativo. No afiliado a YouTube ni a Invidious.

---

## ✨ Características

- **Tema FoxTube (Dracula)** con sistema completo de variables CSS (claro/oscuro/auto).
- **Diseño responsivo mobile-first**: sistema de breakpoints unificado, grids fluidos, objetivos táctiles ≥44px, soporte de *safe-area* (notch) y respeto a `prefers-reduced-motion`.
- **Motor de recomendaciones local** ("Para ti") que aproxima el algoritmo de YouTube con un pipeline de dos etapas (generación de candidatos + ranking multiobjetivo), 100% del lado del cliente vía `localStorage`.
- **Shorts** con rail vertical a pantalla completa.
- **Rutas personalizadas** de Suscripciones / Historial / Playlists alimentadas desde un export de Google Takeout.
- **Stack autocontenido** con Docker Compose: Invidious + Companion + PostgreSQL + proxy Nginx.

---

## 🏗️ Arquitectura

```
                 ┌──────────────────────────────────────────────┐
   navegador ──▶ │  invidious-proxy (Nginx)                     │
                 │   • inyecta /js/yt-actions.js  (overlay UI)   │
                 │   • sirve /foxtube-profile.json (perfil)     │
                 │   • rutas /shorts /feed/* personalizadas      │
                 └───────────────┬──────────────────────────────┘
                                 │ proxy_pass
                 ┌───────────────▼──────────────┐   ┌──────────────────────┐
                 │  invidious (imagen oficial)   │──▶│ invidious-companion   │
                 │   • CSS: default.css montado  │   └──────────────────────┘
                 └───────────────┬──────────────┘
                                 │
                       ┌─────────▼─────────┐
                       │  invidious-db      │  (PostgreSQL 15)
                       └────────────────────┘
```

- **`assets/css/default.css`** — el tema. Se monta como `default.css` de Invidious.
- **`assets/js/yt-actions.js`** — el overlay (UI + recomendaciones), inyectado por Nginx.
- **`nginx/default.conf`** — proxy inverso, inyección y rutas personalizadas.
- **`data/foxtube-profile.json`** — perfil del usuario (Takeout). **No se versiona** (PII); ver `data/foxtube-profile.example.json`.
- **`db/foxtube_recommendations_schema.sql`** — esquema opcional si se mueve la telemetría a backend real.

---

## 🚀 Puesta en marcha

```bash
git clone https://github.com/Chriss-devv/foxtube.git
cd foxtube

# 1. Secretos y config (NO se versionan)
cp .env.example .env
cp config/config.example.yml config/config.yml

# 2. Genera claves
openssl rand -hex 16            # -> hmac_key en config/config.yml
#   define SERVER_SECRET_KEY en .env y el MISMO valor en
#   invidious_companion_key dentro de config/config.yml

# 3. (Opcional) tu perfil de recomendaciones
cp data/foxtube-profile.example.json data/foxtube-profile.json
#   y reemplázalo con tu export real de Google Takeout

# 4. Ajusta tu dominio en config/config.yml y nginx/default.conf
#    (reemplaza "yourdomain.example")

# 5. Arranca
docker compose up -d
```

La instancia queda en `http://localhost:3002` (configurable con `PROXY_PORT`).
Pon un reverse proxy con TLS (Caddy/Traefik/Nginx) delante para producción.

---

## 📱 Trabajo de responsividad

El CSS acumuló con el tiempo breakpoints dispersos (320/380/420/430/480/560/640/720/760/767/768px) que causaban saltos en móvil. La capa **`FOXTUBE RESPONSIVE HARMONIZATION v3`** (al final de `default.css`) los reconcilia en un sistema coherente:

| Rango        | Comportamiento                          |
|--------------|------------------------------------------|
| ≤ 480px      | Una columna, de borde a borde            |
| 481–767px    | 2 columnas donde se lee mejor            |
| 768–1023px   | Grid fluido `auto-fill`                   |
| ≥ 1024px     | Grids fluidos existentes                  |

Incluye además: prevención de scroll horizontal, objetivos táctiles ≥44px en `pointer: coarse`, navegación sticky con scroll horizontal en móvil, *safe-area insets* y `prefers-reduced-motion`.

---

## 🧠 Algoritmo de recomendaciones

Pipeline determinista de dos etapas que corre en el navegador. Documentación completa en [`docs/ALGORITHM.md`](docs/ALGORITHM.md) y [`docs/recommendation-engine-guide.md`](docs/recommendation-engine-guide.md).

- **Candidatos**: relacionados al historial, últimos de canales vistos/suscritos, búsquedas por temas del perfil y de la sesión, exploración controlada.
- **Ranking**: watch time, completion rate, CTR suavizado, afinidad de canal/tópico, frescura, popularidad, feedback explícito; diversificación final.
- **Feedback por card**: *Más así* / *No me interesa* / *No este canal*.
- **Estado** en `localStorage` con prefijo `ft_` (acotado y podado).

---

## 📂 Estructura

```
foxtube/
├── docker-compose.yml
├── .env.example
├── config/config.example.yml
├── assets/
│   ├── css/default.css            # tema + responsive
│   ├── js/yt-actions.js           # overlay UI + recomendaciones
│   ├── branding/{foxtube,favicon}.svg
│   └── ytube-clone.html
├── nginx/default.conf
├── db/foxtube_recommendations_schema.sql
├── data/foxtube-profile.example.json
└── docs/
    ├── ALGORITHM.md
    ├── css-design-guide.md
    └── recommendation-engine-guide.md
```

---

## 🔒 Privacidad y seguridad

- Secretos (`.env`, `config/config.yml`) y datos personales (`data/foxtube-profile.json`) están en `.gitignore`.
- `/foxtube-profile.json` tiene un *hotlink guard* por `Referer` y cabeceras `noindex`. Es endurecimiento básico, **no** autenticación fuerte: para privacidad real, sírvelo desde un backend autenticado.

---

## 📜 Licencia

[MIT](LICENSE). Invidious es AGPL-3.0; aquí no se modifica ni redistribuye su código fuente, solo se consume la imagen oficial mediante montajes y un overlay.
