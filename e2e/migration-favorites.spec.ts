import { test, expect } from "@playwright/test";
import { Client } from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/notes";

let dbClient: Client;

test.beforeAll(async () => {
  dbClient = new Client({ connectionString: DATABASE_URL });
  await dbClient.connect();
});

test.afterAll(async () => {
  await dbClient.end();
});

test.describe("Database Migration - is_favorited", () => {
  test("SC-005: notes table has is_favorited boolean column with default false", async () => {
    const result = await dbClient.query(
      `SELECT column_name, data_type, column_default
       FROM information_schema.columns
       WHERE table_name = 'notes' AND column_name = 'is_favorited'`
    );

    expect(result.rows).toHaveLength(1);

    const col = result.rows[0];
    expect(col.data_type).toBe("boolean");
    expect(col.column_default).toBe("false");
  });
});
