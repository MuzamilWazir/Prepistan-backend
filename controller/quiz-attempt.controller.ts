import { Request, Response } from "express";
import { QuizAttempt } from "../model/quiz-attempt.model.js";
import { User } from "../model/user.model.js";
import type { AuthRequest } from "../middleware/auth.js";

export const SubmitQuizAttempt = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user?.userId;
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
      newStreak = 1;
    } else if (lastActiveStart.getTime() === todayStart.getTime()) {
      newStreak = user.streak;
    } else {
      const diffMs = todayStart.getTime() - lastActiveStart.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newStreak = user.streak + 1;
      } else {
        newStreak = 1;
      }
    }

    if (newStreak > newLongestStreak) {
      newLongestStreak = newStreak;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { xp: rewardXp, coins: rewardCoins },
        $set: {
          streak: newStreak,
          longestStreak: newLongestStreak,
          lastActiveAt: now,
        },
      },
      { new: true }
    ).select("-password");

    res.status(201).json({
      message: "Quiz attempt recorded",
      attempt,
      rewards: { xp: rewardXp, coins: rewardCoins },
      streak: newStreak,
      longestStreak: newLongestStreak,
      userXp: updatedUser?.xp ?? user.xp + rewardXp,
      userCoins: updatedUser?.coins ?? user.coins + rewardCoins,
    });
  } catch (error) {
    console.error("Error submitting quiz attempt:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const GetUserQuizHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user?.userId;
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

function getDateRange(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case "Daily":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "Weekly": {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
    }
    case "Monthly":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return null;
  }
}

export const GetLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = "Overall" } = req.query as { period?: string };

    if (period === "Overall") {
      const leaderboard = await User.find({ role: { $nin: ["Admin", "Super Admin"] } })
        .sort({ xp: -1 })
        .limit(20)
        .select("name xp coins level avatarUrl role streak");

      res.json({ leaderboard });
      return;
    }

    const dateRange = getDateRange(period);
    if (!dateRange) {
      const leaderboard = await User.find({ role: { $nin: ["Admin", "Super Admin"] } })
        .sort({ xp: -1 })
        .limit(20)
        .select("name xp coins level avatarUrl role streak");
      res.json({ leaderboard });
      return;
    }

    const aggregated = await QuizAttempt.aggregate([
      { $match: { date: { $gte: dateRange } } },
      { $group: { _id: "$userId", xp: { $sum: { $multiply: ["$correctAnswers", 10] } }, coins: { $sum: { $multiply: ["$correctAnswers", 2] } } } },
      { $sort: { xp: -1 } },
      { $limit: 20 },
    ]);

    const userIds = aggregated.map((a) => a._id);
    const users = await User.find({ _id: { $in: userIds } })
      .select("name xp coins level avatarUrl role streak");

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    const leaderboard = aggregated
      .map((a, i) => {
        const user = userMap.get(a._id.toString());
        if (!user) return null;
        return {
          rank: i + 1,
          _id: user._id,
          name: user.name,
          xp: a.xp,
          coins: a.coins,
          level: user.level,
          avatarUrl: user.avatarUrl,
          role: user.role,
          streak: user.streak,
        };
      })
      .filter(Boolean);

    res.json({ leaderboard });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const GetUserRank = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { period = "Overall" } = req.query as { period?: string };
    const dateRange = getDateRange(period);

    const user = await User.findById(userId).select("name xp coins level avatarUrl role streak");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (dateRange) {
      const userAttemptXp = await QuizAttempt.aggregate([
        { $match: { userId: user._id, date: { $gte: dateRange } } },
        { $group: { _id: null, xp: { $sum: { $multiply: ["$correctAnswers", 10] } }, coins: { $sum: { $multiply: ["$correctAnswers", 2] } } } },
      ]);

      const xp = userAttemptXp[0]?.xp || 0;
      const coins = userAttemptXp[0]?.coins || 0;

      const rank = await QuizAttempt.aggregate([
        { $match: { date: { $gte: dateRange } } },
        { $group: { _id: "$userId", xp: { $sum: { $multiply: ["$correctAnswers", 10] } } } },
        { $match: { xp: { $gt: xp } } },
        { $count: "count" },
      ]);

      res.json({
        user: { _id: user._id, name: user.name, xp, coins, level: user.level, streak: user.streak, avatarUrl: user.avatarUrl, role: user.role },
        rank: (rank[0]?.count || 0) + 1,
      });
    } else {
      const rank = await User.countDocuments({
        xp: { $gt: user.xp },
        role: { $nin: ["Admin", "Super Admin"] },
      });

      res.json({
        user: { _id: user._id, name: user.name, xp: user.xp, coins: user.coins, level: user.level, streak: user.streak, avatarUrl: user.avatarUrl, role: user.role },
        rank: rank + 1,
      });
    }
  } catch (error) {
    console.error("Error fetching user rank:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
