import { Router } from "express";
import {
  SubmitQuizAttempt,
  GetUserQuizHistory,
  GetLeaderboard,
} from "../controller/quiz-attempt.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/submit", requireAuth, SubmitQuizAttempt);
router.get("/history", requireAuth, GetUserQuizHistory);
router.get("/leaderboard", GetLeaderboard);

export default router;
