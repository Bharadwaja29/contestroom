import { Router } from "express";
import { 
  createContest, 
  getContests, 
  getContestById, 
  addProblemToContest 
} from "../controllers/contest.controller";
import { protect } from "../middleware/auth";

const router = Router();

router.get("/", getContests);
router.post("/", protect, createContest);

router.get("/:id", protect, getContestById);
router.post("/:id/problems", protect, addProblemToContest);

export default router;