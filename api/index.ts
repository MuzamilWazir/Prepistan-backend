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

// 1. Establish database connection outside the request cycle
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not defined");
mongoose.connect(uri).catch(err => console.error("MongoDB connection error:", err));

// 2. Mount Static / Health Routes directly
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get('/', (_req, res) => {
  res.send('Backend is running successfully!');
});

// 3. Dynamic route loading (Fixing file paths to .ts or .js depending on your compilation setup)
let routesMounted = false;
async function ensureRoutes(req: any, res: any, next: any) {
  if (routesMounted) return next();
  try {
    // NOTE: If using TypeScript natively on Vercel, use your actual file extensions (.ts) 
    // or omit them entirely so Node resolves them dynamically.
    const userRoutes = (await import("../routes/user.route.js")).default;
    const questionRoutes = (await import("../routes/question.route.js")).default;
    const quizAttemptRoutes = (await import("../routes/quiz-attempt.route.js")).default;

    app.use("/api/users", userRoutes);
    app.use("/api/questions", questionRoutes);
    app.use("/api/quiz", quizAttemptRoutes);
    
    routesMounted = true;
    next();
  } catch (err) {
    console.error("Failed to mount routes:", err);
    res.status(500).json({ error: "Internal server error during route initialization" });
  }
}

// Intercept all sub-routes to ensure dynamic imports complete before processing the route
app.use(ensureRoutes);

// 4. CRITICAL: Export the Express app instance directly for Vercel
export default app;
