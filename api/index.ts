import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";

const app = express();
app.use(express.json());

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
};
app.use(cors(corsOptions));

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not defined");
mongoose.connect(uri).catch((err) => console.error("MongoDB connection error:", err));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

let routesMounted = false;

async function ensureRoutes(_req: any, _res: any, next: any) {
  if (routesMounted) return next();
  try {
    const userRoutes = (await import("../routes/user.route")).default;
    const questionRoutes = (await import("../routes/question.route")).default;
    const quizAttemptRoutes = (await import("../routes/quiz-attempt.route")).default;

    app.use("/api/users", userRoutes);
    app.use("/api/questions", questionRoutes);
    app.use("/api/quiz", quizAttemptRoutes);

    routesMounted = true;
    next();
  } catch (err) {
    console.error("Failed to mount routes:", err);
    _res.status(500).json({ error: "Internal server error during route initialization" });
  }
}

app.use(ensureRoutes);

export default app;
