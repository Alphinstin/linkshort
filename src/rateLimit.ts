import { readFileSync } from "node:fs";
import path from "node:path";
import { client } from "./redis";
const fileContents: string = readFileSync(
  path.join(__dirname, "rateLimit.lua"),
  "utf8",
);

export async function checkRateLimit(
  key: string,
  windowMs: number,
  max: number,
): Promise<boolean> {
  const accepted = await client.eval(fileContents, {
    keys: [key],
    arguments: [Date.now().toString(), windowMs.toString(), max.toString()],
  });

  return accepted === 1;
}
