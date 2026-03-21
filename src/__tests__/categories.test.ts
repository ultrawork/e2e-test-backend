import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";

jest.mock("../middleware/auth", () => ({
  authMiddleware: (req: { user: { userId: string; email: string } }, _res: unknown, next: () => void) => {
    req.user = { userId: "user-1", email: "test@test.com" };
    next();
  },
}));

jest.mock("../lib/prisma", () => ({
  prisma: {
    category: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    note: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    noteCategory: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Categories CRUD", () => {
  const sampleCategory = {
    id: "cat-1",
    name: "Work",
    color: "#FF5733",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  describe("GET /api/categories", () => {
    it("should return list of categories", async () => {
      (mockPrisma.category.findMany as jest.Mock).mockResolvedValue([
        sampleCategory,
      ]);

      const res = await request(app).get("/api/categories");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("Work");
    });
  });

  describe("POST /api/categories", () => {
    it("should create a category with valid data", async () => {
      (mockPrisma.category.create as jest.Mock).mockResolvedValue(
        sampleCategory,
      );

      const res = await request(app)
        .post("/api/categories")
        .send({ name: "Work", color: "#FF5733" });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Work");
      expect(res.body.color).toBe("#FF5733");
    });

    it("should return 400 if name is empty", async () => {
      const res = await request(app)
        .post("/api/categories")
        .send({ name: "", color: "#FF5733" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Name/);
    });

    it("should return 400 if name exceeds 30 characters", async () => {
      const res = await request(app)
        .post("/api/categories")
        .send({ name: "a".repeat(31), color: "#FF5733" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Name/);
    });

    it("should return 400 if color is invalid HEX", async () => {
      const res = await request(app)
        .post("/api/categories")
        .send({ name: "Work", color: "#GGG" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Color/);
    });

    it("should return 400 if color is a word instead of HEX", async () => {
      const res = await request(app)
        .post("/api/categories")
        .send({ name: "Work", color: "red" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Color/);
    });

    it("should return 400 if color is short HEX (#12345)", async () => {
      const res = await request(app)
        .post("/api/categories")
        .send({ name: "Work", color: "#12345" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Color/);
    });
  });

  describe("PUT /api/categories/:id", () => {
    it("should update a category", async () => {
      (mockPrisma.category.update as jest.Mock).mockResolvedValue({
        ...sampleCategory,
        name: "Personal",
      });

      const res = await request(app)
        .put("/api/categories/cat-1")
        .send({ name: "Personal", color: "#FF5733" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Personal");
    });

    it("should return 404 if category not found", async () => {
      const prismaError = new Error("Not found");
      Object.assign(prismaError, { code: "P2025" });
      (mockPrisma.category.update as jest.Mock).mockRejectedValue(prismaError);

      const res = await request(app)
        .put("/api/categories/nonexistent")
        .send({ name: "Test", color: "#AABBCC" });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });

    it("should return 400 for invalid data", async () => {
      const res = await request(app)
        .put("/api/categories/cat-1")
        .send({ name: "", color: "#FF5733" });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/categories/:id", () => {
    it("should delete a category", async () => {
      (mockPrisma.category.delete as jest.Mock).mockResolvedValue(
        sampleCategory,
      );

      const res = await request(app).delete("/api/categories/cat-1");

      expect(res.status).toBe(204);
    });

    it("should return 404 if category not found", async () => {
      const prismaError = new Error("Not found");
      Object.assign(prismaError, { code: "P2025" });
      (mockPrisma.category.delete as jest.Mock).mockRejectedValue(prismaError);

      const res = await request(app).delete("/api/categories/nonexistent");

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });
  });
});

describe("Notes with categories", () => {
  const sampleNote = {
    id: "note-1",
    title: "Test Note",
    content: "Content",
    userId: "user-1",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    categories: [
      {
        noteId: "note-1",
        categoryId: "cat-1",
        category: { id: "cat-1", name: "Work", color: "#FF5733" },
      },
    ],
  };

  describe("GET /api/notes with category filter", () => {
    it("should filter notes by category", async () => {
      (mockPrisma.note.findMany as jest.Mock).mockResolvedValue([sampleNote]);

      const res = await request(app).get("/api/notes?category=cat-1");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].categories[0].id).toBe("cat-1");
      expect(mockPrisma.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { categories: { some: { categoryId: "cat-1" } } },
        }),
      );
    });

    it("should return all notes without category filter", async () => {
      (mockPrisma.note.findMany as jest.Mock).mockResolvedValue([sampleNote]);

      const res = await request(app).get("/api/notes");

      expect(res.status).toBe(200);
      expect(mockPrisma.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });
  });

  describe("GET /api/notes/:id", () => {
    it("should return a note with categories", async () => {
      (mockPrisma.note.findUnique as jest.Mock).mockResolvedValue(sampleNote);

      const res = await request(app).get("/api/notes/note-1");

      expect(res.status).toBe(200);
      expect(res.body.categories).toHaveLength(1);
      expect(res.body.categories[0].name).toBe("Work");
    });

    it("should return 404 if note not found", async () => {
      (mockPrisma.note.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get("/api/notes/nonexistent");

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/notes with categoryIds", () => {
    it("should create note with categories", async () => {
      (mockPrisma.note.create as jest.Mock).mockResolvedValue(sampleNote);

      const res = await request(app).post("/api/notes").send({
        title: "Test Note",
        content: "Content",
        categoryIds: ["cat-1"],
      });

      expect(res.status).toBe(201);
      expect(res.body.categories).toHaveLength(1);
    });
  });

  describe("PUT /api/notes/:id with categoryIds sync", () => {
    it("should sync categories on update", async () => {
      (mockPrisma.note.findUnique as jest.Mock)
        .mockResolvedValueOnce(sampleNote)
        .mockResolvedValueOnce(sampleNote);
      (mockPrisma.note.update as jest.Mock).mockResolvedValue(sampleNote);
      (mockPrisma.noteCategory.deleteMany as jest.Mock).mockResolvedValue({
        count: 1,
      });
      (mockPrisma.noteCategory.createMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      const res = await request(app)
        .put("/api/notes/note-1")
        .send({ categoryIds: ["cat-2"] });

      expect(res.status).toBe(200);
      expect(mockPrisma.noteCategory.deleteMany).toHaveBeenCalledWith({
        where: { noteId: "note-1" },
      });
      expect(mockPrisma.noteCategory.createMany).toHaveBeenCalledWith({
        data: [{ noteId: "note-1", categoryId: "cat-2" }],
      });
    });
  });

  describe("DELETE /api/notes/:id", () => {
    it("should delete a note", async () => {
      (mockPrisma.note.delete as jest.Mock).mockResolvedValue(sampleNote);

      const res = await request(app).delete("/api/notes/note-1");

      expect(res.status).toBe(204);
    });

    it("should return 404 if note not found", async () => {
      const prismaError = new Error("Not found");
      Object.assign(prismaError, { code: "P2025" });
      (mockPrisma.note.delete as jest.Mock).mockRejectedValue(prismaError);

      const res = await request(app).delete("/api/notes/nonexistent");

      expect(res.status).toBe(404);
    });
  });
});
