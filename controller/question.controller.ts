import { Request, Response } from "express";
import { Question } from "../model/question.model.js";

export const GetQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, subject, difficulty, page = "1", limit = "50" } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = { isActive: true };
    if (category) filter.category = category;
    if (subject) filter.subject = subject;
    if (difficulty) filter.difficulty = difficulty;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [questions, total] = await Promise.all([
      Question.find(filter).skip(skip).limit(limitNum).sort({ createdAt: -1 }),
      Question.countDocuments(filter),
    ]);

    res.json({ questions, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const GetQuestionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      res.status(404).json({ message: "Question not found" });
      return;
    }
    res.json({ question });
  } catch (error) {
    console.error("Error fetching question:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const CreateQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const question = new Question(req.body);
    await question.save();
    res.status(201).json({ message: "Question created", question });
  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const UpdateQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!question) {
      res.status(404).json({ message: "Question not found" });
      return;
    }
    res.json({ message: "Question updated", question });
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const DeleteQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      res.status(404).json({ message: "Question not found" });
      return;
    }
    res.json({ message: "Question deleted" });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const GetCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Question.distinct("category", { isActive: true });
    res.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const GetSubjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.query as { category?: string };
    const filter: Record<string, unknown> = { isActive: true };
    if (category) filter.category = category;
    const subjects = await Question.distinct("subject", filter);
    res.json({ subjects });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
