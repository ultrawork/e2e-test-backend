import { parseCorsOrigins } from ".";

describe("parseCorsOrigins", () => {
  it("returns [] for empty string (no CORS_ORIGINS set)", () => {
    expect(parseCorsOrigins("")).toEqual([]);
  });

  it("returns [] for whitespace-only string", () => {
    expect(parseCorsOrigins("   ")).toEqual([]);
  });

  it("returns '*' for explicit wildcard", () => {
    expect(parseCorsOrigins("*")).toBe("*");
  });

  it("returns array for comma-separated origins", () => {
    expect(
      parseCorsOrigins(
        "http://localhost:3000,http://localhost:8081,http://localhost:19006",
      ),
    ).toEqual([
      "http://localhost:3000",
      "http://localhost:8081",
      "http://localhost:19006",
    ]);
  });

  it("trims whitespace around origins", () => {
    expect(parseCorsOrigins(" http://localhost:3000 , http://localhost:8081 ")).toEqual([
      "http://localhost:3000",
      "http://localhost:8081",
    ]);
  });
});
