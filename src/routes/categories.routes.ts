import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const categoriesRouter = Router();

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

/** Validates category name and color. Returns error message or null. */
function validateCategory(name: unknown, color: unknown): string | null {
  if (typeof name !== "string" || name.length < 1 || name.length > 30) {
    return "Name must be between 1 and 30 characters";
  }
  if (typeof color !== "string" || !HEX_RE.test(color)) {
    return "Color must be a valid HEX color (#RRGGBB)";
  }
  return null;
}

/** GET /api/categories */
categoriesRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** POST /api/categories */
categoriesRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { name, color } = req.body;
    const error = validateCategory(name, color);
    if (error) {
      res.status(400).json({ error });
      return;
    }

    const category = await prisma.category.create({
      data: { name, color },
    });
    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** PUT /api/categories/:id */
categoriesRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    const error = validateCategory(name, color);
    if (error) {
      res.status(400).json({ error });
      return;
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name, color },
    });
    res.json(category);
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code: string }).code === "P2025"
    ) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** DELETE /api/categories/:id */
categoriesRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id } });
    res.status(204).send();
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code: string }).code === "P2025"
    ) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { categoriesRouter };
