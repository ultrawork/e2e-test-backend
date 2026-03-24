import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

/** Ensures the authenticated user exists in the database (auto-upsert). */
export async function ensureUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    next();
    return;
  }

  try {
    await prisma.user.upsert({
      where: { id: req.user.userId },
      update: {},
      create: {
        id: req.user.userId,
        email: req.user.email,
        password: "no-password",
      },
    });
    next();
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
}
