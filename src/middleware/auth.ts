import { Request, Response, NextFunction } from "express";

export function authMiddleware(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  // TODO: JWT token verification
  next();
}
