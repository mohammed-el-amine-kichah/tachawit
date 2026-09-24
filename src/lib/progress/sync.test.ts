import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readOutbox, type OutboxOperation } from "./outbox";
import { syncProgress } from "./sync";

const op = (levelId: string): OutboxOperation => ({
  kind: "complete_level",
  levelId,
  stars: 3,
  xp: 10,
  entryIds: [],
  today: "2026-09-24",
});

function fakeClient(fail: Record<string, { code: string }> = {}) {
  const sent: string[] = [];
  const client = {
    rpc: async (_name: string, args: { p_level_id: string }) => {
      sent.push(args.p_level_id);
      return { error: fail[args.p_level_id] ?? null };
    },
  };
  return { sent, load: async () => client as never };
}

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    },
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("syncProgress", () => {
  it("keeps the operation in the outbox even when the Supabase client cannot load (offline)", async () => {
    const ok = await syncProgress(() => Promise.reject(new Error("offline")), "u1", op("a"));
    expect(ok).toBe(false);
    expect(readOutbox("u1")).toEqual([op("a")]);
  });

  it("sends pending operations oldest first, then empties the outbox", async () => {
    await syncProgress(() => Promise.reject(new Error("offline")), "u1", op("a"));
    const { sent, load } = fakeClient();
    expect(await syncProgress(load, "u1", op("b"))).toBe(true);
    expect(sent).toEqual(["a", "b"]);
    expect(readOutbox("u1")).toEqual([]);
  });

  it("stops at the first failure and keeps it and everything after it", async () => {
    const { sent, load } = fakeClient({ a: { code: "08006" } });
    await syncProgress(() => Promise.reject(new Error("offline")), "u1", op("a"));
    expect(await syncProgress(load, "u1", op("b"))).toBe(false);
    expect(sent).toEqual(["a"]);
    expect(readOutbox("u1")).toEqual([op("a"), op("b")]);
  });

  it("drops an operation the server rejects as out of date, so it never blocks the queue", async () => {
    const { sent, load } = fakeClient({ a: { code: "22023" } });
    await syncProgress(() => Promise.reject(new Error("offline")), "u1", op("a"));
    expect(await syncProgress(load, "u1", op("b"))).toBe(true);
    expect(sent).toEqual(["a", "b"]);
    expect(readOutbox("u1")).toEqual([]);
  });
});
