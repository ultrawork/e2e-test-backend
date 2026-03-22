import { Request, Response, NextFunction } from "express";

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // TODO: JWT token verification
  // Set default user for dev mode until JWT is implemented
  if (!req.user) {
    req.user = { userId: "default-user-id", email: "dev@localhost" };
  }
  next();
}
