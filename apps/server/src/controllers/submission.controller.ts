import { Response } from "express";
import { isValidObjectId } from "mongoose";
import { Contest } from "../models/Contest";
import { Submission } from "../models/Submission";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/auth";
import { submissionQueue } from "../queues/submission.queue";
import { redis } from "../config/redis";

const LANGUAGES = ["cpp", "python", "javascript", "java"];
const MAX_CODE_BYTES = 64 * 1024;

export const createSubmission = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { contestId, problemId, code, language } = req.body;

  if (!isValidObjectId(contestId) || !isValidObjectId(problemId)) throw new ApiError(400, "Invalid ID");
  if (typeof code !== "string" || !code.trim()) throw new ApiError(400, "Code is required");
  if (Buffer.byteLength(code) > MAX_CODE_BYTES) throw new ApiError(413, "Code too large");
  if (!LANGUAGES.includes(language)) throw new ApiError(400, "Invalid language");

  const contest = await Contest.findById(contestId);
  if (!contest) throw new ApiError(404, "Contest not found");

  const now = new Date();
  if (now < contest.startTime) throw new ApiError(400, "Contest has not started");
  if (now >= contest.endTime) throw new ApiError(400, "Contest has ended");

  
  const userId = (req as any).userId || (req as any).user?.id;

  if (!contest.participants.some((p) => p.toString() === userId)) {
    throw new ApiError(403, "Join the contest first");
  }
  if (!contest.problems.some((p) => p.toString() === problemId)) {
    throw new ApiError(400, "Problem is not part of this contest");
  }

  // Basic rate limit: one submission per user per problem every 5 seconds
  const allowed = await redis.set(`ratelimit:submit:${userId}:${problemId}`, "1", "EX", 5, "NX");
  if (!allowed) throw new ApiError(429, "Wait a few seconds before submitting again");

  const submission = await Submission.create({
    userId,
    contestId,
    problemId,
    code,
    language,
  });

  await submissionQueue.add("judge", { submissionId: submission.id }, { jobId: submission.id });

  return res.status(202).json(new ApiResponse(202, { submissionId: submission.id, status: "pending" }, "Submission queued"));
});

export const getSubmission = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid submission id");

  const submission = await Submission.findById(id);
  if (!submission) throw new ApiError(404, "Submission not found");
  
  const userId = (req as any).userId || (req as any).user?.id;
  if (submission.userId.toString() !== userId) throw new ApiError(403, "Not your submission");

  return res.status(200).json(new ApiResponse(200, submission, "Submission fetched"));
});