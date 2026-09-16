# linkshort (TypeScript)

Step 2 of the plan: the smallest working slice. No Redis, no queue, no
Docker for the app itself — just create + redirect, backed by Postgres,
with tests.

## Run it locally

1. Start Postgres (this also applies `schema.sql` automatically on first run):
   ```
   docker compose up -d
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Run the tests:
   ```
   npm test
   ```
4. Typecheck without emitting (fast feedback loop while you code):
   ```
   npm run typecheck
   ```
5. Start the dev server (auto-restarts on change):
   ```
   npm run dev
   ```
6. Build + run the compiled JS (what you'd actually deploy):
   ```
   npm run build
   npm start
   ```
7. Try it:
   ```
   curl -X POST localhost:3000/links -H 'Content-Type: application/json' \
     -d '{"url": "https://example.com/some/long/path"}'

   curl -i localhost:3000/<shortCode>
   ```

## What changed vs. the JS version

- `tsx` runs `.ts` files directly in dev/test, no separate compile step needed
  while iterating.
- `tsc` compiles `src/` to `dist/` for anything you'd actually deploy —
  deploy the compiled JS, not the TS source, in production.
- `strict: true` and `noUncheckedIndexedAccess: true` are on in
  `tsconfig.json` on purpose — they're the settings that catch real bugs
  (e.g. forgetting a Postgres query might return zero rows). Don't loosen
  them to make errors go away; fix the underlying case instead.
- Request/response bodies are typed (see `src/types.ts`), so an endpoint
  returning the wrong shape is now a compile error, not a runtime surprise.

## What's deliberately missing (for now)

- **Redis caching** — comes once this is solid; you should be able to
  measure the latency difference yourself once it's added.
- **Queue + worker for click analytics** — the redirect handler has a
  `TODO` marking exactly where the event publish will go. Don't write
  analytics synchronously in that handler.
- **Rate limiting** — add once the core flow is boring and reliable.
- **Docker for the app** — containerize once the app itself is done and
  tested; don't debug Docker and app logic at the same time.

## Notes on a couple of design choices

- Short codes are generated with `nanoid(7)` and retried on collision
  (Postgres unique constraint, `23505`) rather than assumed unique.
  Worth being able to explain why in an interview: 7 url-safe chars gives
  a huge space, but "huge" isn't "zero," so handle it.
- `expires_at` is in the schema but unused by `/links` yet — wire it up
  once you want to practice a scheduled cleanup job (nice later exercise
  for the worker service).
