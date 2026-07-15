import mongoose, { Schema, Document, Model } from "mongoose";
import { Request } from "express";

export interface AuthRequest extends Request {
  user?: { userId: string; email: string };
}

export type QuizMode =
  | "Practice Mode"
  | "Timed Test"
  | "Mock Test"
  | "Previous Papers"
  | "Daily Quiz"
  | "Weekly Quiz"
  | "Topic Wise Quiz"
  | "Chapter Wise Quiz"
  | "Wrong Questions Revision"
  | "Bookmarked Questions"
  | "Custom Test Generator"
  | "AI Generated Quiz";

export interface IQuizAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  quizMode: QuizMode;
  category: string;
  subject: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  timeSpentSeconds: number;
  date: Date;
  createdAt: Date;
}

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    quizMode: {
      type: String,
      enum: [
        "Practice Mode",
        "Timed Test",
        "Mock Test",
        "Previous Papers",
        "Daily Quiz",
        "Weekly Quiz",
        "Topic Wise Quiz",
        "Chapter Wise Quiz",
        "Wrong Questions Revision",
        "Bookmarked Questions",
        "Custom Test Generator",
        "AI Generated Quiz",
      ],
      required: [true, "Quiz mode is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    correctAnswers: {
      type: Number,
      required: true,
      min: 0,
    },
    wrongAnswers: {
      type: Number,
      required: true,
      min: 0,
    },
    timeSpentSeconds: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

QuizAttemptSchema.index({ userId: 1, date: -1 });
QuizAttemptSchema.index({ userId: 1, category: 1 });
QuizAttemptSchema.index({ date: -1 });

export const QuizAttempt: Model<IQuizAttempt> =
  mongoose.models.QuizAttempt ||
  mongoose.model<IQuizAttempt>("QuizAttempt", QuizAttemptSchema);
