import mongoose, { Schema, Document, Model } from "mongoose";

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface IQuestion extends Document {
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  referenceBook?: string;
  difficulty: Difficulty;
  category: string;
  subject: string;
  topic?: string;
  subtopic?: string;
  chapter?: string;
  tags: string[];
  negativeMarks?: number;
  timeLimitSeconds?: number;
  hints: string[];
  imageUrl?: string;
  diagramUrl?: string;
  videoSolutionUrl?: string;
  pdfAttachmentUrl?: string;
  isPremium: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    question: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    options: {
      type: [String],
      validate: {
        validator: (v: string[]) => v.length === 4,
        message: "Exactly 4 options are required",
      },
    },
    correctOptionIndex: {
      type: Number,
      required: [true, "Correct option index is required"],
      min: [0, "Index must be 0-3"],
      max: [3, "Index must be 0-3"],
    },
    explanation: {
      type: String,
      required: [true, "Explanation is required"],
      trim: true,
    },
    referenceBook: {
      type: String,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: [true, "Difficulty is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      index: true,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      index: true,
    },
    topic: {
      type: String,
      trim: true,
    },
    subtopic: {
      type: String,
      trim: true,
    },
    chapter: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    negativeMarks: {
      type: Number,
      min: 0,
    },
    timeLimitSeconds: {
      type: Number,
      min: 0,
    },
    hints: {
      type: [String],
      default: [],
    },
    imageUrl: String,
    diagramUrl: String,
    videoSolutionUrl: String,
    pdfAttachmentUrl: String,
    isPremium: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

QuestionSchema.index({ category: 1, subject: 1 });
QuestionSchema.index({ category: 1, subject: 1, difficulty: 1 });
QuestionSchema.index({ difficulty: 1 });
QuestionSchema.index({ tags: 1 });
QuestionSchema.index({ topic: 1 });
QuestionSchema.index({ isActive: 1 });
QuestionSchema.index({ isPremium: 1 });

export const Question: Model<IQuestion> =
  mongoose.models.Question || mongoose.model<IQuestion>("Question", QuestionSchema);
