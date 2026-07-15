import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "Student" | "Premium Student" | "Admin" | "Super Admin" | "Content Manager";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  provider: "Google" | "Gmail" | "Email" | "Simulation Bypass";
  isPremium: boolean;
  xp: number;
  coins: number;
  streak: number;
  longestStreak: number;
  level: number;
  avatarUrl: string;
  bookmarkedIds: string[];
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["Student", "Premium Student", "Admin", "Super Admin", "Content Manager"],
      default: "Student",
    },
    provider: {
      type: String,
      enum: ["Google", "Gmail", "Email", "Simulation Bypass"],
      default: "Email",
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    coins: {
      type: Number,
      default: 0,
      min: 0,
    },
    streak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    bookmarkedIds: [
      {
        type: String,
        ref: "Question",
      },
    ],
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ xp: -1 });
UserSchema.index({ lastActiveAt: -1 });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
