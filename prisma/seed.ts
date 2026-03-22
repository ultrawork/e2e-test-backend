import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // 1. Upsert default user
  const passwordHash = await bcrypt.hash("password", 10);
  const user = await prisma.user.upsert({
    where: { id: "default-user-id" },
    update: {},
    create: {
      id: "default-user-id",
      email: "dev@localhost",
      password: passwordHash,
    },
  });

  // 2. Upsert categories
  const categoryData = [
    { name: "Work", color: "#ff0000" },
    { name: "Personal", color: "#0000ff" },
    { name: "Ideas", color: "#00ff00" },
  ];

  const categories = [];
  for (const cat of categoryData) {
    const category = await prisma.category.upsert({
      where: { id: cat.name.toLowerCase() },
      update: { name: cat.name, color: cat.color },
      create: { id: cat.name.toLowerCase(), name: cat.name, color: cat.color },
    });
    categories.push(category);
  }

  // 3. Clean existing notes for default user (idempotent re-run)
  await prisma.note.deleteMany({ where: { userId: user.id } });

  // 4. Create 5 notes (2 favorited, 3 not)
  const notes = [
    {
      title: "Meeting Notes",
      content: "Discuss project milestones and deliverables",
      isFavorited: true,
      categoryIds: [categories[0].id],
    },
    {
      title: "Shopping List",
      content: "Milk, eggs, bread, butter",
      isFavorited: false,
      categoryIds: [categories[1].id],
    },
    {
      title: "App Feature Ideas",
      content: "Dark mode, offline support, push notifications",
      isFavorited: true,
      categoryIds: [categories[2].id],
    },
    {
      title: "Book Recommendations",
      content: "Clean Code, The Pragmatic Programmer, Refactoring",
      isFavorited: false,
      categoryIds: [categories[1].id, categories[2].id],
    },
    {
      title: "Weekly Review",
      content: "Review completed tasks and plan next week",
      isFavorited: false,
      categoryIds: [categories[0].id],
    },
  ];

  for (const note of notes) {
    await prisma.note.create({
      data: {
        title: note.title,
        content: note.content,
        isFavorited: note.isFavorited,
        userId: user.id,
        categories: { connect: note.categoryIds.map((id) => ({ id })) },
      },
    });
  }

  console.log(`Seeded: 1 user, ${categories.length} categories, ${notes.length} notes`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
