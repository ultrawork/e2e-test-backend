describe("notesService with mocked Prisma", () => {
  const mockFindMany = jest.fn();
  const mockFindUnique = jest.fn();
  const mockCreate = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    jest.mock("../lib/prisma", () => ({
      prisma: {
        note: {
          findMany: mockFindMany,
          findUnique: mockFindUnique,
          create: mockCreate,
          update: mockUpdate,
          delete: mockDelete,
        },
      },
    }));
    jest.clearAllMocks();
  });

  it("listNotes calls findMany with userId filter and includes categories", async () => {
    const { listNotes } = await import("../services/notes.service");
    mockFindMany.mockResolvedValueOnce([]);

    await listNotes("user-1");

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1" }),
        include: expect.objectContaining({ categories: true }),
      })
    );
  });

  it("listNotes with categoryId filters by category", async () => {
    const { listNotes } = await import("../services/notes.service");
    mockFindMany.mockResolvedValueOnce([]);

    await listNotes("user-1", "cat-1");

    expect(mockFindMany).toHaveBeenCalledWith(
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
    mockFindUnique.mockResolvedValueOnce(existingNote);
    mockUpdate.mockResolvedValueOnce({ ...existingNote, categories: [] });

    await updateNote("note-1", "user-1", "New Title", "New Content", ["cat-1"]);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          categories: { set: [{ id: "cat-1" }] },
        }),
      })
    );
  });

  it("updateNote throws 404 if note not found", async () => {
    const { updateNote } = await import("../services/notes.service");
    mockFindUnique.mockResolvedValueOnce(null);

    await expect(
      updateNote("nonexistent", "user-1", "Title", "Content")
    ).rejects.toThrow("Note not found");
  });

  it("updateNote throws 403 if userId does not match", async () => {
    const { updateNote } = await import("../services/notes.service");
    mockFindUnique.mockResolvedValueOnce({
      id: "note-1",
      userId: "other-user",
    });

    await expect(
      updateNote("note-1", "user-1", "Title", "Content")
    ).rejects.toThrow("Forbidden");
  });
});
