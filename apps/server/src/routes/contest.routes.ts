import { Router } from "express";
import { createContest, getContests } from "../controllers/contest.controller";
import { protect } from "../middleware/auth";

const router = Router();


router.get("/", getContests);


router.post("/", protect, createContest);

export default router;