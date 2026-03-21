import { Router } from "express";
import { authRouter } from "./auth.routes";
import { categoriesRouter } from "./categories.routes";
import { notesRouter } from "./notes.routes";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use("/auth", authRouter);
router.use("/categories", categoriesRouter);
router.use("/notes", authMiddleware, notesRouter);

export { router };
