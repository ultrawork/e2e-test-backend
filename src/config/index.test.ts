import { parseCorsOrigins, config } from "./index";

describe("parseCorsOrigins", () => {
  it("returns true when input is undefined", () => {
    expect(parseCorsOrigins(undefined)).toBe(true);
  });

  it("returns true when input is empty string", () => {
    expect(parseCorsOrigins("")).toBe(true);
  });

  it("returns true when input is whitespace only", () => {
    expect(parseCorsOrigins("   ")).toBe(true);
  });

  it("returns '*' when input is '*'", () => {
    expect(parseCorsOrigins("*")).toBe("*");
  });

  it("returns single origin string as-is", () => {
    expect(parseCorsOrigins("http://localhost:3000")).toBe(
      "http://localhost:3000"
    );
  });

  it("returns array for comma-separated origins", () => {
    expect(parseCorsOrigins("http://a.com, http://b.com")).toEqual([
      "http://a.com",
      "http://b.com",
    ]);
  });

  it("trims whitespace and filters empty elements from list", () => {
    expect(
      parseCorsOrigins(" http://a.com , , http://b.com , ")
    ).toEqual(["http://a.com", "http://b.com"]);
  });

  it("returns true when all comma-separated elements are empty", () => {
    expect(parseCorsOrigins(" , , ")).toBe(true);
  });
});

describe("config", () => {
  it("has corsOrigins field", () => {
    expect("corsOrigins" in config).toBe(true);
  });
});
