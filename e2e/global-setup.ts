import { Client } from "pg";
import { execSync } from "child_process";
import * as path from "path";

const DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/notes";

async function globalSetup() {
  // Run prisma migrate deploy to ensure all migrations are applied
  try {
    execSync("npx prisma migrate deploy", {
      cwd: path.resolve(__dirname, ".."),
      env: { ...process.env, DATABASE_URL },
      stdio: "pipe",
      timeout: 30000,
    });
  } catch (err: any) {
    // If prisma migrate deploy fails (e.g., tables already exist from db push),
    // fall back to applying the join table SQL directly
    const client = new Client({ connectionString: DATABASE_URL });
    try {
      await client.connect();

      // Drop legacy category enum column from notes table if it exists
      await client.query(`
        ALTER TABLE "notes" DROP COLUMN IF EXISTS "category";
      `);

      // Ensure _CategoryToNote join table exists with CASCADE constraints
      await client.query(`
        CREATE TABLE IF NOT EXISTS "_CategoryToNote" (
          "A" TEXT NOT NULL,
          "B" TEXT NOT NULL
        );
      `);

      // Create unique index if not exists
      await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "_CategoryToNote_AB_unique"
          ON "_CategoryToNote"("A", "B");
      `);

      // Create B index if not exists
      await client.query(`
        CREATE INDEX IF NOT EXISTS "_CategoryToNote_B_index"
          ON "_CategoryToNote"("B");
      `);

      // Add FK constraints if they don't already exist
      const fkCheck = await client.query(`
        SELECT conname FROM pg_constraint
        WHERE conrelid = '"_CategoryToNote"'::regclass AND contype = 'f'
      `);
      const existingFks = fkCheck.rows.map((r: { conname: string }) => r.conname);

      if (!existingFks.includes("_CategoryToNote_A_fkey")) {
        await client.query(`
          ALTER TABLE "_CategoryToNote"
            ADD CONSTRAINT "_CategoryToNote_A_fkey"
            FOREIGN KEY ("A") REFERENCES "categories"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
        `);
      }

      if (!existingFks.includes("_CategoryToNote_B_fkey")) {
        await client.query(`
          ALTER TABLE "_CategoryToNote"
            ADD CONSTRAINT "_CategoryToNote_B_fkey"
            FOREIGN KEY ("B") REFERENCES "notes"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
        `);
      }
    } finally {
      await client.end();
    }
  }
}

export default globalSetup;
