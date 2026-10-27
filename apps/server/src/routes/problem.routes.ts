import { Router } from "express";
import { createProblem, getProblem } from "../controllers/problem.controller";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/", protect, createProblem);
router.get("/:id", protect, getProblem);

export default router;