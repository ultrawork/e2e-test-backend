import { validateCategoryInput } from "../services/categories.service";

describe("validateCategoryInput", () => {
  it("returns error if name is empty", () => {
    expect(validateCategoryInput("", "#FF0000")).toBe(
      "name must be between 1 and 30 characters"
    );
  });

  it("returns error if name exceeds 30 characters", () => {
    const longName = "a".repeat(31);
    expect(validateCategoryInput(longName, "#FF0000")).toBe(
      "name must be between 1 and 30 characters"
    );
  });

  it("returns error if color is not a valid hex", () => {
    expect(validateCategoryInput("Work", "red")).toBe(
      "color must be a valid hex color (#RRGGBB)"
    );
  });

  it("returns error if color is missing leading #", () => {
    expect(validateCategoryInput("Work", "FF0000")).toBe(
      "color must be a valid hex color (#RRGGBB)"
    );
  });

  it("returns error if color has wrong length", () => {
    expect(validateCategoryInput("Work", "#FFF")).toBe(
      "color must be a valid hex color (#RRGGBB)"
    );
  });

  it("returns null for valid input", () => {
    expect(validateCategoryInput("Work", "#FF0000")).toBeNull();
  });

  it("returns null for name with exactly 30 characters", () => {
    const name = "a".repeat(30);
    expect(validateCategoryInput(name, "#aAbBcC")).toBeNull();
  });
});

describe("categoriesService with mocked Prisma", () => {
  const mockCreate = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();
  const mockFindMany = jest.fn();
  const mockFindUnique = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    jest.mock("../lib/prisma", () => ({
      prisma: {
        category: {
          create: mockCreate,
          update: mockUpdate,
          delete: mockDelete,
          findMany: mockFindMany,
          findUnique: mockFindUnique,
        },
      },
    }));
    jest.clearAllMocks();
  });

  it("createCategory calls prisma.category.create with correct data", async () => {
    const { createCategory } = await import("../services/categories.service");
    const expected = {
      id: "1",
      name: "Work",
      color: "#FF0000",
      createdAt: new Date(),
    };
    mockCreate.mockResolvedValueOnce(expected);

    const result = await createCategory("Work", "#FF0000");
    expect(mockCreate).toHaveBeenCalledWith({
      data: { name: "Work", color: "#FF0000" },
    });
    expect(result).toEqual(expected);
  });

  it("updateCategory throws 404 if category not found", async () => {
    const { updateCategory } = await import("../services/categories.service");
    mockFindUnique.mockResolvedValueOnce(null);

    await expect(updateCategory("nonexistent-id", "Work", "#FF0000")).rejects.toThrow(
      "Category not found"
    );
  });
});
