import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AuthPayload } from "../types";
import { prisma } from "../lib/prisma";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  let payload: AuthPayload;
  try {
    payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.user = { userId: payload.userId, email: payload.email };

  // Ensure user exists in DB (upsert to avoid FK constraint violations)
  try {
    await prisma.user.upsert({
      where: { id: payload.userId },
      update: {},
      create: {
        id: payload.userId,
        email: payload.email,
        password: "",
      },
    });
  } catch {
    // Swallow upsert errors — proceed anyway so route-level
    // validations (e.g. category checks) can return proper 400s.
  }

  next();
}
