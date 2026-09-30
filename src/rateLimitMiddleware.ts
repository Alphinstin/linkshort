import { Request, Response, NextFunction } from "express";
import { checkRateLimit } from "./rateLimit";
export const routesMaxCounter = {
  "/:shortCode": 10,
  "/links": 5,
};
export function rateLimiter(options: {
  windowMs: number;
  max: number;
  keyPrefix: string;
  failOpen: boolean;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `ratelimit:${options.keyPrefix}:${req.ip}`;
    try {
      const isRequestAllowed = await checkRateLimit(
        key,
        options.windowMs,
        options.max,
      );
      if (isRequestAllowed) {
        next();
      } else {
        res
          .status(429)
          .set("Retry-After", `${options.windowMs / 1000}`)
          .end();
      }
    } catch (error) {
      if (!options.failOpen) {
        res
          .status(500)
          .json({ error: "Internal server error, try again later" });
        return;
      }
      next();
    }
  };
}
