/* eslint-disable @typescript-eslint/no-require-imports */
describe("config.corsOrigins", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("parses CORS_ORIGINS from env var", () => {
    process.env.CORS_ORIGINS = "http://example.com,http://other.com";
    const { config } = require("./index");
    expect(config.corsOrigins).toEqual([
      "http://example.com",
      "http://other.com",
    ]);
  });

  it("trims whitespace around origins", () => {
    process.env.CORS_ORIGINS = " http://a.com , http://b.com ";
    const { config } = require("./index");
    expect(config.corsOrigins).toEqual(["http://a.com", "http://b.com"]);
  });

  it("filters empty strings", () => {
    process.env.CORS_ORIGINS = "http://a.com,,http://b.com,";
    const { config } = require("./index");
    expect(config.corsOrigins).toEqual(["http://a.com", "http://b.com"]);
  });

  it("uses default origins when CORS_ORIGINS is not set", () => {
    delete process.env.CORS_ORIGINS;
    const { config } = require("./index");
    expect(config.corsOrigins).toEqual([
      "http://localhost:3000",
      "http://localhost:3001",
    ]);
  });

  it("uses default origins when CORS_ORIGINS is empty string", () => {
    process.env.CORS_ORIGINS = "";
    const { config } = require("./index");
    expect(config.corsOrigins).toEqual([
      "http://localhost:3000",
      "http://localhost:3001",
    ]);
  });
});
