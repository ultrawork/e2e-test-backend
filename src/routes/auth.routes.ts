import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AuthPayload } from "../types";

const authRouter = Router();

if (config.nodeEnv !== "production") {
  /** Issues a dev JWT token. Available only in non-production environments. */
  authRouter.post("/dev-token", (_req: Request, res: Response) => {
    const payload: AuthPayload = {
      userId: "dev-user-id",
      email: "dev@localhost",
    };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: "24h" });
    res.json({ token });
  });
}

export { authRouter };
