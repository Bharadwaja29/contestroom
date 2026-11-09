import { Router } from "express";
import { createSubmission, getSubmission } from "../controllers/submission.controller";
import { protect } from "../middleware/auth";

const router = Router();
router.post("/", protect, createSubmission);
router.get("/:id", protect, getSubmission);
export default router;