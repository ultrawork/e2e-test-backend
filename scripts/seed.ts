/**
 * Seed script: resets the database and inserts deterministic test data
 * for E2E and iOS UI tests.
 *
 * Usage:
 *   npx ts-node scripts/seed.ts
 *   npm run seed
 */

import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TEST_USER_EMAIL = "test@example.com";
const TEST_USER_PASSWORD = "P@ssw0rd";

async function main(): Promise<void> {
  console.log("🌱 Starting seed...");

  // Clean up existing data in correct order (FK constraints)
  await prisma.note.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("  ✓ Cleared existing notes and users");

  // Create test user
  const hashedPassword = await bcrypt.hash(TEST_USER_PASSWORD, 10);
  const user = await prisma.user.create({
    data: {
      email: TEST_USER_EMAIL,
      password: hashedPassword,
    },
  });
  console.log(`  ✓ Created user: ${user.email} (id: ${user.id})`);

  // Create seed notes
  const now = new Date();
  const note1 = await prisma.note.create({
    data: {
      userId: user.id,
      title: "Seed note 1",
      content: "First seed note content",
      createdAt: new Date(now.getTime() - 2 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 2 * 60 * 1000),
    },
  });
  console.log(`  ✓ Created note: "${note1.title}" (id: ${note1.id})`);

  const note2 = await prisma.note.create({
    data: {
      userId: user.id,
      title: "Seed note 2",
      content: "Second seed note content",
      createdAt: new Date(now.getTime() - 1 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 1 * 60 * 1000),
    },
  });
  console.log(`  ✓ Created note: "${note2.title}" (id: ${note2.id})`);

  const note3 = await prisma.note.create({
    data: {
      userId: user.id,
      title: "Seed note 3",
      content: "Third seed note content",
      createdAt: now,
      updatedAt: now,
    },
  });
  console.log(`  ✓ Created note: "${note3.title}" (id: ${note3.id})`);

  console.log("✅ Seed complete.");
  console.log(`   Test user: ${TEST_USER_EMAIL} / ${TEST_USER_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
