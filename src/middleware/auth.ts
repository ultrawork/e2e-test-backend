import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthPayload } from "../types";
import { prisma } from "../lib/prisma";

const DEFAULT_JWT_SECRET = "e2e-test-secret-key-ultrawork";

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
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  try {
    const payload = jwt.verify(token, secret) as AuthPayload;
    await prisma.user.upsert({
      where: { id: payload.userId },
      update: {},
      create: { id: payload.userId, email: payload.email, password: "" },
    });
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
