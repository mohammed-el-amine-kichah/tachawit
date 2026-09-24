import { describe, expect, it } from "vitest";
import { parseScriptPreference } from "./script/preference";
import { parseThemePreference } from "./theme/preference";

describe("parseScriptPreference", () => {
  it("accepts every supported script", () => {
    expect(parseScriptPreference("latin")).toBe("latin");
    expect(parseScriptPreference("arabic")).toBe("arabic");
    expect(parseScriptPreference("tifinagh")).toBe("tifinagh");
  });

  it("defaults to Latin for missing or unknown values", () => {
    expect(parseScriptPreference(undefined)).toBe("latin");
    expect(parseScriptPreference(null)).toBe("latin");
    expect(parseScriptPreference("")).toBe("latin");
    expect(parseScriptPreference("cyrillic")).toBe("latin");
  });
});

describe("parseThemePreference", () => {
  it("accepts light, dark and system", () => {
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("dark")).toBe("dark");
    expect(parseThemePreference("system")).toBe("system");
  });

  it("defaults to following the system", () => {
    expect(parseThemePreference(undefined)).toBe("system");
    expect(parseThemePreference("sepia")).toBe("system");
  });
});
