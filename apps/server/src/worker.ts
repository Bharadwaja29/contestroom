import "dotenv/config";
import { Worker } from "bullmq";
import { connectDB } from "./config/db";
import { redis } from "./config/redis";
import { Submission, ISubmission } from "./models/Submission";
import { Contest } from "./models/Contest";
import { Problem } from "./models/Problem";
import { recordAccepted, recordWrongAttempt } from "./services/leaderboard.service";

const judge = async (code: string): Promise<{ status: ISubmission["status"]; runtimeMs: number }> => {
  await new Promise((r) => setTimeout(r, 500)); 
  return code.includes("ACCEPT")
    ? { status: "accepted", runtimeMs: 42 }
    : { status: "wrong_answer", runtimeMs: 42 };
};

(async () => {
  await connectDB();

  const worker = new Worker(
    "submissions",
    async (job) => {
      const submission = await Submission.findById(job.data.submissionId);
      if (!submission || submission.status !== "pending") return;

      const [contest, problem] = await Promise.all([
        Contest.findById(submission.contestId),
        Problem.findById(submission.problemId),
      ]);
      if (!contest || !problem) throw new Error("Missing contest or problem");

      const verdict = await judge(submission.code);
      submission.status = verdict.status;
      submission.runtimeMs = verdict.runtimeMs;
      await submission.save();

      const cId = contest.id as string;
      const uId = submission.userId.toString();
      const pId = problem.id as string;

      if (submission.submittedAt < contest.endTime) {
        if (verdict.status === "accepted") {
          const minutes = Math.floor((submission.submittedAt.getTime() - contest.startTime.getTime()) / 60000);
          await recordAccepted(cId, uId, pId, minutes);
        } else {
          await recordWrongAttempt(cId, uId, pId);
        }
      }

      await redis.publish("leaderboard:updated", cId);
      await redis.publish(
        "submission:result",
        JSON.stringify({ userId: uId, submissionId: submission.id, status: submission.status })
      );
    },
    { connection: redis.duplicate(), concurrency: 2 }
  );

  worker.on("completed", (job) => console.log(`job ${job.id} done`));
  worker.on("failed", (job, err) => console.error(`job ${job?.id} failed:`, err.message));
  console.log("Worker running");
})();