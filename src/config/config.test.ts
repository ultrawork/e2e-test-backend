import { config } from "./index";

describe("config", () => {
  it("exports devUserId with default value", () => {
    expect(config.devUserId).toBeDefined();
    expect(typeof config.devUserId).toBe("string");
    expect(config.devUserId.length).toBeGreaterThan(0);
  });
});
