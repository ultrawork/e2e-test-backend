import { prisma } from "../lib/prisma";
import { Category } from "@prisma/client";

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

/** Returns an error message if input is invalid, otherwise null. */
export function validateCategoryInput(
  name: string,
  color: string
): string | null {
  if (!name || name.length < 1 || name.length > 30) {
    return "name must be between 1 and 30 characters";
  }
  if (!HEX_REGEX.test(color)) {
    return "color must be a valid hex color (#RRGGBB)";
  }
  return null;
}

export async function listCategories(): Promise<Category[]> {
  return prisma.category.findMany();
}

export async function createCategory(
  name: string,
  color: string
): Promise<Category> {
  return prisma.category.create({ data: { name, color } });
}

export async function updateCategory(
  id: string,
  name: string,
  color: string
): Promise<Category> {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Category not found");
  }
  return prisma.category.update({ where: { id }, data: { name, color } });
}

export async function deleteCategory(id: string): Promise<void> {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Category not found");
  }
  await prisma.category.delete({ where: { id } });
}
