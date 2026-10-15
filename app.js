const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerDoc = require("./swagger");

const app = express();
app.use(cors());
app.use(express.json());

/* ---------- In-memory "database" ---------- */
let nextId = 1;
const now = () => new Date().toISOString();
const makeSong = (title, artist, album, durationSeconds, genre, favorite) => ({
  id: nextId++, title, artist, album, durationSeconds, genre, favorite,
  createdAt: now(), updatedAt: now(),
});

// Array order = playlist order
let songs = [
  makeSong("Blinding Lights", "The Weeknd", "After Hours", 212, "Pop", true),
  makeSong("Levitating", "Dua Lipa", "Future Nostalgia", 220, "Pop", false),
  makeSong("Watermelon Sugar", "Harry Styles", "Fine Line", 214, "Pop", true),
  makeSong("Save Your Tears", "The Weeknd", "After Hours", 246, "R&B", false),
  makeSong("Peaches", "Justin Bieber", "Justice", 154, "Pop", true),
];

/* ---------- Helpers ---------- */
const fmtDuration = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const fmtTotal = (s) => `${Math.floor(s / 60)} min ${s % 60} sec`;
const view = (song) => ({
  id: song.id,
  position: songs.indexOf(song) + 1,
  title: song.title,
  artist: song.artist,
  album: song.album,
  durationSeconds: song.durationSeconds,
  duration: fmtDuration(song.durationSeconds),
  genre: song.genre,
  favorite: song.favorite,
  createdAt: song.createdAt,
  updatedAt: song.updatedAt,
});
const bad = (res, details, status = 400) =>
  res.status(status).json({ error: status === 404 ? "Not found" : "Validation failed", details });

const isStr = (v) => typeof v === "string" && v.trim().length > 0;

function validate(body, { partial }) {
  const errors = [];
  const has = (k) => body[k] !== undefined;
  if (!partial || has("title")) if (!isStr(body.title)) errors.push("title is required and must be a non-empty string");
  if (!partial || has("artist")) if (!isStr(body.artist)) errors.push("artist is required and must be a non-empty string");
  if (!partial || has("durationSeconds"))
    if (!Number.isInteger(body.durationSeconds) || body.durationSeconds <= 0)
      errors.push("durationSeconds is required and must be a positive integer");
  if (has("album") && typeof body.album !== "string") errors.push("album must be a string");
  if (has("genre") && typeof body.genre !== "string") errors.push("genre must be a string");
  if (has("favorite") && typeof body.favorite !== "boolean") errors.push("favorite must be a boolean");
  return errors;
}

const clean = (v) => (typeof v === "string" ? v.trim() : v);

function findSong(req, res) {
  const id = Number(req.params.id);
  const song = Number.isInteger(id) ? songs.find((s) => s.id === id) : undefined;
  if (!song) bad(res, [`Song with id '${req.params.id}' not found`], 404);
  return song;
}

/* ---------- Routes ---------- */
app.get("/", (req, res) => res.redirect("/api-docs"));
app.get("/health", (req, res) => res.json({ status: "ok", time: now() }));

app.get("/songs", (req, res) => {
  const { search, genre, favorite, sortBy = "position", order = "asc" } = req.query;
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);

  const errors = [];
  if (!["position", "title", "artist", "duration"].includes(sortBy)) errors.push("sortBy must be one of: position, title, artist, duration");
  if (!["asc", "desc"].includes(order)) errors.push("order must be 'asc' or 'desc'");
  if (!Number.isInteger(page) || page < 1) errors.push("page must be an integer >= 1");
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) errors.push("limit must be an integer between 1 and 100");
  if (favorite !== undefined && !["true", "false"].includes(favorite)) errors.push("favorite must be 'true' or 'false'");
  if (errors.length) return bad(res, errors);

  let list = songs.map(view); // position is derived from the array index

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter((s) => [s.title, s.artist, s.album].some((f) => (f || "").toLowerCase().includes(q)));
  }
  if (genre) list = list.filter((s) => (s.genre || "").toLowerCase() === String(genre).toLowerCase());
  if (favorite !== undefined) list = list.filter((s) => s.favorite === (favorite === "true"));

  const dir = order === "desc" ? -1 : 1;
  list.sort((a, b) => {
    if (sortBy === "duration") return (a.durationSeconds - b.durationSeconds) * dir;
    if (sortBy === "position") return (a.position - b.position) * dir;
    return String(a[sortBy]).localeCompare(String(b[sortBy]), undefined, { sensitivity: "base" }) * dir;
  });

  const total = list.length;
  const data = list.slice((page - 1) * limit, page * limit);
  res.json({ data, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } });
});

