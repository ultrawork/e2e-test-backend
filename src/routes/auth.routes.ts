import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const authRouter = Router();

// POST /api/auth/register
authRouter.post("/register", async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "password must be at least 6 characters" });
    return;
  }

  const secret = process.env.JWT_SECRET || "";
  if (!secret) {
    res.status(500).json({ error: "JWT_SECRET not configured" });
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed },
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, secret, {
      expiresIn: "7d",
    });

    res.status(201).json({ token, userId: user.id, email: user.email });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login
authRouter.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const secret = process.env.JWT_SECRET || "";
  if (!secret) {
    res.status(500).json({ error: "JWT_SECRET not configured" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, secret, {
      expiresIn: "7d",
    });

    res.json({ token, userId: user.id, email: user.email });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/logout
authRouter.post("/logout", (_req: Request, res: Response) => {
  res.json({ message: "Logged out" });
});

// DELETE /api/auth/account
authRouter.delete(
  "/account",
  authMiddleware,
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    try {
      await prisma.user.delete({ where: { id: userId } });
      res.status(204).send();
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export { authRouter };
