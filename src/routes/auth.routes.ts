import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

const authRouter = Router();

// POST /api/auth/register
// POST /api/auth/login
// POST /api/auth/logout
// DELETE /api/auth/account

if (config.nodeEnv === "development") {
  authRouter.post("/dev-token", (_req: Request, res: Response) => {
    if (!config.jwtSecret) {
      res.status(500).json({ error: "JWT_SECRET is not configured" });
      return;
    }
    const token = jwt.sign(
      { userId: "dev-user-id", email: "dev@localhost" },
      config.jwtSecret,
      { expiresIn: "24h" }
    );
    res.json({ token });
  });
}

export { authRouter };