app.get("/songs/:id", (req, res) => {
  const song = findSong(req, res);
  if (song) res.json(view(song));
});

app.post("/songs", (req, res) => {
  const errors = validate(req.body || {}, { partial: false });
  if (errors.length) return bad(res, errors);
  const b = req.body;
  const song = makeSong(clean(b.title), clean(b.artist), clean(b.album) || "", b.durationSeconds, clean(b.genre) || "Unknown", b.favorite === true);
  songs.push(song);
  res.status(201).json(view(song));
});

app.put("/songs/:id", (req, res) => {
  const song = findSong(req, res);
  if (!song) return;
  const errors = validate(req.body || {}, { partial: false });
  if (errors.length) return bad(res, errors);
  const b = req.body;
  Object.assign(song, {
    title: clean(b.title), artist: clean(b.artist), album: clean(b.album) || "",
    durationSeconds: b.durationSeconds, genre: clean(b.genre) || "Unknown",
    favorite: b.favorite === true, updatedAt: now(),
  });
  res.json(view(song));
});

app.patch("/songs/:id", (req, res) => {
  const song = findSong(req, res);
  if (!song) return;
  const body = req.body || {};
  const errors = validate(body, { partial: true });
  if (errors.length) return bad(res, errors);
  for (const k of ["title", "artist", "album", "durationSeconds", "genre", "favorite"])
    if (body[k] !== undefined) song[k] = clean(body[k]);
  song.updatedAt = now();
  res.json(view(song));
});

app.delete("/songs/:id", (req, res) => {
  const song = findSong(req, res);
  if (!song) return;
  const deleted = view(song);
  songs = songs.filter((s) => s !== song);
  res.json({ message: `Removed "${deleted.title}" by ${deleted.artist} from the playlist`, deleted });
});

app.patch("/songs/:id/favorite", (req, res) => {
  const song = findSong(req, res);
  if (!song) return;
  const body = req.body || {};
  if (body.favorite !== undefined && typeof body.favorite !== "boolean") return bad(res, ["favorite must be a boolean"]);
  song.favorite = body.favorite === undefined ? !song.favorite : body.favorite;
  song.updatedAt = now();
  res.json(view(song));
});

app.patch("/songs/:id/move", (req, res) => {
  const song = findSong(req, res);
  if (!song) return;
  const pos = (req.body || {}).position;
  if (!Number.isInteger(pos) || pos < 1 || pos > songs.length)
    return bad(res, [`position must be an integer between 1 and ${songs.length}`]);
  songs = songs.filter((s) => s !== song);
  songs.splice(pos - 1, 0, song);
  song.updatedAt = now();
  res.json(songs.map(view));
});

app.get("/playlist/summary", (req, res) => {
  const total = songs.reduce((sum, s) => sum + s.durationSeconds, 0);
  res.json({
    songCount: songs.length,
    totalDurationSeconds: total,
    totalDuration: fmtTotal(total),
    favoriteCount: songs.filter((s) => s.favorite).length,
  });
});

app.get("/genres", (req, res) => {
  const counts = {};
  songs.forEach((s) => (counts[s.genre] = (counts[s.genre] || 0) + 1));
  res.json(Object.entries(counts).map(([genre, count]) => ({ genre, count })).sort((a, b) => a.genre.localeCompare(b.genre)));
});

/* ---------- Swagger ---------- */
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc, { customSiteTitle: "Playlist API" }));
app.get("/openapi.json", (req, res) => res.json(swaggerDoc));

/* ---------- Errors ---------- */
app.use((req, res) => res.status(404).json({ error: "Not found", details: [`${req.method} ${req.path} does not exist`] }));
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON body" });
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
