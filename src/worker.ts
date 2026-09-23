import { closeQueue, connectQueue, getChannel, QUEUE } from "./queue";
import { pool } from "./db";
import { ClickEventsRow } from "./types";

async function startWorker() {
  try {
    await connectQueue();
    const channel = getChannel();

    await channel.consume(
      QUEUE,
      async (msg) => {
        if (msg === null) return;

        try {
          const messageContent = msg.content.toString();
          const payload = JSON.parse(messageContent) as Omit<
            ClickEventsRow,
            "id" | "time_stamp"
          >;

          console.log(`[x] received task;`, payload);
          const result = await pool.query<Pick<ClickEventsRow, "short_code">>(
            "INSERT INTO click_events (short_code, ip_address, user_agent) VALUES ($1, $2, $3) RETURNING short_code",
            [payload.short_code, payload.ip_address, payload.user_agent],
          );

          const row = result.rows[0];
          if (!row) {
            throw new Error("There was an issue adding the click event");
          }
          channel.ack(msg);
        } catch (error) {
          console.error(`[!] Error processing message`);
          channel.nack(msg, false, false); // this might be modified in the future.
        }
      },
      { noAck: false },
    );
    process.on("SIGTERM", async () => {
      await cleanUp();
    });

    process.on("SIGINT", async () => {
      await cleanUp();
    });
  } catch (error) {
    console.error(error);
  }
}
async function cleanUp() {
  await closeQueue();
  process.exit(0);
}
startWorker();
