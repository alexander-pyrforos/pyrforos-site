import { describe, expect, it } from "vitest";
import { resolveTheme } from "../../public/js/theme.js";

describe("resolveTheme", () => {
  it("stored preference wins", () => {
    expect(resolveTheme("light", false)).toBe("light");
    expect(resolveTheme("dark", true)).toBe("dark");
  });

  it("follows system preference when nothing stored", () => {
    const systemLight = true;
    const systemDark = false;
    expect(resolveTheme(null, systemLight)).toBe("light");
    expect(resolveTheme(null, systemDark)).toBe("dark");
  });
});