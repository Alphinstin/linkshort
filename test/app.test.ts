// These tests need a real Postgres reachable at DATABASE_URL (or the
// default localhost one in src/db.ts) with schema.sql already applied.
// That's intentional — integration tests against a real DB catch things
// mocked tests never will (constraint violations, real query behavior).

import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { buildApp } from "../src/app";
import { pool } from "../src/db";
import { client } from "../src/redis";

const app = buildApp();

async function startRedis() {
  await client.connect();
}

test("POST /links creates a short link for a valid URL", async () => {
  const res = await request(app)
    .post("/links")
    .send({ url: "https://example.com/some/long/path" })
    .set("Content-Type", "application/json");

  assert.equal(res.status, 201);
  assert.ok(res.body.shortCode);
  assert.ok(res.body.shortUrl.includes(res.body.shortCode));
});

test("POST /links rejects a missing url", async () => {
  const res = await request(app)
    .post("/links")
    .send({})
    .set("Content-Type", "application/json");
  assert.equal(res.status, 400);
});

test("POST /links rejects an invalid url", async () => {
  const res = await request(app)
    .post("/links")
    .send({ url: "not-a-url" })
    .set("Content-Type", "application/json");
  assert.equal(res.status, 400);
});
startRedis();
test("GET /:shortCode redirects for an existing link", async () => {
  const create = await request(app)
    .post("/links")
    .send({ url: "https://example.com/redirect-target" })
    .set("Content-Type", "application/json");

  const res = await request(app).get(`/${create.body.shortCode}`);
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, "https://example.com/redirect-target");
});

test("GET /:shortCode returns 404 for an unknown code", async () => {
  const res = await request(app).get("/doesnotexist");
  assert.equal(res.status, 404);
});

test("GET /:shortCode only calls the datablse once if the value isn't in cache", async (t) => {
  const querySpy = t.mock.method(pool, "query");
  const create = await request(app)
    .post("/links")
    .send({ url: "https://example.com/redirect-target" })
    .set("Content-Type", "application/json");

  await request(app).get(`/${create.body.shortCode}`);
  await request(app).get(`/${create.body.shortCode}`);

  assert.equal(querySpy.mock.calls.length, 2);
  await client.quit();
  await pool.end();
});
