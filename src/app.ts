import express, { Express, Request, Response } from "express";
import { nanoid } from "nanoid";
import { pool } from "./db";
import {
  CreateLinkRequestBody,
  CreateLinkResponseBody,
  ErrorResponseBody,
  LinkRow,
} from "./types";
import { client } from "./redis";
import { SetOptions } from "redis";
// Narrow an unknown catch value down to "looks like a pg DatabaseError"
// without pulling in pg's internal error class. 23505 = unique_violation.
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "23505"
  );
}

export function buildApp(): Express {
  const app = express();
  app.use(express.json());

  app.post(
    "/links",
    async (
      req: Request<
        {},
        CreateLinkResponseBody | ErrorResponseBody,
        CreateLinkRequestBody
      >,
      res: Response<CreateLinkResponseBody | ErrorResponseBody>,
    ) => {
      const { url } = req.body;

      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "url is required" });
      }

      try {
        // eslint-disable-next-line no-new
        new URL(url);
      } catch {
        return res
          .status(400)
          .json({ error: "url must be a valid absolute URL" });
      }

      // Retry on short_code collision instead of assuming nanoid never
      // collides. At this length collisions are rare but not impossible,
      // and handling it now means you don't get paged by it later.
      const MAX_ATTEMPTS = 5;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const shortCode = nanoid(7);
        try {
          const result = await pool.query<Pick<LinkRow, "short_code">>(
            "INSERT INTO links (short_code, original_url) VALUES ($1, $2) RETURNING short_code",
            [shortCode, url],
          );
          const row = result.rows[0];
          if (!row) {
            return res.status(500).json({ error: "internal error" });
          }
          return res.status(201).json({
            shortCode: row.short_code,
            shortUrl: `${req.protocol}://${req.get("host")}/${row.short_code}`,
          });
        } catch (err) {
          if (!isUniqueViolation(err)) {
            console.error("Failed to create link", err);
            return res.status(500).json({ error: "internal error" });
          }
          // else: collision, loop and try again
        }
      }

      return res
        .status(500)
        .json({ error: "could not generate a unique short code, try again" });
    },
  );

  app.get(
    "/:shortCode",
    async (
      req: Request<{ shortCode: string }>,
      res: Response<ErrorResponseBody | void>,
    ) => {
      const { shortCode } = req.params;
      try {
        let result;
        if (process.env.CACHE_BYPASS === "false") {
          result = await client.get(shortCode);
        }

        if (!result || process.env.CACHE_BYPASS === "true") {
          result = await pool.query<
            Pick<LinkRow, "original_url" | "expires_at">
          >(
            "SELECT original_url, expires_at FROM links WHERE short_code = $1",
            [shortCode],
          );
        } else {
          result = { rows: [JSON.parse(result)] };
        }
        const row = result.rows[0];
        if (!row) {
          return res.status(404).json({ error: "short link not found" });
        }

        if (row.expires_at && new Date(row.expires_at) < new Date()) {
          return res.status(410).json({ error: "short link has expired" });
        }
        const setOptions: SetOptions = {
          condition: "NX",
        };
        if (row.expires_at != null) {
          setOptions["expiration"] = {
            type: "PX",
            value: new Date(row.expires_at).getTime() - new Date().getTime(),
          };
        }
        // TODO (week 5): publish a click event to the queue here instead
        // of nothing. Keep this handler fast — no synchronous analytics writes.
        if (process.env.CACHE_BYPASS === "false") {
          await client.set(shortCode, JSON.stringify(row), setOptions);
        }

        return res.redirect(302, row.original_url);
      } catch (err) {
        console.error("Failed to resolve short link", err);
        return res.status(500).json({ error: "internal error" });
      }
    },
  );

  return app;
}
