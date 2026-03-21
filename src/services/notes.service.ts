import { prisma } from "../lib/prisma";
import { NoteWithCategories } from "../models/note";

export async function listNotes(
  userId: string,
  categoryId?: string
): Promise<NoteWithCategories[]> {
  return prisma.note.findMany({
    where: {
      userId,
      ...(categoryId ? { categories: { some: { id: categoryId } } } : {}),
    },
    include: { categories: true },
  });
}

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

export async function createNote(
  userId: string,
  title: string,
  content: string,
  categoryIds?: string[],
  email?: string
): Promise<NoteWithCategories> {
  if (categoryIds && categoryIds.length > 0) {
    await validateCategoryIds(categoryIds);
  }
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email: email || `${userId}@placeholder.local`, password: "" },
  });
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
