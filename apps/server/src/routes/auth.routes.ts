import { Router } from "express";
import { register, login, refresh, logout } from "../controllers/auth.controller";
import { protect, AuthRequest } from "../middleware/auth";
import { User } from "../models/User";
import { ApiResponse } from "../utils/ApiResponse";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);


router.post("/logout", protect, logout);

router.get("/me", protect, async (req: AuthRequest, res) => {
  const user = await User.findById(req.userId).select("-password -refreshToken");
  res.json(new ApiResponse(200, user, "Current user fetched"));
});

export default router;