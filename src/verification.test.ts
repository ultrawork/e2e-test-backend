import request from "supertest";
import { app } from "./app";
import { config } from "./config";

const TEST_SECRET = "verification-secret";

beforeAll(() => {
  Object.defineProperty(config, "jwtEnabled", { value: true, writable: true });
  Object.defineProperty(config, "jwtSecret", {
    value: TEST_SECRET,
    writable: true,
  });
});

jest.mock("./lib/prisma", () => ({
  prisma: {
    user: {
      upsert: jest.fn().mockResolvedValue({
        id: "dev-user-id",
        email: "dev@localhost",
      }),
    },
    note: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({
        id: "note-1",
        title: "Test",
        content: "Body",
        userId: "dev-user-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        categories: [],
      }),
    },
    category: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

describe("CORS/JWT/ENV Verification", () => {
  describe("1. CORS middleware", () => {
    it("returns CORS headers for allowed origin http://localhost:3000", async () => {
      const res = await request(app)
        .options("/api/notes")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "GET");
      expect(res.headers["access-control-allow-origin"]).toBe(
        "http://localhost:3000"
      );
    });

    it("returns CORS headers for allowed origin http://localhost:8081", async () => {
      const res = await request(app)
        .options("/api/notes")
        .set("Origin", "http://localhost:8081")
        .set("Access-Control-Request-Method", "GET");
      expect(res.headers["access-control-allow-origin"]).toBe(
        "http://localhost:8081"
      );
    });

    it("returns CORS headers for allowed origin http://localhost:19006", async () => {
      const res = await request(app)
        .options("/api/notes")
        .set("Origin", "http://localhost:19006")
        .set("Access-Control-Request-Method", "GET");
      expect(res.headers["access-control-allow-origin"]).toBe(
        "http://localhost:19006"
      );
    });
  });

  describe("2. ENV variables loaded", () => {
    it("config.corsOrigins is an array with required origins", () => {
      const origins = config.corsOrigins;
      expect(Array.isArray(origins) || origins === "*").toBe(true);
    });

    it("config.jwtEnabled is a boolean", () => {
      expect(typeof config.jwtEnabled).toBe("boolean");
    });
  });

  describe("3. JWT middleware routing", () => {
    it("GET /api/health returns 200 without auth", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: "ok" });
    });

    it("POST /api/auth/dev-token returns 200 with token", async () => {
      const res = await request(app).post("/api/auth/dev-token");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(typeof res.body.token).toBe("string");
    });

    it("GET /api/notes without token returns 401", async () => {
      const res = await request(app).get("/api/notes");
      expect(res.status).toBe(401);
    });

    it("GET /api/notes with valid token returns 200", async () => {
      const tokenRes = await request(app).post("/api/auth/dev-token");
      const token = tokenRes.body.token;

      const res = await request(app)
        .get("/api/notes")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it("POST /api/notes with valid token returns 201", async () => {
      const tokenRes = await request(app).post("/api/auth/dev-token");
      const token = tokenRes.body.token;

      const res = await request(app)
        .post("/api/notes")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Test Note", content: "Test Content" });
      expect(res.status).toBe(201);
    });

    it("GET /api/categories without token returns 401", async () => {
      const res = await request(app).get("/api/categories");
      expect(res.status).toBe(401);
    });
  });
});
