import { buildApp } from "./app";
import { client } from "./redis";
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const app = buildApp();
async function main() {
  try {
    await client.connect();
  } catch (err) {
    throw new Error("Unable to connect to redis client", { cause: err });
  }

  app.listen(PORT, () => {
    console.log(`linkshort listening on port ${PORT}`);
  });
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
