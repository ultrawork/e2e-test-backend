import { Router, Request, Response } from "express";
import {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  validateCategoryInput,
} from "../services/categories.service";

const categoriesRouter = Router();

categoriesRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const categories = await listCategories();
    res.json(categories);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

categoriesRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const category = await getCategoryById(req.params.id);
    res.json(category);
  } catch (err) {
    if (err instanceof Error && err.message === "Category not found") {
      res.status(404).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

categoriesRouter.post("/", async (req: Request, res: Response) => {
  const { name, color } = req.body as { name: string; color: string };
  const validationError = validateCategoryInput(name, color);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  try {
    const category = await createCategory(name, color);
    res.status(201).json(category);
  } catch (err) {
    if (err instanceof Error && err.message === "Category name already exists") {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

categoriesRouter.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, color } = req.body as { name: string; color: string };
  const validationError = validateCategoryInput(name, color);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  try {
    const category = await updateCategory(id, name, color);
    res.json(category);
  } catch (err) {
    if (err instanceof Error && err.message === "Category not found") {
      res.status(404).json({ error: err.message });
      return;
    }
    if (err instanceof Error && err.message === "Category name already exists") {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

categoriesRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    await deleteCategory(req.params.id);
    res.status(204).send();
  } catch (err) {
    if (err instanceof Error && err.message === "Category not found") {
      res.status(404).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export { categoriesRouter };
