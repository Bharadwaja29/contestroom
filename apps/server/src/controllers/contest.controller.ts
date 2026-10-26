import { Request, Response } from "express";
import { Contest } from "../models/Contest";
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