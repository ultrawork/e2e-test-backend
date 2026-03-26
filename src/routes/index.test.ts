import request from "supertest";
import express, { Request, Response, NextFunction } from "express";

let authCalled = false;

jest.mock("../middleware/auth", () => ({
  authMiddleware: (req: Request, _res: Response, next: NextFunction) => {
    authCalled = true;
    req.user = { userId: "user-1", email: "test@test.com" };
    next();
  },
}));

jest.mock("./notes.routes", () => {
  const { Router } = jest.requireActual<typeof import("express")>("express");
  const r = Router();
  r.get("/", (_req: Request, res: Response) => res.json([]));
  return { notesRouter: r };
});

jest.mock("./categories.routes", () => {
  const { Router } = jest.requireActual<typeof import("express")>("express");
  const r = Router();
  r.get("/", (_req: Request, res: Response) => res.json([]));
  return { categoriesRouter: r };
});

jest.mock("./auth.routes", () => {
  const { Router } = jest.requireActual<typeof import("express")>("express");
  const r = Router();
  r.post("/dev-token", (_req: Request, res: Response) =>
    res.json({ token: "test" })
  );
  return { authRouter: r };
});

import { router } from "./index";

const app = express();
app.use(express.json());
app.use("/api", router);

beforeEach(() => {
  authCalled = false;
});

describe("Centralized auth middleware in router", () => {
  it("GET /api/health does not require auth", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
    expect(authCalled).toBe(false);
  });

  it("POST /api/auth/dev-token does not require auth", async () => {
    const res = await request(app).post("/api/auth/dev-token");
    expect(res.status).toBe(200);
    expect(authCalled).toBe(false);
  });

  it("GET /api/notes requires auth (authMiddleware is called)", async () => {
    const res = await request(app).get("/api/notes");
    expect(res.status).toBe(200);
    expect(authCalled).toBe(true);
  });

  it("GET /api/categories requires auth (authMiddleware is called)", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(authCalled).toBe(true);
  });
});
