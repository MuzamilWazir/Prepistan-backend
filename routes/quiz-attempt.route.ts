import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  SubmitQuizAttempt,
  GetUserQuizHistory,
  GetLeaderboard,
  GetUserRank,
} from "../controller/quiz-attempt.controller.js";

const router = Router();

router.post("/submit", requireAuth, SubmitQuizAttempt);
router.get("/history", requireAuth, GetUserQuizHistory);
router.get("/leaderboard", GetLeaderboard);
router.get("/leaderboard/me", requireAuth, GetUserRank);

export default router;
