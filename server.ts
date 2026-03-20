import mongoose from "mongoose";
import app from "./app.js";
import { config } from "./src/config/index.js";
import { UserEventHandler } from "./src/events/eventHandlers.js";
import { KafkaManager } from "./src/infra/kafka/index.js";

const PORT = config.service.port;

const startServer = async () => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log("MongoDB connected in Shop Service");

    const server = app.listen(PORT, () => {
      console.log(`Shop Service running on port ${PORT}`);
    });

    await KafkaManager.subscribe({
      topic: config.kafka.topics.shopEvents,
      handler: UserEventHandler.handle,
    });

    const shutdown = async (signal: string) => {
      console.log(`🛑 ${signal} received. Shutting down...`);

      server.close(async () => {
        console.log("📡 HTTP server closed.");

        await KafkaManager.shutdown();
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("❌ Service startup failed:", error);
    process.exit(1);
  }
};

startServer();
