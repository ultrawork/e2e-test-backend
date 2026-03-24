import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { prisma } from "../lib/prisma";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!config.jwtEnabled) {
    if (!req.user) {
      req.user = { userId: "default-user-id", email: "dev@localhost" };
    }
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const payload = jwt.verify(authHeader.slice(7), config.jwtSecret) as {
      userId: string;
      email: string;
    };
    await prisma.user.upsert({
      where: { id: payload.userId },
      update: {},
      create: {
        id: payload.userId,
        email: payload.email,
        password: "jwt-auth-placeholder",
      },
    });
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
