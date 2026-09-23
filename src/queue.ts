import amqp, { Channel } from "amqplib";

let channel: Channel | undefined;
export const QUEUE: string = process.env.RABBITMQ_QUEUE || "clicks";
export let QUEUE_CONNECTION: amqp.ChannelModel | undefined;
export async function connectQueue(): Promise<void> {
  QUEUE_CONNECTION = await amqp.connect(
    process.env.RABBITMQ ||
      "amqp://linkshort:thisisarabbitmqpassword@localhost:5672",
  );
  channel = await QUEUE_CONNECTION.createChannel();
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

export async function closeQueue() {
  if (!QUEUE_CONNECTION) {
    throw new Error(
      "Redis connection doesn't exist - call connectQueue() first",
    );
  }
  if (!channel) {
    throw new Error(
      "Queue channel not initialized - call connectQueue() first",
    );
  }
  await channel.close();
  await QUEUE_CONNECTION.close();
  channel = undefined;
  QUEUE_CONNECTION = undefined;
}
