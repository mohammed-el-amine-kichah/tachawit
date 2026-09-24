import { describe, expect, it } from "vitest";
import { readArray, readInt, readNullableString, readNumber, readRecord, readString } from "./guards";

describe("progress guards", () => {
  it("reads integers within bounds only", () => {
    expect(readInt(2, 0, 3)).toBe(2);
    expect(readInt(4, 0, 3)).toBeNull();
    expect(readInt(1.5)).toBeNull();
    expect(readInt("2")).toBeNull();
  });

  it("reads finite numbers above a minimum", () => {
    expect(readNumber(2.5, 1.3)).toBe(2.5);
    expect(readNumber(1.2, 1.3)).toBeNull();
    expect(readNumber(Number.NaN)).toBeNull();
  });

  it("tells a null string apart from a missing one", () => {
    expect(readNullableString(null)).toBeNull();
    expect(readNullableString("x")).toBe("x");
    expect(readNullableString(undefined)).toBeUndefined();
    expect(readString(3)).toBeNull();
  });

  it("rejects a whole record or array when one item is invalid", () => {
    expect(readRecord({ a: 1, b: 2 }, (v) => readInt(v))).toEqual({ a: 1, b: 2 });
    expect(readRecord({ a: 1, b: "x" }, (v) => readInt(v))).toBeNull();
    expect(readRecord([1], (v) => readInt(v))).toBeNull();
    expect(readArray(["a", "b"], readString)).toEqual(["a", "b"]);
    expect(readArray(["a", 1], readString)).toBeNull();
  });
});
