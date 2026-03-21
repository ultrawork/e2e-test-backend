import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import {
  listNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} from "../services/notes.service";

const notesRouter = Router();

notesRouter.use(authMiddleware);

// Ensure the authenticated user exists in the DB (prevents FK constraint errors on note creation)
notesRouter.use((req: Request, _res: Response, next: NextFunction) => {
  const { userId, email } = req.user!;
  prisma.user
    .upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email, password: "" },
    })
    .then(() => next())
    .catch(() => next());
});

function handleNoteError(err: unknown, res: Response): void {
  if (err instanceof Error) {
    if (err.message === "Note not found") {
      res.status(404).json({ error: err.message });
      return;
    }
    if (err.message === "Forbidden") {
      res.status(403).json({ error: err.message });
      return;
    }
    if (err.message === "One or more categories not found") {
      res.status(400).json({ error: err.message });
      return;
    }
  }
  res.status(500).json({ error: "Internal server error" });
}

notesRouter.get("/", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const categoryId = req.query.category as string | undefined;
  try {
    const notes = await listNotes(userId, categoryId);
    res.json(notes);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

notesRouter.get("/:id", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  try {
    const note = await getNoteById(req.params.id, userId);
    res.json(note);
  } catch (err) {
    handleNoteError(err, res);
  }
});

notesRouter.post("/", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { title, content, categoryIds } = req.body as {
    title: string;
    content: string;
    categoryIds?: string[];
  };
  if (!title || !content) {
    res.status(400).json({ error: "title and content are required" });
    return;
  }
  if (categoryIds !== undefined && !Array.isArray(categoryIds)) {
    res.status(400).json({ error: "categoryIds must be an array" });
    return;
  }
  try {
    const note = await createNote(userId, title, content, categoryIds);
    res.status(201).json(note);
  } catch (err) {
    handleNoteError(err, res);
  }
});

notesRouter.put("/:id", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { title, content, categoryIds } = req.body as {
    title: string;
    content: string;
    categoryIds?: string[];
  };
  if (!title || !content) {
    res.status(400).json({ error: "title and content are required" });
    return;
  }
  if (categoryIds !== undefined && !Array.isArray(categoryIds)) {
    res.status(400).json({ error: "categoryIds must be an array" });
    return;
  }
  try {
    const note = await updateNote(
      req.params.id,
      userId,
      title,
      content,
      categoryIds
    );
    res.json(note);
  } catch (err) {
    handleNoteError(err, res);
  }
});

notesRouter.delete("/:id", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  try {
    await deleteNote(req.params.id, userId);
    res.status(204).send();
  } catch (err) {
    handleNoteError(err, res);
  }
});

export { notesRouter };
