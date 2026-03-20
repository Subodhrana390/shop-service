import { Consumer, SASLOptions, Kafka, KafkaMessage, Producer } from "kafkajs";
import { v4 as uuidv4 } from "uuid";
import { config } from "../../config/index.js";

interface KafkaEvent<T = any> {
  id: string;
  type: string;
  timestamp: string;
  service: string;
  version: string;
  data: T;
  metadata: {
    userId?: string;
    [key: string]: any;
  };
}

interface PublishParams<T = any> {
  topic: string;
  eventType: string;
  payload: T;
  metadata?: {
    userId?: string;
    [key: string]: any;
  };
}

interface SubscribeParams {
  topic: string;
  groupId?: string;
  handler: (
    event: KafkaEvent,
    context: {
      topic: string;
      partition: number;
      offset: string;
      headers?: KafkaMessage["headers"];
    },
  ) => Promise<void>;
}

interface SubscribeManyParams {
  topics: string[];
  groupId?: string;
  handler: SubscribeParams["handler"];
}

const sasl: SASLOptions = {
  mechanism: config.kafka.sasl.mechanism,
  username: config.kafka.sasl.username,
  password: config.kafka.sasl.password,
};

const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: [config.kafka.brokers],
  retry: {
    initialRetryTime: config.kafka.retryDelay,
    retries: config.kafka.retries,
  },
  sasl,
  ssl: config.kafka.ssl,
  connectionTimeout: config.kafka.connectionTimeout,
  requestTimeout: config.kafka.requestTimeout,
});

let producer: Producer | null = null;
let consumer: Consumer | null = null;

export const KafkaManager = {
  async getProducer(): Promise<Producer> {
    if (!producer) {
      producer = kafka.producer({ allowAutoTopicCreation: true });
      await producer.connect();
      console.log("📤 Kafka Producer connected");
    }
    return producer;
  },

  async getConsumer(groupId?: string): Promise<Consumer> {
    if (!consumer) {
      consumer = kafka.consumer({
        groupId: groupId || config.kafka.groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        rebalanceTimeout: 60000,
      });
      await consumer.connect();
      console.log("📥 Kafka Consumer connected");
    }
    return consumer;
  },

  /* -------- PRODUCE EVENT -------- */

  async publish<T>({
    topic,
    eventType,
    payload,
    metadata = {},
  }: PublishParams<T>): Promise<KafkaEvent<T>> {
    const producer = await this.getProducer();

    const event: KafkaEvent<T> = {
      id: uuidv4(),
      type: eventType,
      timestamp: new Date().toISOString(),
      service: config.kafka.clientId,
      version: "1.0",
      data: payload,
      metadata: {
        ...metadata,
        userId: metadata.userId,
      },
    };

    await producer.send({
      topic,
      messages: [
        {
          key: event.metadata.userId ?? event.id,
          value: JSON.stringify(event),
          headers: {
            "event-type": event.type,
            service: event.service,
          },
        },
      ],
    });

    console.log(`✅ Event published → ${event.type}`);
    return event;
  },

  /* -------- SUBSCRIBE SINGLE -------- */

  async subscribe({ topic, groupId, handler }: SubscribeParams): Promise<void> {
    const consumer = await this.getConsumer(groupId);

    await consumer.subscribe({ topic, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (!message.value) return;

          const event: KafkaEvent = JSON.parse(message.value.toString());

          // if (event.service === config.kafka.clientId) return;

          await handler(event, {
            topic,
            partition,
            offset: message.offset,
            headers: message.headers,
          });
        } catch (err) {
          console.error("❌ Kafka message processing error:", err);
        }
      },
    });

    console.log(`📥 Subscribed → ${topic}`);
  },

  async subscribeMany({
    topics,
    handler,
    groupId,
  }: SubscribeManyParams): Promise<void> {
    if (!topics.length) {
      throw new Error("Kafka subscribeMany: topics array required");
    }

    const consumer = await this.getConsumer(groupId);

    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
    }

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (!message.value) return;

          const event: KafkaEvent = JSON.parse(message.value.toString());

          // if (event.service === config.kafka.clientId) return;

          await handler(event, {
            topic,
            partition,
            offset: message.offset,
            headers: message.headers,
          });
        } catch (err) {
          console.error("❌ Kafka handler error:", err);
        }
      },
    });

    console.log(`Kafka consumer running for topics: ${topics.join(", ")}`);
  },

  async shutdown(): Promise<void> {
    try {
      if (producer) await producer.disconnect();
      if (consumer) await consumer.disconnect();

      producer = null;
      consumer = null;

      console.log("🛑 Kafka connections closed");
    } catch (err) {
      console.error("❌ Kafka shutdown error:", err);
    }
  },
};
