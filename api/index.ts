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

let dbReady = false;

async function connectOnce() {
  if (dbReady) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not defined");
  await mongoose.connect(uri);
  dbReady = true;
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get('/', (_req, res) => {
  res.send('Backend is running successfully!');
});

let routesMounted = false;

async function ensureRoutes() {
  if (routesMounted) return;
  await connectOnce();

  const userRoutes = (await import("../routes/user.route.js")).default;
  const questionRoutes = (await import("../routes/question.route.js")).default;
  const quizAttemptRoutes = (await import("../routes/quiz-attempt.route.js")).default;

  app.use("/api/users", userRoutes);
  app.use("/api/questions", questionRoutes);
  app.use("/api/quiz", quizAttemptRoutes);
  routesMounted = true;
}

export default async function handler(req: any, res: any) {
  try {
    await ensureRoutes();
    return app(req, res);
  } catch (err) {
    console.error("Handler error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = app; 