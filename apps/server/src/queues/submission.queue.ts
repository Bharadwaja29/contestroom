import { Queue } from "bullmq";
import { redis } from "../config/redis";

export const submissionQueue = new Queue("submissions", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});