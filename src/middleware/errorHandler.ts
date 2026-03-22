import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(err.stack);
  const status = err.status ?? 500;
  const message = status === 500 ? "Internal server error" : err.message;
  res.status(status).json({ error: message });
}
