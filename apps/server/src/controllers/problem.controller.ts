import { Response } from "express";
import { isValidObjectId } from "mongoose";
import { Problem } from "../models/Problem";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/auth";

export const createProblem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, description, difficulty, constraints, testCases, timeLimitMs, memoryLimitMb } = req.body;

  if (!title || !description || !difficulty) {
    throw new ApiError(400, "Title, description and difficulty are required");
  }
  if (!["easy", "medium", "hard"].includes(difficulty)) {
    throw new ApiError(400, "Difficulty must be easy, medium or hard");
  }
  if (!Array.isArray(testCases) || testCases.length === 0) {
    throw new ApiError(400, "At least one test case is required");
  }

  const problem = await Problem.create({
    title, 
    description, 
    difficulty, 
    constraints, 
    testCases,
    timeLimitMs, 
    memoryLimitMb,
    createdBy: req.userId,
  });

  return res.status(201).json(new ApiResponse(201, problem, "Problem created"));
});

export const getProblem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid problem id");

  const problem = await Problem.findById(id);
  if (!problem) throw new ApiError(404, "Problem not found");

  const data = problem.toObject();
  
  if (problem.createdBy?.toString() !== req.userId) {
    data.testCases = data.testCases.filter((tc: any) => !tc.isHidden);
  }

  return res.status(200).json(new ApiResponse(200, data, "Problem fetched"));
});