import { Router } from "express";
import { authRouter } from "./auth.routes";
import { notesRouter } from "./notes.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/notes", notesRouter);

export { router };
