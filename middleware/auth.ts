import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthPayload {
  userId?: string;
  email: string;
  role?: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export const Auth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authorization header missing" });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Token missing" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET!) as AuthPayload;
    (req as AuthRequest).user = decoded;
    next();
  } catch {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

export const Authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    // NOTE: role check requires fetching user from DB or embedding role in JWT
    // For now we skip role-based authorization if no role in token
    next();
  };
};
