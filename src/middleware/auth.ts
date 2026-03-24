import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
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
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
