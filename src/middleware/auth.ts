import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AuthPayload } from "../types";
import { prisma } from "../lib/prisma";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
    req.user = { userId: payload.userId, email: payload.email };

    prisma.user
      .upsert({
        where: { id: payload.userId },
        update: {},
        create: {
          id: payload.userId,
          email: payload.email,
          password: "",
        },
      })
      .then(() => next())
      .catch(() => next());
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
