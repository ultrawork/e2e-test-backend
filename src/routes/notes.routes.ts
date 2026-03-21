import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const notesRouter = Router();

/** Maps a note with NoteCategory[] join to a flat categories array. */
function formatNote(
  note: {
    id: string;
    title: string;
    content: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    categories: {
      category: { id: string; name: string; color: string };
    }[];
  },
) {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    userId: note.userId,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    categories: note.categories.map((nc) => ({
      id: nc.category.id,
      name: nc.category.name,
      color: nc.category.color,
    })),
  };
}

const categoriesInclude = {
  categories: { include: { category: true } },
} as const;

/** GET /api/notes */
notesRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const where: Record<string, unknown> = {};
    if (typeof category === "string" && category.length > 0) {
      where.categories = { some: { categoryId: category } };
    }

    const notes = await prisma.note.findMany({
      where,
      include: categoriesInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json(notes.map(formatNote));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** GET /api/notes/:id */
notesRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const note = await prisma.note.findUnique({
      where: { id: req.params.id },
      include: categoriesInclude,
    });
    if (!note) {
      res.status(404).json({ error: "Note not found" });
      return;
    }
    res.json(formatNote(note));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** POST /api/notes */
notesRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { title, content, categoryIds } = req.body;

    if (!title || typeof title !== "string") {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const note = await prisma.note.create({
      data: {
        title,
        content: content ?? "",
        userId,
        categories:
          Array.isArray(categoryIds) && categoryIds.length > 0
            ? {
                createMany: {
                  data: categoryIds.map((cid: string) => ({
                    categoryId: cid,
                  })),
                },
              }
            : undefined,
      },
      include: categoriesInclude,
    });
    res.status(201).json(formatNote(note));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** PUT /api/notes/:id */
notesRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, categoryIds } = req.body;

    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    await prisma.note.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
      },
    });

    if (Array.isArray(categoryIds)) {
      await prisma.noteCategory.deleteMany({ where: { noteId: id } });
      if (categoryIds.length > 0) {
        await prisma.noteCategory.createMany({
          data: categoryIds.map((cid: string) => ({
            noteId: id,
            categoryId: cid,
          })),
        });
      }
    }

    const updated = await prisma.note.findUnique({
      where: { id },
      include: categoriesInclude,
    });
    res.json(formatNote(updated!));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** DELETE /api/notes/:id */
notesRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.note.delete({ where: { id } });
    res.status(204).send();
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code: string }).code === "P2025"
    ) {
      res.status(404).json({ error: "Note not found" });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { notesRouter };
