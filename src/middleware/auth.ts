import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AuthPayload } from "../types";

/** JWT authentication middleware. Bypasses verification when JWT is disabled. */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!config.jwtEnabled) {
    req.user = { userId: "dev-user-id", email: "dev@localhost" };
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
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
