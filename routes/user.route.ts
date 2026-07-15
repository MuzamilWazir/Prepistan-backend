import { Router } from "express";
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

export default router;
