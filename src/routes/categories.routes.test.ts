import request from "supertest";
import express, { Request, Response, NextFunction } from "express";
import { categoriesRouter } from "./categories.routes";

jest.mock("../middleware/auth", () => ({
  authMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

jest.mock("../services/categories.service", () => ({
  validateCategoryInput: jest.fn(),
  listCategories: jest.fn(),
  getCategoryById: jest.fn(),
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
}));

import {
  validateCategoryInput,
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/categories.service";

const mockValidate = validateCategoryInput as jest.Mock;
const mockList = listCategories as jest.Mock;
const mockGetById = getCategoryById as jest.Mock;
const mockCreate = createCategory as jest.Mock;
const mockUpdate = updateCategory as jest.Mock;
const mockDelete = deleteCategory as jest.Mock;

const app = express();
app.use(express.json());
app.use("/categories", categoriesRouter);

beforeEach(() => jest.clearAllMocks());

describe("GET /categories", () => {
  it("returns 200 with list of categories", async () => {
    const cats = [{ id: "1", name: "Work", color: "#FF0000", createdAt: new Date().toISOString() }];
    mockList.mockResolvedValue(cats);

    const res = await request(app).get("/categories");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(cats);
  });

  it("returns 500 on service error", async () => {
    mockList.mockRejectedValue(new Error("DB error"));

    const res = await request(app).get("/categories");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});

describe("GET /categories/:id", () => {
  it("returns 200 with category", async () => {
    const cat = { id: "1", name: "Work", color: "#FF0000" };
    mockGetById.mockResolvedValue(cat);

    const res = await request(app).get("/categories/1");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(cat);
  });

  it("returns 404 when not found", async () => {
    mockGetById.mockRejectedValue(new Error("Category not found"));

    const res = await request(app).get("/categories/999");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Category not found" });
  });
});

describe("POST /categories", () => {
  it("returns 400 on validation error", async () => {
    mockValidate.mockReturnValue("name must be between 1 and 30 characters");

    const res = await request(app)
      .post("/categories")
      .send({ name: "", color: "#FFF" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "name must be between 1 and 30 characters" });
  });

  it("returns 201 on success", async () => {
    mockValidate.mockReturnValue(null);
    const cat = { id: "1", name: "Work", color: "#FF0000" };
    mockCreate.mockResolvedValue(cat);

    const res = await request(app)
      .post("/categories")
      .send({ name: "Work", color: "#FF0000" });
    expect(res.status).toBe(201);
    expect(res.body).toEqual(cat);
  });

  it("returns 400 when name already exists", async () => {
    mockValidate.mockReturnValue(null);
    mockCreate.mockRejectedValue(new Error("Category name already exists"));

    const res = await request(app)
      .post("/categories")
      .send({ name: "Work", color: "#FF0000" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Category name already exists" });
  });
});

describe("PUT /categories/:id", () => {
  it("returns 200 on success", async () => {
    mockValidate.mockReturnValue(null);
    const cat = { id: "1", name: "Updated", color: "#00FF00" };
    mockUpdate.mockResolvedValue(cat);

    const res = await request(app)
      .put("/categories/1")
      .send({ name: "Updated", color: "#00FF00" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(cat);
  });

  it("returns 404 when not found", async () => {
    mockValidate.mockReturnValue(null);
    mockUpdate.mockRejectedValue(new Error("Category not found"));

    const res = await request(app)
      .put("/categories/999")
      .send({ name: "Updated", color: "#00FF00" });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Category not found" });
  });

  it("returns 400 on duplicate name", async () => {
    mockValidate.mockReturnValue(null);
    mockUpdate.mockRejectedValue(new Error("Category name already exists"));

    const res = await request(app)
      .put("/categories/1")
      .send({ name: "Dup", color: "#00FF00" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Category name already exists" });
  });
});

describe("DELETE /categories/:id", () => {
  it("returns 204 on success", async () => {
    mockDelete.mockResolvedValue(undefined);

    const res = await request(app).delete("/categories/1");
    expect(res.status).toBe(204);
  });

  it("returns 404 when not found", async () => {
    mockDelete.mockRejectedValue(new Error("Category not found"));

    const res = await request(app).delete("/categories/999");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Category not found" });
  });
});
