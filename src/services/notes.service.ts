import { prisma } from "../lib/prisma";
import { NoteWithCategories } from "../models/note";

/** Returns notes for a user, optionally filtered by category id and/or favorites. */
export async function listNotes(
  userId: string,
  categoryId?: string,
  favoritesOnly?: boolean
): Promise<NoteWithCategories[]> {
  return prisma.note.findMany({
    where: {
      userId,
      ...(categoryId ? { categories: { some: { id: categoryId } } } : {}),
      ...(favoritesOnly ? { isFavorited: true } : {}),
    },
    include: { categories: true },
  });
}

/** Returns a single note by id. Throws if not found or forbidden. */
export async function getNoteById(
  id: string,
  userId: string
): Promise<NoteWithCategories> {
  const note = await prisma.note.findUnique({
    where: { id },
    include: { categories: true },
  });
  if (!note) {
    throw new Error("Note not found");
  }
  if (note.userId !== userId) {
    throw new Error("Forbidden");
  }
  return note;
}

/** Validates that all category ids exist. Throws if any missing. */
async function validateCategoryIds(categoryIds: string[]): Promise<void> {
  if (categoryIds.length === 0) return;
  const existing = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true },
  });
  if (existing.length !== categoryIds.length) {
    throw new Error("One or more categories not found");
  }
}

/** Creates a note with optional category connections. */
export async function createNote(
  userId: string,
  title: string,
  content: string,
  categoryIds?: string[]
): Promise<NoteWithCategories> {
  if (categoryIds && categoryIds.length > 0) {
    await validateCategoryIds(categoryIds);
  }
  return prisma.note.create({
    data: {
      userId,
      title,
      content,
      ...(categoryIds && categoryIds.length > 0
        ? { categories: { connect: categoryIds.map((id) => ({ id })) } }
        : {}),
    },
    include: { categories: true },
  });
}

/** Updates a note. Uses `set` for category reassignment. */
export async function updateNote(
  id: string,
  userId: string,
  title: string,
  content: string,
  categoryIds?: string[]
): Promise<NoteWithCategories> {
  const existing = await prisma.note.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Note not found");
  }
  if (existing.userId !== userId) {
    throw new Error("Forbidden");
  }
  if (categoryIds && categoryIds.length > 0) {
    await validateCategoryIds(categoryIds);
  }
  return prisma.note.update({
    where: { id },
    data: {
      title,
      content,
      ...(categoryIds !== undefined
        ? { categories: { set: categoryIds.map((cid) => ({ id: cid })) } }
        : {}),
    },
    include: { categories: true },
  });
}

/** Deletes a note. Throws if not found or forbidden. */
export async function deleteNote(id: string, userId: string): Promise<void> {
  const existing = await prisma.note.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Note not found");
  }
  if (existing.userId !== userId) {
    throw new Error("Forbidden");
  }
  await prisma.note.delete({ where: { id } });
}

/** Toggles the isFavorited flag on a note. Throws if not found or forbidden. */
export async function toggleFavorite(
  id: string,
  userId: string
): Promise<NoteWithCategories> {
  const note = await prisma.note.findUnique({
    where: { id },
    include: { categories: true },
  });
  if (!note) {
    throw new Error("Note not found");
  }
  if (note.userId !== userId) {
    throw new Error("Forbidden");
  }
  return prisma.note.update({
    where: { id },
    data: { isFavorited: !note.isFavorited },
    include: { categories: true },
  });
}
