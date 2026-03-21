describe("notesService with mocked Prisma", () => {
  const mockNoteFindMany = jest.fn();
  const mockNoteFindUnique = jest.fn();
  const mockNoteCreate = jest.fn();
  const mockNoteUpdate = jest.fn();
  const mockNoteDelete = jest.fn();
  const mockCategoryFindMany = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    jest.mock("../lib/prisma", () => ({
      prisma: {
        note: {
          findMany: mockNoteFindMany,
          findUnique: mockNoteFindUnique,
          create: mockNoteCreate,
          update: mockNoteUpdate,
          delete: mockNoteDelete,
        },
        category: {
          findMany: mockCategoryFindMany,
        },
      },
    }));
    jest.clearAllMocks();
  });

  it("listNotes calls findMany with userId filter and includes categories", async () => {
    const { listNotes } = await import("../services/notes.service");
    mockNoteFindMany.mockResolvedValueOnce([]);

    await listNotes("user-1");

    expect(mockNoteFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1" }),
        include: expect.objectContaining({ categories: true }),
      })
    );
  });

  it("listNotes with categoryId filters by category", async () => {
    const { listNotes } = await import("../services/notes.service");
    mockNoteFindMany.mockResolvedValueOnce([]);

    await listNotes("user-1", "cat-1");

    expect(mockNoteFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          categories: { some: { id: "cat-1" } },
        }),
      })
    );
  });

  it("updateNote uses set for categoryIds", async () => {
    const { updateNote } = await import("../services/notes.service");
    const existingNote = {
      id: "note-1",
      userId: "user-1",
      title: "T",
      content: "C",
      createdAt: new Date(),
      updatedAt: new Date(),
      categories: [],
    };
    mockNoteFindUnique.mockResolvedValueOnce(existingNote);
    mockCategoryFindMany.mockResolvedValueOnce([{ id: "cat-1" }]);
    mockNoteUpdate.mockResolvedValueOnce({ ...existingNote, categories: [] });

    await updateNote("note-1", "user-1", "New Title", "New Content", ["cat-1"]);

    expect(mockNoteUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          categories: { set: [{ id: "cat-1" }] },
        }),
      })
    );
  });

  it("updateNote throws 400 if categoryId does not exist", async () => {
    const { updateNote } = await import("../services/notes.service");
    const existingNote = {
      id: "note-1",
      userId: "user-1",
      title: "T",
      content: "C",
      createdAt: new Date(),
      updatedAt: new Date(),
      categories: [],
    };
    mockNoteFindUnique.mockResolvedValueOnce(existingNote);
    mockCategoryFindMany.mockResolvedValueOnce([]);

    await expect(
      updateNote("note-1", "user-1", "Title", "Content", ["nonexistent-cat"])
    ).rejects.toThrow("One or more categories not found");
  });

  it("updateNote throws 404 if note not found", async () => {
    const { updateNote } = await import("../services/notes.service");
    mockNoteFindUnique.mockResolvedValueOnce(null);

    await expect(
      updateNote("nonexistent", "user-1", "Title", "Content")
    ).rejects.toThrow("Note not found");
  });

  it("updateNote throws 403 if userId does not match", async () => {
    const { updateNote } = await import("../services/notes.service");
    mockNoteFindUnique.mockResolvedValueOnce({
      id: "note-1",
      userId: "other-user",
    });

    await expect(
      updateNote("note-1", "user-1", "Title", "Content")
    ).rejects.toThrow("Forbidden");
  });
});
