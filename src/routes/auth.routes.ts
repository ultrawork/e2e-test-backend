import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

const authRouter = Router();

/** POST /api/auth/dev-token — issues a JWT for development/testing. */
authRouter.post("/dev-token", (_req: Request, res: Response) => {
  if (config.nodeEnv !== "development") {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (!config.jwtSecret) {
    res.status(500).json({ error: "JWT_SECRET is not configured" });
    return;
  }

  const token = jwt.sign(
    { userId: config.devUserId, email: "dev@localhost" },
    config.jwtSecret,
    { expiresIn: "24h" }
  );

  res.json({ token });
});

export { authRouter };
