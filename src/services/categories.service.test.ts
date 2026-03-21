import { validateCategoryInput } from "./categories.service";

describe("validateCategoryInput", () => {
  it("returns null for valid input", () => {
    expect(validateCategoryInput("Work", "#FF5733")).toBeNull();
  });

  it("rejects empty name", () => {
    expect(validateCategoryInput("", "#FF5733")).toBe(
      "name must be between 1 and 30 characters"
    );
  });

  it("rejects name longer than 30 characters", () => {
    const longName = "a".repeat(31);
    expect(validateCategoryInput(longName, "#FF5733")).toBe(
      "name must be between 1 and 30 characters"
    );
  });

  it("accepts name with exactly 30 characters", () => {
    const name30 = "a".repeat(30);
    expect(validateCategoryInput(name30, "#FF5733")).toBeNull();
  });

  it("accepts name with exactly 1 character", () => {
    expect(validateCategoryInput("A", "#FF5733")).toBeNull();
  });

  it("rejects invalid hex color without hash", () => {
    expect(validateCategoryInput("Work", "FF5733")).toBe(
      "color must be a valid hex color (#RRGGBB)"
    );
  });

  it("rejects hex color with wrong length", () => {
    expect(validateCategoryInput("Work", "#FFF")).toBe(
      "color must be a valid hex color (#RRGGBB)"
    );
  });

  it("rejects hex color with invalid characters", () => {
    expect(validateCategoryInput("Work", "#GGGGGG")).toBe(
      "color must be a valid hex color (#RRGGBB)"
    );
  });

  it("accepts lowercase hex color", () => {
    expect(validateCategoryInput("Work", "#aabbcc")).toBeNull();
  });

  it("accepts mixed case hex color", () => {
    expect(validateCategoryInput("Work", "#AaBbCc")).toBeNull();
  });
});
