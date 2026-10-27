import { Request, Response } from "express";
import mongoose, { isValidObjectId } from "mongoose";
import { Contest } from "../models/Contest";
import { Problem } from "../models/Problem";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/auth";


export const createContest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, description, startTime, endTime } = req.body;

  if (!title || !startTime || !endTime) {
    throw new ApiError(400, "Title, start time, and end time are required");
  }

  if (new Date(startTime) >= new Date(endTime)) {
    throw new ApiError(400, "End time must be strictly after the start time");
  }

  const contest = await Contest.create({
    title,
    description,
    startTime,
    endTime,
    createdBy: req.userId, 
    problems: [],
    participants: []
  });

  return res.status(201).json(
    new ApiResponse(201, contest, "Contest created successfully")
  );
});

export const getContests = asyncHandler(async (req: Request, res: Response) => {
  const contests = await Contest.find()
    .populate("createdBy", "username")
    .sort({ startTime: 1 }); 

  return res.status(200).json(
    new ApiResponse(200, contests, "Contests fetched successfully")
  );
});

export const addProblemToContest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { problemId } = req.body;

  if (!isValidObjectId(id) || !isValidObjectId(problemId)) {
    throw new ApiError(400, "Invalid id");
  }

  const contest = await Contest.findById(id);
  if (!contest) throw new ApiError(404, "Contest not found");

  if (contest.createdBy.toString() !== req.userId) {
    throw new ApiError(403, "Only the contest creator can add problems");
  }

  if (new Date() >= contest.startTime) {
    throw new ApiError(400, "Cannot change problems after the contest has started");
  }

  if (!(await Problem.exists({ _id: problemId }))) {
    throw new ApiError(404, "Problem not found");
  }

  await Contest.updateOne({ _id: id }, { $addToSet: { problems: problemId } });

  return res.status(200).json(new ApiResponse(200, null, "Problem added to contest"));
});

export const getContestById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid contest id");

  const contest = await Contest.findById(id);
  if (!contest) throw new ApiError(404, "Contest not found");

  const started = new Date() >= contest.startTime;
  const isOwner = contest.createdBy.toString() === req.userId;
  const data = contest.toObject();

  const problems = started || isOwner 
    ? await Problem.find({ _id: { $in: contest.problems } }).select("-testCases") 
    : [];

  return res.status(200).json(new ApiResponse(200, { ...data, problems }, "Contest fetched"));
});