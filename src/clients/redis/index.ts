import { Redis } from "ioredis";

export const redisClient = new Redis("redis://localhost:6379");
