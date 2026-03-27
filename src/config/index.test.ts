import { parseCorsOrigins } from "./index";

describe("parseCorsOrigins", () => {
  it("returns empty array when input is empty string", () => {
    expect(parseCorsOrigins("")).toEqual([]);
  });

  it("returns empty array when input is only whitespace", () => {
    expect(parseCorsOrigins("  ")).toEqual([]);
  });

  it('returns "*" when input is "*"', () => {
    expect(parseCorsOrigins("*")).toBe("*");
  });

  it("parses comma-separated origins", () => {
    const result = parseCorsOrigins(
      "http://localhost:3000,http://localhost:8081,http://localhost:19006",
    );
    expect(result).toEqual([
      "http://localhost:3000",
      "http://localhost:8081",
      "http://localhost:19006",
    ]);
  });

  it("trims whitespace around origins", () => {
    expect(parseCorsOrigins(" http://a.com , http://b.com ")).toEqual([
      "http://a.com",
      "http://b.com",
    ]);
  });

  it("filters out empty entries from trailing commas", () => {
    expect(parseCorsOrigins("http://a.com,,http://b.com,")).toEqual([
      "http://a.com",
      "http://b.com",
    ]);
  });
});
