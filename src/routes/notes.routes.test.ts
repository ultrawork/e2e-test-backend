import request from "supertest";
import express, { Request, Response, NextFunction } from "express";
import { notesRouter } from "./notes.routes";

jest.mock("../middleware/auth", () => ({
  authMiddleware: (req: Request, _res: Response, next: NextFunction) => {
    req.user = { userId: "user-1", email: "test@test.com" };
    next();
  },
}));

jest.mock("../middleware/ensureUser", () => ({
  ensureUser: (_req: Request, _res: Response, next: NextFunction) => {
    next();
  },
}));

jest.mock("../services/notes.service", () => ({
  listNotes: jest.fn(),
  getNoteById: jest.fn(),
  createNote: jest.fn(),
  updateNote: jest.fn(),
  deleteNote: jest.fn(),
}));

import {
  listNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} from "../services/notes.service";

const mockList = listNotes as jest.Mock;
const mockGetById = getNoteById as jest.Mock;
const mockCreate = createNote as jest.Mock;
const mockUpdate = updateNote as jest.Mock;
const mockDelete = deleteNote as jest.Mock;

const app = express();
app.use(express.json());
app.use("/notes", notesRouter);

beforeEach(() => jest.clearAllMocks());

describe("GET /notes", () => {
  it("returns 200 with notes", async () => {
    const notes = [{ id: "1", title: "Test", content: "Body", categories: [] }];
    mockList.mockResolvedValue(notes);

    const res = await request(app).get("/notes");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(notes);
    expect(mockList).toHaveBeenCalledWith("user-1", undefined);
  });

  it("passes category filter to service", async () => {
    mockList.mockResolvedValue([]);

    await request(app).get("/notes?category=cat-1");
    expect(mockList).toHaveBeenCalledWith("user-1", "cat-1");
  });
});

describe("GET /notes/:id", () => {
  it("returns 200 with note", async () => {
    const note = { id: "1", title: "Test", content: "Body", categories: [] };
    mockGetById.mockResolvedValue(note);

    const res = await request(app).get("/notes/1");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(note);
  });

  it("returns 404 when not found", async () => {
    mockGetById.mockRejectedValue(new Error("Note not found"));

    const res = await request(app).get("/notes/999");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Note not found" });
  });

  it("returns 403 when forbidden", async () => {
    mockGetById.mockRejectedValue(new Error("Forbidden"));

    const res = await request(app).get("/notes/1");
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Forbidden" });
  });
});

describe("POST /notes", () => {
  it("returns 400 when title missing", async () => {
    const res = await request(app)
      .post("/notes")
      .send({ content: "Body" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "title and content are required" });
  });

  it("returns 400 when content missing", async () => {
    const res = await request(app)
      .post("/notes")
      .send({ title: "Test" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when categoryIds is not an array", async () => {
    const res = await request(app)
      .post("/notes")
      .send({ title: "Test", content: "Body", categoryIds: "not-array" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "categoryIds must be an array" });
  });

  it("returns 201 on success", async () => {
    const note = { id: "1", title: "Test", content: "Body", categories: [] };
    mockCreate.mockResolvedValue(note);

    const res = await request(app)
      .post("/notes")
      .send({ title: "Test", content: "Body" });
    expect(res.status).toBe(201);
    expect(res.body).toEqual(note);
  });

  it("returns 400 when categories not found", async () => {
    mockCreate.mockRejectedValue(new Error("One or more categories not found"));

    const res = await request(app)
      .post("/notes")
      .send({ title: "Test", content: "Body", categoryIds: ["bad-id"] });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "One or more categories not found" });
  });
});

describe("PUT /notes/:id", () => {
  it("returns 400 when title missing", async () => {
    const res = await request(app)
      .put("/notes/1")
      .send({ content: "Body" });
    expect(res.status).toBe(400);
  });

  it("returns 200 on success", async () => {
    const note = { id: "1", title: "Updated", content: "New", categories: [] };
    mockUpdate.mockResolvedValue(note);

    const res = await request(app)
      .put("/notes/1")
      .send({ title: "Updated", content: "New" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(note);
  });

  it("returns 404 when not found", async () => {
    mockUpdate.mockRejectedValue(new Error("Note not found"));

    const res = await request(app)
      .put("/notes/1")
      .send({ title: "Updated", content: "New" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /notes/:id", () => {
  it("returns 204 on success", async () => {
    mockDelete.mockResolvedValue(undefined);

    const res = await request(app).delete("/notes/1");
    expect(res.status).toBe(204);
  });

  it("returns 404 when not found", async () => {
    mockDelete.mockRejectedValue(new Error("Note not found"));

    const res = await request(app).delete("/notes/999");
    expect(res.status).toBe(404);
  });
});
