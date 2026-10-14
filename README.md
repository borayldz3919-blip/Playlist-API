# Playlist API

**SE4458 – Assignment 2 · Group 2 (Playlist)**
**Author:** Bora Yıldız

A simple REST API for a music playlist: add, edit, delete, search, sort, filter by genre, favorite and reorder songs. Data is kept in memory. There is no frontend, only the API and its Swagger page.

| | |
|---|---|
| **Source code** | https://github.com/borayldz3919-blip/Playlist-API |
| **Live Swagger UI** | https://playlist-api-6zm5.onrender.com/api-docs |

> Render's free tier sleeps when idle, so the first request can take 30–60 seconds.

## Tech
Node.js, Express 4, swagger-ui-express (OpenAPI 3), in-memory array as storage, deployed on Render.

## Run locally
```bash
npm install
npm start    # http://localhost:3000 -> redirects to /api-docs
npm test     # integration tests
```

## Endpoints

| Method | Path | What it does |
|---|---|---|
| GET | `/songs` | List songs with `search`, `genre`, `favorite`, `sortBy`, `order`, `page`, `limit` |
| GET | `/songs/{id}` | Get one song |
| POST | `/songs` | Add a song |
| PUT | `/songs/{id}` | Full update |
| PATCH | `/songs/{id}` | Partial update |
| DELETE | `/songs/{id}` | Remove a song |
| PATCH | `/songs/{id}/favorite` | Toggle favorite |
| PATCH | `/songs/{id}/move` | Move to a new position (drag & drop) |
| GET | `/playlist/summary` | Song count and total duration |
| GET | `/genres` | Genres with counts |
| GET | `/health` | Health check |

`sortBy` can be `position`, `title`, `artist` or `duration`; `order` is `asc` or `desc`.

**Example**

`GET /songs?search=weeknd&sortBy=duration&order=desc`

```json
{
  "data": [
    { "id": 4, "position": 4, "title": "Save Your Tears", "artist": "The Weeknd",
      "album": "After Hours", "durationSeconds": 246, "duration": "4:06",
      "genre": "R&B", "favorite": false }
  ],
  "meta": { "total": 2, "page": 1, "limit": 20, "totalPages": 1 }
}
```

Errors always look like `{ "error": "...", "details": ["..."] }` with status `400` (invalid input) or `404` (song not found).

## Design
- **Mockup to API:** the search box maps to `search`, the sort and genre dropdowns to `sortBy`/`order`/`genre`, the star to `/favorite`, the pencil to `PUT`/`PATCH`, the remove dialog to `DELETE`, the header "5 songs • 17 min 26 sec" to `/playlist/summary`, and the drag handle to `/move`.
- **Playlist order** is the order of the array itself. `position` is calculated from the array index, so it stays correct after deletes and moves.
- **Duration** is stored in seconds and also returned as text (`3:32`).
- **Validation** is written by hand: title and artist must be non-empty, duration a positive integer, favorite a boolean.
- **Seed data:** the 5 songs from the mockup, 17 min 26 sec in total.

## Assumptions
- One global playlist, no login or users.
- Data resets to the seed songs when the server restarts.
- Search is case-insensitive and checks title, artist and album.
- If genre is not given, it becomes `Unknown`.
- New songs are added to the end of the playlist.

## Issues encountered
- **Framework choice:** I considered FastAPI (automatic Swagger) but chose Express because the assignment's example project uses Node. Swagger had to be written manually as an OpenAPI definition.
- **Drag & drop in a REST API:** there is no direct equivalent, so I added `PATCH /songs/{id}/move` with the target position.
- **Keeping order consistent:** storing a `position` field broke after deletes, so it is now derived from the array index.
- **In-memory data on Render:** the free instance restarts and sleeps, which resets the data to the seed songs.
