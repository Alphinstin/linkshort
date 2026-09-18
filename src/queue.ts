import amqp, { Channel } from "amqplib";

let channel: Channel | undefined;
export const QUEUE: string = process.env.RABBITMQ_QUEUE || "clicks";
export async function connectQueue(): Promise<void> {
  const connection = await amqp.connect(
    process.env.RABBITMQ ||
      "amqp://linkshort:thisisarabbitmqpassword@localhost:5672",
  );
  channel = await connection.createChannel();
  await channel.assertQueue(QUEUE, {
    durable: true,
    arguments: {
      "x-queue-type": "quorum",
    },
  });
}

export function getChannel(): Channel {
  if (!channel) {
    throw new Error(
      "Queue channel not initialized - call connectQueue() first",
    );
  }
  return channel;
}
