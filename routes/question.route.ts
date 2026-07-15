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
import { Auth } from "../middleware/auth.js";

const router = Router();

router.get("/", GetQuestions);
router.get("/categories", GetCategories);
router.get("/subjects", GetSubjects);
router.get("/:id", GetQuestionById);
router.post("/", Auth, CreateQuestion);
router.put("/:id", Auth, UpdateQuestion);
router.delete("/:id", Auth, DeleteQuestion);

export default router;
