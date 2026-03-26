import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { config } from "../config";
import { prisma } from "../lib/prisma";

const authRouter = Router();

/** POST /api/auth/dev-token — issues a JWT for development/testing. */
authRouter.post("/dev-token", (_req: Request, res: Response) => {
  if (config.nodeEnv === "production") {
    res.status(404).json({ error: "Not found" });
    return;
  }

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

/** POST /api/auth/login — authenticates with email/password and returns JWT. */
authRouter.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  if (!config.jwtSecret) {
    res.status(500).json({ error: "JWT_SECRET is not configured" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: "24h" }
    );

    res.json({ token });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export { authRouter };
