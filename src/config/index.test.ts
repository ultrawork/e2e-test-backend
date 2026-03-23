import { config } from "./index";

describe("config.corsOrigins", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns true when CORS_ORIGINS is not set", async () => {
    delete process.env.CORS_ORIGINS;
    const { config: freshConfig } = await import("./index");
    expect(freshConfig.corsOrigins).toBe(true);
  });

  it("returns true when CORS_ORIGINS is empty string", async () => {
    process.env.CORS_ORIGINS = "";
    const { config: freshConfig } = await import("./index");
    expect(freshConfig.corsOrigins).toBe(true);
  });

  it("returns '*' when CORS_ORIGINS is '*'", async () => {
    process.env.CORS_ORIGINS = "*";
    const { config: freshConfig } = await import("./index");
    expect(freshConfig.corsOrigins).toBe("*");
  });

  it("returns single string when CORS_ORIGINS has one value", async () => {
    process.env.CORS_ORIGINS = "http://localhost:3000";
    const { config: freshConfig } = await import("./index");
    expect(freshConfig.corsOrigins).toBe("http://localhost:3000");
  });

  it("returns array when CORS_ORIGINS has comma-separated values", async () => {
    process.env.CORS_ORIGINS = "http://localhost:3000,http://localhost:3001";
    const { config: freshConfig } = await import("./index");
    expect(freshConfig.corsOrigins).toEqual([
      "http://localhost:3000",
      "http://localhost:3001",
    ]);
  });

  it("trims whitespace from values in comma-separated list", async () => {
    process.env.CORS_ORIGINS = " http://localhost:3000 , http://localhost:3001 ";
    const { config: freshConfig } = await import("./index");
    expect(freshConfig.corsOrigins).toEqual([
      "http://localhost:3000",
      "http://localhost:3001",
    ]);
  });

  it("filters empty values from comma-separated list", async () => {
    process.env.CORS_ORIGINS = "http://localhost:3000,,http://localhost:3001";
    const { config: freshConfig } = await import("./index");
    expect(freshConfig.corsOrigins).toEqual([
      "http://localhost:3000",
      "http://localhost:3001",
    ]);
  });

  it("has corsOrigins property", () => {
    expect(config).toHaveProperty("corsOrigins");
  });
});
