import { Router } from "express";
import {
  SubmitQuizAttempt,
  GetUserQuizHistory,
  GetLeaderboard,
} from "../controller/quiz-attempt.controller.js";
import { Auth } from "../middleware/auth.js";

const router = Router();

router.post("/submit", Auth, SubmitQuizAttempt);
router.get("/history", Auth, GetUserQuizHistory);
router.get("/leaderboard", GetLeaderboard);

export default router;
