import { Note, Category } from "@prisma/client";

export type { Note };

export type NoteWithCategories = Note & { categories: Category[] };
