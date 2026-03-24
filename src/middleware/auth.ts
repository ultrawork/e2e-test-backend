import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AuthPayload } from "../types";

/** JWT authentication middleware with optional bypass via JWT_ENABLED flag. */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!config.jwtEnabled) {
    req.user = { userId: "default-user-id", email: "dev@localhost" };
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
