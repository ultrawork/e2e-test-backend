import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data deterministically
  await prisma.note.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const user = await prisma.user.create({
    data: {
      email: "demo@e2e.local",
      password: "hashed-placeholder",
    },
  });

  // Create 2 categories
  const catWork = await prisma.category.create({
    data: { name: "Работа", color: "#FF5733" },
  });

  const catPersonal = await prisma.category.create({
    data: { name: "Личное", color: "#33AAFF" },
  });

  // Create 5 notes for the demo user
  // Note 1: favorited, category "Работа"
  await prisma.note.create({
    data: {
      title: "Планирование спринта",
      content: "Обсудить задачи на следующий спринт",
      isFavorited: true,
      userId: user.id,
      categories: { connect: [{ id: catWork.id }] },
    },
  });

  // Note 2: favorited, category "Личное"
  await prisma.note.create({
    data: {
      title: "Список покупок",
      content: "Молоко, хлеб, яйца",
      isFavorited: true,
      userId: user.id,
      categories: { connect: [{ id: catPersonal.id }] },
    },
  });

  // Note 3: not favorited, both categories
  await prisma.note.create({
    data: {
      title: "Рабочие контакты",
      content: "Обновить список контактов",
      isFavorited: false,
      userId: user.id,
      categories: { connect: [{ id: catWork.id }, { id: catPersonal.id }] },
    },
  });

  // Note 4: not favorited, no categories
  await prisma.note.create({
    data: {
      title: "Идеи для проекта",
      content: "Записать идеи для нового проекта",
      isFavorited: false,
      userId: user.id,
    },
  });

  // Note 5: not favorited, category "Работа"
  await prisma.note.create({
    data: {
      title: "Заметки с митинга",
      content: "Ключевые решения с утреннего митинга",
      isFavorited: false,
      userId: user.id,
      categories: { connect: [{ id: catWork.id }] },
    },
  });

  console.log("Seed completed: 1 user, 2 categories, 5 notes");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
