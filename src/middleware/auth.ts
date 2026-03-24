import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

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

  if (!config.jwtSecret) {
    res.status(500).json({ error: "JWT secret is not configured" });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (
      typeof decoded === "string" ||
      typeof decoded.userId !== "string" ||
      typeof decoded.email !== "string"
    ) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    req.user = { userId: decoded.userId, email: decoded.email };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
