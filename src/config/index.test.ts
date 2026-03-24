import { parseCorsOrigins } from "./index";

describe("parseCorsOrigins", () => {
  it("returns false for empty string", () => {
    expect(parseCorsOrigins("")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(parseCorsOrigins(undefined)).toBe(false);
  });

  it("returns false for spaces only", () => {
    expect(parseCorsOrigins("  ")).toBe(false);
  });

  it("returns '*' for wildcard", () => {
    expect(parseCorsOrigins("*")).toBe("*");
  });

  it("returns '*' for wildcard with spaces", () => {
    expect(parseCorsOrigins(" * ")).toBe("*");
  });

  it("returns array with single origin", () => {
    expect(parseCorsOrigins("http://localhost:3000")).toEqual([
      "http://localhost:3000",
    ]);
  });

  it("returns array for comma-separated list", () => {
    expect(parseCorsOrigins("http://a.com,http://b.com")).toEqual([
      "http://a.com",
      "http://b.com",
    ]);
  });

  it("trims spaces in comma-separated list", () => {
    expect(parseCorsOrigins(" http://a.com , http://b.com ")).toEqual([
      "http://a.com",
      "http://b.com",
    ]);
  });

  it("deduplicates origins", () => {
    expect(parseCorsOrigins("http://a.com,http://a.com")).toEqual([
      "http://a.com",
    ]);
  });

  it("filters trailing comma (empty entries)", () => {
    expect(parseCorsOrigins("http://a.com,")).toEqual(["http://a.com"]);
  });
});
