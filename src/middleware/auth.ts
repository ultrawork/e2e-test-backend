import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AuthPayload } from "../types";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (token) {
    try {
      req.user = jwt.verify(token, config.jwtSecret) as AuthPayload;
      next();
      return;
    } catch {
      if (config.nodeEnv === "production") {
        res.status(401).json({ error: "Invalid token" });
        return;
      }
      // development: continue without req.user
    }
  } else if (config.nodeEnv === "production") {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  // development dev-fallback: proceed without user
  next();
}
