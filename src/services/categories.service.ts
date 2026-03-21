import { prisma } from "../lib/prisma";
import { Category } from "@prisma/client";

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

/** Validates category name and color. Returns error message or null. */
export function validateCategoryInput(
  name: string,
  color: string
): string | null {
  if (!name || name.length > 30) {
    return "name must be between 1 and 30 characters";
  }
  if (!HEX_REGEX.test(color)) {
    return "color must be a valid hex color (#RRGGBB)";
  }
  return null;
}

/** Returns all categories. */
export async function listCategories(): Promise<Category[]> {
  return prisma.category.findMany();
}

/** Returns a category by id. Throws if not found. */
export async function getCategoryById(id: string): Promise<Category> {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new Error("Category not found");
  }
  return category;
}

/** Creates a new category. Throws if name already exists. */
export async function createCategory(
  name: string,
  color: string
): Promise<Category> {
  const existing = await prisma.category.findFirst({ where: { name } });
  if (existing) {
    throw new Error("Category name already exists");
  }
  return prisma.category.create({ data: { name, color } });
}

/** Updates a category. Throws if not found or name conflicts. */
export async function updateCategory(
  id: string,
  name: string,
  color: string
): Promise<Category> {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Category not found");
  }
  const duplicate = await prisma.category.findFirst({
    where: { name, id: { not: id } },
  });
  if (duplicate) {
    throw new Error("Category name already exists");
  }
  return prisma.category.update({ where: { id }, data: { name, color } });
}

/** Deletes a category. Throws if not found. */
export async function deleteCategory(id: string): Promise<void> {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Category not found");
  }
  await prisma.category.delete({ where: { id } });
}
