import { Router } from "express";
import { authRouter } from "./auth.routes";
import { notesRouter } from "./notes.routes";
import { categoriesRouter } from "./categories.routes";
import { authMiddleware } from "../middleware/auth";

const router = Router();

/** GET /api/health — API-level health check. */
router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRouter);

// Centralized auth — all routes below require a valid JWT
router.use(authMiddleware);

router.use("/notes", notesRouter);
router.use("/categories", categoriesRouter);

export { router };
