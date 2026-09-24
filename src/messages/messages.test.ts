import { describe, expect, it } from "vitest";
import { getContentKey, locales } from "@/i18n/config";
import ar from "./ar.json";
import dz from "./dz.json";
import en from "./en.json";
import fr from "./fr.json";

type Messages = { [key: string]: string | Messages };

const catalogs: Record<string, Messages> = { en, fr, ar, dz };

function flatten(messages: Messages, prefix = ""): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of Object.entries(messages)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") result.set(path, value);
    else for (const [k, v] of flatten(value, path)) result.set(k, v);
  }
  return result;
}

function placeholders(message: string): string[] {
  // Arguments look like {name} or {name, plural, ...}; plural branches like "one {text}" are not arguments.
  const names = [...message.matchAll(/(?<!(?:=\d+|zero|one|two|few|many|other)\s*)\{\s*(\w+)\s*[,}]/g)].map((m) => m[1]);
  return [...new Set(names)].sort();
}

const reference = flatten(en);

describe("UI message catalogs", () => {
  it.each(locales)("%s has exactly the same keys as English", (locale) => {
    const keys = [...flatten(catalogs[getContentKey(locale)]).keys()].sort();
    expect(keys).toEqual([...reference.keys()].sort());
  });

  it.each(locales)("%s has no empty messages", (locale) => {
    for (const [key, value] of flatten(catalogs[getContentKey(locale)])) {
      expect(value.trim(), `${locale}: ${key}`).not.toBe("");
    }
  });

  it.each(locales)("%s uses the same placeholders as English", (locale) => {
    for (const [key, value] of flatten(catalogs[getContentKey(locale)])) {
      expect(placeholders(value), `${locale}: ${key}`).toEqual(placeholders(reference.get(key) ?? ""));
    }
  });
});
