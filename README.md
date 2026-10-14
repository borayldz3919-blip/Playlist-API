# Playlist API

SE4458 – Assignment 2 (Group 2: Playlist)
**Author:** Bora Yıldız

A simple REST API for managing a music playlist: add, edit, delete, search, sort, filter by genre, favorite and reorder songs. All data is stored in memory.

- **Source code:** https://github.com/<YOUR_USERNAME>/<YOUR_REPO>
- **Live deployment (Swagger UI):** https://<YOUR_APP>.onrender.com/api-docs

> The free Render tier sleeps after inactivity, so the first request may take ~30–60 seconds.

## Tech stack
- Node.js + Express 4
- swagger-ui-express (OpenAPI 3.0 definition in `swagger.js`)
- In-memory storage (a JavaScript array)
- Hosted on Render

## Run locally
```bash
npm install
npm start        # http://localhost:3000  (redirects to /api-docs)
npm test         # integration tests (supertest)
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/songs` | List songs. Query: `search`, `genre`, `favorite`, `sortBy` (position/title/artist/duration), `order` (asc/desc), `page`, `limit` |
| GET | `/songs/{id}` | Get one song |
| POST | `/songs` | Add a song |
| PUT | `/songs/{id}` | Replace a song (full update) |
| PATCH | `/songs/{id}` | Partial update |
| DELETE | `/songs/{id}` | Remove a song |
| PATCH | `/songs/{id}/favorite` | Toggle favorite (or set it with `{"favorite": true}`) |
| PATCH | `/songs/{id}/move` | Move a song to a new position (`{"position": 3}`) – replaces drag & drop |
| GET | `/playlist/summary` | Song count and total duration, e.g. `5 songs • 17 min 26 sec` |
| GET | `/genres` | Genres with song counts (for the "All Genres" filter) |
| GET | `/health` | Health check |

Example: `GET /songs?search=weeknd&sortBy=duration&order=desc`

## Design
- **Mapped from the UI mockup:** search box → `search`; "Sort by: Title (A–Z)" → `sortBy` + `order`; "All Genres" → `genre` + `/genres`; star icon → `/favorite`; pencil icon → `PUT/PATCH`; remove dialog → `DELETE`; "5 songs • 17 min 26 sec" → `/playlist/summary`; drag handle → `/move`.
- **Playlist order:** the songs array itself is the playlist order. `position` is computed from the array index, so it is always consistent after deletes and moves.
- **Duration** is stored as `durationSeconds` (integer) and returned also as a formatted string (`3:32`).
- **Layered responses:** list endpoint returns `{ data, meta }` with pagination info; errors always return `{ error, details[] }`.
- **Validation** is done by hand (no extra dependency): required fields, positive integer duration, boolean favorite, valid sort/paging params. Invalid input → `400`, unknown id → `404`, malformed JSON → `400`.
- **Seed data:** 5 songs from the mockup (total duration is exactly 17 min 26 sec).
- **Extra features:** pagination, favorite filter, reordering, genre list, summary, health check.

## Assumptions
- No authentication or multi-user support; there is a single global playlist.
- Data resets to the seed data whenever the server restarts (in-memory requirement).
- Search matches title, artist and album, case-insensitively, as a substring.
- Genre is free text; if omitted on creation it becomes `Unknown`.
- Cover images from the mockup are out of scope (no frontend).
- New songs are appended to the end of the playlist.

## Issues encountered
<!-- Replace with what you actually ran into. Examples: -->
- _(Write your own experience here, e.g. Render free tier cold start, choosing PUT vs PATCH, keeping `position` consistent after delete/move, Swagger setup problems, etc.)_
