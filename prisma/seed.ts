import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_USER_ID = "default-user-id";
const SEED_CATEGORY_WORK_ID = "a0000000-0000-0000-0000-000000000001";
const SEED_CATEGORY_PERSONAL_ID = "a0000000-0000-0000-0000-000000000002";
const SEED_NOTE_IDS = [
  "b0000000-0000-0000-0000-000000000001",
  "b0000000-0000-0000-0000-000000000002",
  "b0000000-0000-0000-0000-000000000003",
  "b0000000-0000-0000-0000-000000000004",
  "b0000000-0000-0000-0000-000000000005",
];

async function main() {
  // Upsert user
  await prisma.user.upsert({
    where: { id: SEED_USER_ID },
    update: {},
    create: {
      id: SEED_USER_ID,
      email: "dev@localhost",
      password: "not-a-real-password",
    },
  });

  // Upsert categories
  await prisma.category.upsert({
    where: { id: SEED_CATEGORY_WORK_ID },
    update: { name: "Работа", color: "#FF5733" },
    create: { id: SEED_CATEGORY_WORK_ID, name: "Работа", color: "#FF5733" },
  });

  await prisma.category.upsert({
    where: { id: SEED_CATEGORY_PERSONAL_ID },
    update: { name: "Личное", color: "#4CAF50" },
    create: { id: SEED_CATEGORY_PERSONAL_ID, name: "Личное", color: "#4CAF50" },
  });

  // Upsert 5 notes with varying categories and isFavorited
  const notesData = [
    {
      id: SEED_NOTE_IDS[0],
      title: "Рабочая задача",
      content: "Подготовить отчёт",
      isFavorited: true,
      categoryIds: [SEED_CATEGORY_WORK_ID],
    },
    {
      id: SEED_NOTE_IDS[1],
      title: "Личная заметка",
      content: "Купить продукты",
      isFavorited: false,
      categoryIds: [SEED_CATEGORY_PERSONAL_ID],
    },
    {
      id: SEED_NOTE_IDS[2],
      title: "Смешанная заметка",
      content: "Рабочая и личная",
      isFavorited: true,
      categoryIds: [SEED_CATEGORY_WORK_ID, SEED_CATEGORY_PERSONAL_ID],
    },
    {
      id: SEED_NOTE_IDS[3],
      title: "Без категории",
      content: "Просто заметка",
      isFavorited: false,
      categoryIds: [],
    },
    {
      id: SEED_NOTE_IDS[4],
      title: "Избранная без категории",
      content: "Важная заметка",
      isFavorited: true,
      categoryIds: [],
    },
  ];

  for (const n of notesData) {
    await prisma.note.upsert({
      where: { id: n.id },
      update: {
        title: n.title,
        content: n.content,
        isFavorited: n.isFavorited,
        categories: { set: n.categoryIds.map((id) => ({ id })) },
      },
      create: {
        id: n.id,
        title: n.title,
        content: n.content,
        isFavorited: n.isFavorited,
        userId: SEED_USER_ID,
        categories: { connect: n.categoryIds.map((id) => ({ id })) },
      },
    });
  }

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
