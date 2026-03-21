import { test, expect } from "@playwright/test";
import { Client } from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@host.docker.internal:5432/notes";

let dbClient: Client | null = null;

test.beforeAll(async () => {
  try {
    dbClient = new Client({ connectionString: DATABASE_URL });
    await dbClient.connect();
  } catch {
    dbClient = null;
  }
});

test.afterAll(async () => {
  if (dbClient) {
    await dbClient.end();
  }
});

test.describe("Database Migration - Category M:N", () => {
  test("SC-001: Health endpoint works after migration", async ({ request }) => {
    const response = await request.get("/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ status: "ok" });
  });

  test("SC-002: Migration creates categories table with correct structure", async () => {
    test.skip(!dbClient, "Database connection not available");
    const result = await dbClient!.query(
      `SELECT column_name, data_type, column_default
       FROM information_schema.columns
       WHERE table_name = 'categories'
       ORDER BY ordinal_position`
    );

    const columns = result.rows;
    const columnNames = columns.map((c: { column_name: string }) => c.column_name);

    expect(columnNames).toContain("id");
    expect(columnNames).toContain("name");
    expect(columnNames).toContain("color");
    expect(columnNames).toContain("created_at");

    const idCol = columns.find((c: { column_name: string }) => c.column_name === "id");
    expect(idCol.data_type).toBe("text");

    const nameCol = columns.find((c: { column_name: string }) => c.column_name === "name");
    expect(nameCol.data_type).toBe("text");

    const colorCol = columns.find((c: { column_name: string }) => c.column_name === "color");
    expect(colorCol.data_type).toBe("text");

    const createdAtCol = columns.find(
      (c: { column_name: string }) => c.column_name === "created_at"
    );
    expect(createdAtCol.data_type).toBe("timestamp without time zone");
    expect(createdAtCol.column_default).toContain("CURRENT_TIMESTAMP");
  });

  test("SC-003: Migration creates _CategoryToNote join table with cascading deletes", async () => {
    test.skip(!dbClient, "Database connection not available");
    // Verify table exists
    const tableResult = await dbClient!.query(
      `SELECT tablename FROM pg_tables WHERE tablename = '_CategoryToNote'`
    );
    expect(tableResult.rows).toHaveLength(1);

    // Verify FK constraints with CASCADE delete
    const fkResult = await dbClient!.query(
      `SELECT conname, confdeltype
       FROM pg_constraint
       WHERE conrelid = '"_CategoryToNote"'::regclass AND contype = 'f'
       ORDER BY conname`
    );

    expect(fkResult.rows).toHaveLength(2);

    const fkA = fkResult.rows.find(
      (r: { conname: string }) => r.conname === "_CategoryToNote_A_fkey"
    );
    const fkB = fkResult.rows.find(
      (r: { conname: string }) => r.conname === "_CategoryToNote_B_fkey"
    );

    expect(fkA).toBeDefined();
    expect(fkA.confdeltype).toBe("c"); // CASCADE

    expect(fkB).toBeDefined();
    expect(fkB.confdeltype).toBe("c"); // CASCADE
  });

  test("SC-004: Old category enum field removed from notes table", async () => {
    test.skip(!dbClient, "Database connection not available");
    const result = await dbClient!.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = 'notes'`
    );

    const columnNames = result.rows.map((c: { column_name: string }) => c.column_name);

    // category column must NOT exist
    expect(columnNames).not.toContain("category");

    // Expected columns must exist
    expect(columnNames).toContain("id");
    expect(columnNames).toContain("title");
    expect(columnNames).toContain("content");
    expect(columnNames).toContain("user_id");
    expect(columnNames).toContain("created_at");
    expect(columnNames).toContain("updated_at");
  });
});
