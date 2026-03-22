import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("devpassword123", 10);

  const user = await prisma.user.upsert({
    where: { id: "default-user-id" },
    update: {},
    create: {
      id: "default-user-id",
      email: "dev@localhost",
      password: hashedPassword,
    },
  });
  console.log(`User: ${user.email} (${user.id})`);

  const categoriesData = [
    { id: "cat-work-0001", name: "Work", color: "#4A90E2" },
    { id: "cat-personal-0002", name: "Personal", color: "#E74C3C" },
    { id: "cat-ideas-0003", name: "Ideas", color: "#2ECC71" },
    { id: "cat-learning-0004", name: "Learning", color: "#F39C12" },
  ];

  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, color: cat.color },
      create: cat,
    });
    console.log(`Category: ${category.name} (${category.color})`);
  }

  const notesData = [
    {
      id: "note-0001",
      title: "Sprint planning notes",
      content: "Review backlog items and estimate story points for Q2 sprint.",
      categoryIds: ["cat-work-0001"],
    },
    {
      id: "note-0002",
      title: "API integration checklist",
      content:
        "1. Set up authentication\n2. Configure CORS\n3. Write integration tests",
      categoryIds: ["cat-work-0001"],
    },
    {
      id: "note-0003",
      title: "Code review guidelines",
      content:
        "Focus on readability, test coverage, and consistent error handling.",
      categoryIds: ["cat-work-0001"],
    },
    {
      id: "note-0004",
      title: "Grocery list",
      content: "Milk, bread, eggs, coffee beans, avocados.",
      categoryIds: ["cat-personal-0002"],
    },
    {
      id: "note-0005",
      title: "Weekend trip plan",
      content: "Book hotel, rent a car, pack hiking gear.",
      categoryIds: ["cat-personal-0002"],
    },
    {
      id: "note-0006",
      title: "App feature brainstorm",
      content:
        "Offline mode, dark theme, push notifications, collaborative editing.",
      categoryIds: ["cat-ideas-0003", "cat-learning-0004"],
    },
    {
      id: "note-0007",
      title: "TypeScript advanced patterns",
      content:
        "Study discriminated unions, template literal types, and conditional types.",
      categoryIds: ["cat-learning-0004"],
    },
  ];

  for (const noteData of notesData) {
    const note = await prisma.note.upsert({
      where: { id: noteData.id },
      update: {
        title: noteData.title,
        content: noteData.content,
        categories: {
          set: noteData.categoryIds.map((id) => ({ id })),
        },
      },
      create: {
        id: noteData.id,
        title: noteData.title,
        content: noteData.content,
        userId: user.id,
        categories: {
          connect: noteData.categoryIds.map((id) => ({ id })),
        },
      },
    });
    console.log(`Note: ${note.title}`);
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
