import { Redis } from "ioredis";
import { config } from "../../config/index.js";

const redisClient = new Redis(config.redis.uri);

export default redisClient;