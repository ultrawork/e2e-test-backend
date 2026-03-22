import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const authRouter = Router();

const DEFAULT_JWT_SECRET = "e2e-test-secret-key-ultrawork";

function getJwtSecret(): string {
  return process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
}

// POST /api/auth/register
authRouter.post("/register", async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      getJwtSecret(),
      { expiresIn: "7d" }
    );
    res.status(201).json({ userId: user.id, email: user.email, token });
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      res.status(400).json({ error: "Email already exists" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login
authRouter.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
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
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      getJwtSecret(),
      { expiresIn: "7d" }
    );
    res.json({ token });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/logout
authRouter.post("/logout", (_req: Request, res: Response) => {
  res.json({ message: "Logged out" });
});

// DELETE /api/auth/account
authRouter.delete("/account", authMiddleware, async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.user!.userId } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export { authRouter };
