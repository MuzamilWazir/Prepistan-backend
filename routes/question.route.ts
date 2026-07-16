import { Router } from "express";
import {
  GetQuestions,
  GetQuestionById,
  CreateQuestion,
  UpdateQuestion,
  DeleteQuestion,
  GetCategories,
  GetSubjects,
} from "../controller/question.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", GetQuestions);
router.get("/categories", GetCategories);
router.get("/subjects", GetSubjects);
router.get("/:id", GetQuestionById);
router.post("/", requireAuth, CreateQuestion);
router.put("/:id", requireAuth, UpdateQuestion);
router.delete("/:id", requireAuth, DeleteQuestion);

export default router;
