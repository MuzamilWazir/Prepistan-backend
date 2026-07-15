import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";
import userRoutes from "../routes/user.route.js";
import questionRoutes from "../routes/question.route.js";
import quizAttemptRoutes from "../routes/quiz-attempt.route.js";

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

app.use("/api/users", userRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/quiz", quizAttemptRoutes);

export default app;
