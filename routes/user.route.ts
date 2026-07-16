import { Router } from "express";
import passport from "passport";
import {
  RegisterUser,
  LoginUser,
  AdminLogin,
  RefreshToken,
  LogoutUser,
  GetCurrentUser,
  GetAllUsers,
  UpdateUserRole,
  DeleteUser,
  GoogleCallback,
} from "../controller/user.controller.js";

const router = Router();

// Public
router.post("/register", RegisterUser);
router.post("/login", LoginUser);
router.post("/admin/login", AdminLogin);
router.post("/refresh-token", RefreshToken);
router.post("/logout", LogoutUser);

// Authenticated
router.get("/me", GetCurrentUser);

// Admin
router.get("/admin/users", GetAllUsers);
router.put("/admin/users/role", UpdateUserRole);
router.delete("/admin/users/:id", DeleteUser);

// ── Google OAuth ──
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login?error=auth_failed",
    session: false,
  }),
  GoogleCallback
);

export default router;
