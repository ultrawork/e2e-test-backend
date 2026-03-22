import { Request, Response, NextFunction } from "express";

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const devToken = process.env.DEV_API_TOKEN;
  if (devToken) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader === `Bearer ${devToken}`) {
      req.user = { userId: "default-user-id", email: "dev@localhost" };
      next();
      return;
    }
  }

  if (!req.user) {
    req.user = { userId: "default-user-id", email: "dev@localhost" };
  }
  next();
}
