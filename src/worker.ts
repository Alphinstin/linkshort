import { connectQueue, getChannel, QUEUE } from "./queue";

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
          const payload = JSON.parse(messageContent);

          console.log(`[x] received task;`, payload);

          channel.ack(msg);
        } catch (error) {
          console.error(`[!] Error processing message`);
          channel.nack(msg, false, false); // this might be modified in the future.
        }
      },
      { noAck: false },
    );
  } catch (error) {
    console.error(error);
  }
}
startWorker();
