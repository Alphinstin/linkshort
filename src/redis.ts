import { createClient } from "redis";

export const client = createClient({
  url:
    process.env.REDIS_URL ||
    "redis://default:thisisaredispassword@localhost:6379",
});
