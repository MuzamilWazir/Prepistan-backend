import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, type IUser } from "../model/user.model.js";

const generateAccessToken = (payload: { email: string; role: string }): string => {
  return jwt.sign(payload, process.env.ACCESS_SECRET!, { expiresIn: "15m" });
};

const generateRefreshToken = (payload: { email: string; role: string }): string => {
  return jwt.sign(payload, process.env.REFRESH_SECRET!, { expiresIn: "7d" });
};

export const RegisterUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body as {
      name: string;
      email: string;
      password: string;
    };

    if (!name || !email || !password) {
      res.status(400).json({ message: "Name, email, and password are required" });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: passwordHash,
      role: "Student",
      provider: "Email",
      xp: 0,
      coins: 0,
      streak: 0,
      longestStreak: 0,
      level: 1,
      isPremium: false,
    });

    await newUser.save();

    const { password: _, ...userWithoutPassword } = newUser.toObject();
    res.status(201).json({ message: "User registered successfully", user: userWithoutPassword });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const LoginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const accessToken = generateAccessToken({ email: user.email, role: user.role });
    const refreshToken = jwt.sign({ email: user.email, role: user.role }, process.env.REFRESH_SECRET!, { expiresIn: "7d" });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({ message: "User logged in successfully", user: userWithoutPassword, accessToken });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const AdminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    if (user.role !== "Admin" && user.role !== "Super Admin") {
      res.status(403).json({ message: "Access denied. Admin privileges required." });
      return;
    }

    const accessToken = generateAccessToken({ email: user.email, role: user.role });
    const refreshToken = jwt.sign({ email: user.email, role: user.role }, process.env.REFRESH_SECRET!, { expiresIn: "7d" });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({ message: "Admin logged in successfully", user: userWithoutPassword, accessToken });
  } catch (error) {
    console.error("Error in admin login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const RefreshToken = (req: Request, res: Response): void => {
  const cookies = req.cookies;
  if (!cookies?.refreshToken) {
    res.status(401).json({ message: "Refresh token missing" });
    return;
  }

  try {
    const decoded = jwt.verify(cookies.refreshToken, process.env.REFRESH_SECRET!) as { email: string; role: string };
    const accessToken = generateAccessToken({ email: decoded.email, role: decoded.role });
    res.json({ accessToken });
  } catch {
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

export const LogoutUser = (_req: Request, res: Response): void => {
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
};

export const GetCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET!) as { email: string };
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({ user });
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ── Admin endpoints ──

export const GetAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET!) as { email: string; role: string };

    if (decoded.role !== "Admin" && decoded.role !== "Super Admin") {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const { page = "1", limit = "20", search = "" } = req.query as Record<string, string>;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).select("-password").skip(skip).limit(limitNum).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const UpdateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET!) as { email: string; role: string };

    if (decoded.role !== "Super Admin") {
      res.status(403).json({ message: "Only Super Admin can change roles" });
      return;
    }

    const { userId, role } = req.body as { userId: string; role: string };

    if (!userId || !role) {
      res.status(400).json({ message: "userId and role are required" });
      return;
    }

    const validRoles = ["Student", "Premium Student", "Admin", "Super Admin", "Content Manager"];
    if (!validRoles.includes(role)) {
      res.status(400).json({ message: "Invalid role" });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        role,
        isPremium: role === "Premium Student" || role === "Super Admin",
      },
      { new: true }
    ).select("-password");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({ message: "User role updated", user });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const DeleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET!) as { email: string; role: string };

    if (decoded.role !== "Super Admin") {
      res.status(403).json({ message: "Only Super Admin can delete users" });
      return;
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({ message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ── Google OAuth Callback ──

export const GoogleCallback = (req: Request, res: Response): void => {
  try {
    const user = req.user as any;
    if (!user) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(`${frontendUrl}/login?error=auth_failed`);
      return;
    }

    const accessToken = generateAccessToken({ email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ email: user.email, role: user.role });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const userData = encodeURIComponent(
      JSON.stringify({
        name: user.name,
        email: user.email,
        provider: user.provider,
      })
    );

    res.redirect(
      `${frontendUrl}/dashboard?token=${accessToken}&refresh=${refreshToken}&user=${userData}`
    );
  } catch (error) {
    console.error("Error in Google callback:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/login?error=auth_failed`);
  }
};
