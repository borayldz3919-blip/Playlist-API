const request = require("supertest");
const assert = require("assert");
const app = require("./app");

(async () => {
  let r = await request(app).get("/playlist/summary");
  assert.strictEqual(r.body.totalDuration, "17 min 26 sec");
  assert.strictEqual(r.body.songCount, 5);

  r = await request(app).get("/songs?sortBy=title&order=asc");
  assert.deepStrictEqual(r.body.data.map((s) => s.title), ["Blinding Lights", "Levitating", "Peaches", "Save Your Tears", "Watermelon Sugar"]);

  r = await request(app).get("/songs?search=weeknd");
  assert.strictEqual(r.body.meta.total, 2);
  r = await request(app).get("/songs?genre=r%26b");
  assert.strictEqual(r.body.meta.total, 1);
  r = await request(app).get("/songs?favorite=true&sortBy=duration&order=desc");
  assert.deepStrictEqual(r.body.data.map((s) => s.id), [3, 1, 5]);
  r = await request(app).get("/songs?limit=2&page=3");
  assert.strictEqual(r.body.data.length, 1);
  assert.strictEqual((await request(app).get("/songs?sortBy=foo")).status, 400);

  r = await request(app).post("/songs").send({ title: "Test", artist: "A", durationSeconds: 100, genre: "Rock" });
  assert.strictEqual(r.status, 201);
  const id = r.body.id;
  assert.strictEqual((await request(app).post("/songs").send({ title: "", durationSeconds: -1 })).status, 400);

  r = await request(app).patch(`/songs/${id}/favorite`);
  assert.strictEqual(r.body.favorite, true);
  r = await request(app).patch(`/songs/${id}/move`).send({ position: 1 });
  assert.strictEqual(r.body[0].id, id);
  assert.strictEqual((await request(app).patch(`/songs/${id}/move`).send({ position: 99 })).status, 400);

  r = await request(app).put(`/songs/${id}`).send({ title: "T2", artist: "B", durationSeconds: 50 });
  assert.strictEqual(r.body.title, "T2");
  r = await request(app).patch(`/songs/${id}`).send({ genre: "Jazz" });
  assert.strictEqual(r.body.genre, "Jazz");
  assert.strictEqual(r.body.title, "T2");

  assert.strictEqual((await request(app).delete(`/songs/${id}`)).status, 200);
  assert.strictEqual((await request(app).get(`/songs/${id}`)).status, 404);
  assert.strictEqual((await request(app).get("/api-docs/")).status, 200);
  console.log("ALL TESTS PASSED");
})().catch((e) => { console.error(e); process.exit(1); });
