import dotenv from "dotenv";
import { Config } from "infra/interfaces/config.interface.js";
import fs from 'fs';
import path from "path/win32";

dotenv.config({});

const nodeEnv = process.env.NODE_ENV || 'development';

const caPath = nodeEnv === 'production' ? '/etc/secrets/ca.pem' : path.resolve(process.cwd(), 'src/certs/ca.pem');

const getCA = (): string[] | undefined => {
  if (fs.existsSync(caPath)) {
    return [fs.readFileSync(caPath, 'utf-8')];
  }
  return undefined;
};


export const config: Config = {
  env: nodeEnv,
  isProduction: nodeEnv === "production",
  service: {
    port: Number(process.env.APP_SHOP_SERVICE_PORT || "3004"),
  },
  mongodb: {
    uri: process.env.APP_SHOP_MONGO_URI!,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessTokenExpireIn: process.env.JWT_ACCESS_EXPIRE_IN || "15m",
    refreshTokenExpireIn: process.env.JWT_REFRESH_EXPIRE_IN || "7d",
  },
  kafka: {
    brokers: process.env.APP_KAFKA_BROKER!,
    clientId: process.env.APP_SHOP_KAFKA_CLIENT_ID!,
    groupId: process.env.APP_SHOP_KAFKA_GROUP_ID!,
    retries: Number(process.env.APP_KAFKA_RETRIES || 5),
    retryDelay: Number(process.env.APP_KAFKA_RETRY_DELAY || 1000),
    sasl: {
      mechanism: process.env.APP_KAFKA_SASL_MECHANISM! as "plain" | "scram-sha-256" | "scram-sha-512",
      username: process.env.APP_KAFKA_SASL_USERNAME!,
      password: process.env.APP_KAFKA_SASL_PASSWORD!,
    },
    ssl: getCA() ? { rejectUnauthorized: true, ca: getCA() } : (process.env.APP_KAFKA_SSL === "true"),
    connectionTimeout: Number(process.env.APP_KAFKA_CONNECTION_TIMEOUT),
    requestTimeout: Number(process.env.APP_KAFKA_REQUEST_TIMEOUT),
    topics: {
      userEvents: process.env.KAFKA_TOPIC_USER_EVENTS!,
      shopEvents: process.env.KAFKA_TOPIC_SHOP_EVENTS!,
      orderEvents: process.env.KAFKA_TOPIC_ORDER_EVENTS!,
      paymentEvents: process.env.KAFKA_TOPIC_PAYMENT_EVENTS!,
      deliveryEvents: process.env.KAFKA_TOPIC_DELIVERY_EVENTS!,
    },
  },
  redis: {
    uri: process.env.APP_REDIS_URL!
  },
  elasticSearch: {
    node: process.env.APP_ELASTICSEARCH_NODE!,
  },
  cloudinary: {
    cloudName: process.env.APP_CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.APP_CLOUDINARY_API_KEY!,
    apiSecret: process.env.APP_CLOUDINARY_API_SECRET!,
  },
  razorpay: {
    keyId: process.env.APP_RAZORPAY_KEY_ID!,
    keySecret: process.env.APP_RAZORPAY_KEY_SECRET!,
    webhookSecret: process.env.APP_RAZORPAY_WEBHOOK_SECRET!,
  },
  services: {
    userService: process.env.APP_USER_SERVICE_URL!,
    adminService: process.env.APP_ADMIN_SERVICE_URL!,
    shopService: process.env.APP_SHOP_SERVICE_URL!,
    orderService: process.env.APP_ORDER_SERVICE_URL!,
    inventoryService: process.env.APP_INVENTORY_SERVICE_URL!,
    payoutService: process.env.APP_PAYOUT_SERVICE_URL!,
  },
};
