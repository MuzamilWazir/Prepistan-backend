import { Response } from "express";
import { QuizAttempt, type AuthRequest } from "../model/quiz-attempt.model.js";
import { User } from "../model/user.model.js";

export const SubmitQuizAttempt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { quizMode, category, subject, totalQuestions, correctAnswers, wrongAnswers, timeSpentSeconds } = req.body;

    const attempt = new QuizAttempt({
      userId,
      quizMode,
      category,
      subject,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      timeSpentSeconds,
    });

    await attempt.save();

    // Fetch user to calculate streak properly
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const rewardXp = correctAnswers * 10;
    const rewardCoins = correctAnswers * 2;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt) : null;
    const lastActiveStart = lastActive
      ? new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate())
      : null;

    let newStreak = user.streak;
    let newLongestStreak = user.longestStreak;

    if (!lastActiveStart) {
      // First ever activity
      newStreak = 1;
    } else if (lastActiveStart.getTime() === todayStart.getTime()) {
      // Already active today — don't change streak
      newStreak = user.streak;
    } else {
      const diffMs = todayStart.getTime() - lastActiveStart.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        // Active yesterday — extend streak
        newStreak = user.streak + 1;
      } else {
        // Missed a day or more — reset streak
        newStreak = 1;
      }
    }

    if (newStreak > newLongestStreak) {
      newLongestStreak = newStreak;
    }

    await User.findByIdAndUpdate(userId, {
      $inc: { xp: rewardXp, coins: rewardCoins },
      $set: {
        streak: newStreak,
        longestStreak: newLongestStreak,
        lastActiveAt: now,
      },
    });

    res.status(201).json({ message: "Quiz attempt recorded", attempt, rewards: { xp: rewardXp, coins: rewardCoins } });
  } catch (error) {
    console.error("Error submitting quiz attempt:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const GetUserQuizHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const attempts = await QuizAttempt.find({ userId }).sort({ date: -1 }).limit(50);
    res.json({ attempts });
  } catch (error) {
    console.error("Error fetching quiz history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const GetLeaderboard = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leaderboard = await User.find({})
      .sort({ xp: -1 })
      .limit(20)
      .select("name xp coins level avatarUrl role");

    res.json({ leaderboard });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
