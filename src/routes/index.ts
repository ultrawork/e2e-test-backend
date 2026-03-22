import { Router, Request, Response } from "express";
import { authRouter } from "./auth.routes";
import { notesRouter } from "./notes.routes";
import { categoriesRouter } from "./categories.routes";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

router.use("/auth", authRouter);
router.use("/notes", notesRouter);
router.use("/categories", categoriesRouter);

export { router };
