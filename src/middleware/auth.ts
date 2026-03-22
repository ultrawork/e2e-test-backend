import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AuthPayload } from "../types";

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
      req.user = { userId: payload.userId, email: payload.email };
      return next();
    } catch {
      // Invalid token — fall through to default user
    }
  }

  // Default user for dev mode when no valid JWT is provided
  if (!req.user) {
    req.user = { userId: "default-user-id", email: "dev@localhost" };
  }
  next();
}
