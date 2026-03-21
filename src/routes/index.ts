import { Router } from "express";
import { authRouter } from "./auth.routes";
import { notesRouter } from "./notes.routes";
import { categoriesRouter } from "./categories.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/notes", notesRouter);
router.use("/categories", categoriesRouter);

export { router };
